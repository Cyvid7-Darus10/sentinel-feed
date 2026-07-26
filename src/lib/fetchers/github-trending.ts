import * as cheerio from 'cheerio';
import type { Story } from '../types';
import { createStory } from './create-story';
import { FETCHER_TIMEOUT_MS } from '../config';

const GITHUB_TRENDING_URL = 'https://github.com/trending';
const GITHUB_ORIGIN = 'https://github.com';
const LANGUAGES = ['typescript', 'python', 'go', 'rust'];
// Defensive ceiling per language page in case the markup ever balloons.
const MAX_REPOS_PER_LANGUAGE = 25;

interface TrendingRepo {
  owner: string;
  repo: string;
  description: string;
  language: string;
  starsToday: number;
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

      stories.push(createStory('github-trending', {
        id: `gh-${repo.owner}-${repo.repo}`,
        title: `${repo.owner}/${repo.repo}`,
        url: repo.url,
        score: repo.starsToday,
        author: repo.owner,
        description: repo.description || null,
        tags: repo.language ? [repo.language.toLowerCase()] : [],
      }));
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
    signal: AbortSignal.timeout(FETCHER_TIMEOUT_MS),
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
    if (repos.length >= MAX_REPOS_PER_LANGUAGE) return false;
    const $el = $(el);

    const repoLink = $el.find('h2 a').attr('href')?.trim();
    if (!repoLink) return;

    // Resolve against the fixed origin and confirm the host, so unexpected
    // markup (an absolute or protocol-relative href) fails closed rather than
    // producing a malformed, host-confusable URL by string concatenation.
    let repoUrl: URL;
    try {
      repoUrl = new URL(repoLink, GITHUB_ORIGIN);
    } catch {
      return;
    }
    if (repoUrl.hostname !== 'github.com') return;

    const parts = repoUrl.pathname.split('/').filter(Boolean);
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

    repos.push({
      owner,
      repo,
      description,
      language,
      starsToday,
      url: repoUrl.toString(),
    });
  });

  return repos;
}
