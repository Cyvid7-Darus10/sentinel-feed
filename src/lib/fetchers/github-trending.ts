import * as cheerio from 'cheerio';
import type { Story } from '../types';

const GITHUB_TRENDING_URL = 'https://github.com/trending';
const LANGUAGES = ['typescript', 'python', 'go', 'rust'];

interface TrendingRepo {
  owner: string;
  repo: string;
  description: string;
  language: string;
  starsToday: number;
  totalStars: number;
  url: string;
}

export async function fetchGithubTrending(): Promise<Story[]> {
  const results = await Promise.allSettled(
    LANGUAGES.map((lang) => fetchLanguage(lang))
  );

  const seen = new Set<string>();
  const stories: Story[] = [];

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    for (const repo of result.value) {
      const key = `${repo.owner}/${repo.repo}`;
      if (seen.has(key)) continue;
      seen.add(key);

      stories.push({
        id: `gh-${repo.owner}-${repo.repo}`,
        source: 'github-trending',
        title: `${repo.owner}/${repo.repo}`,
        url: repo.url,
        score: repo.starsToday,
        author: repo.owner,
        description: repo.description || null,
        tags: repo.language ? [repo.language.toLowerCase()] : [],
        summary: null,
        relevant: true,
        fetchedAt: new Date().toISOString(),
        publishedAt: null,
      });
    }
  }

  return stories;
}

async function fetchLanguage(language: string): Promise<TrendingRepo[]> {
  const res = await fetch(`${GITHUB_TRENDING_URL}/${language}?since=daily`, {
    headers: {
      'User-Agent': 'SentinelFeed/1.0',
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`GitHub trending ${language}: ${res.status}`);
  }

  const html = await res.text();
  return parseTrendingHtml(html);
}

function parseTrendingHtml(html: string): TrendingRepo[] {
  const $ = cheerio.load(html);
  const repos: TrendingRepo[] = [];

  $('article.Box-row').each((_, el) => {
    const $el = $(el);

    const repoLink = $el.find('h2 a').attr('href')?.trim();
    if (!repoLink) return;

    const parts = repoLink.split('/').filter(Boolean);
    if (parts.length < 2) return;
    const [owner, repo] = parts;

    const description = $el.find('p.col-9').text().trim();

    const langEl = $el.find('[itemprop="programmingLanguage"]');
    const language = langEl.text().trim();

    const starsText = $el.find('.float-sm-right, .d-inline-block.float-sm-right').text().trim();
    const starsMatch = starsText.match(/([\d,]+)\s*stars?\s*today/i);
    const starsToday = starsMatch
      ? parseInt(starsMatch[1].replace(/,/g, ''), 10)
      : 0;

    const totalStarsEl = $el.find('a.Link--muted[href$="/stargazers"]');
    const totalStarsText = totalStarsEl.text().trim().replace(/,/g, '');
    const totalStars = parseInt(totalStarsText, 10) || 0;

    repos.push({
      owner,
      repo,
      description,
      language,
      starsToday,
      totalStars,
      url: `https://github.com${repoLink}`,
    });
  });

  return repos;
}
