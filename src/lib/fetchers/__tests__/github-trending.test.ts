import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchGithubTrending } from '../github-trending';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const TRENDING_HTML = `
<html>
<body>
  <article class="Box-row">
    <h2><a href="/owner1/repo1">owner1/repo1</a></h2>
    <p class="col-9">A cool TypeScript framework</p>
    <span itemprop="programmingLanguage">TypeScript</span>
    <a class="Link--muted" href="/owner1/repo1/stargazers">12,345</a>
    <span class="d-inline-block float-sm-right">456 stars today</span>
  </article>
  <article class="Box-row">
    <h2><a href="/owner2/repo2">owner2/repo2</a></h2>
    <p class="col-9">Another great tool</p>
    <span itemprop="programmingLanguage">Python</span>
    <a class="Link--muted" href="/owner2/repo2/stargazers">5,678</a>
    <span class="d-inline-block float-sm-right">123 stars today</span>
  </article>
</body>
</html>
`;

function mockHtmlResponse(html: string, ok = true, status = 200) {
  return {
    ok,
    status,
    text: () => Promise.resolve(html),
  };
}

describe('fetchGithubTrending', () => {
  it('fetches trending repos from multiple languages', async () => {
    // 4 language fetches (typescript, python, go, rust)
    mockFetch.mockResolvedValue(mockHtmlResponse(TRENDING_HTML));

    const stories = await fetchGithubTrending();

    // Should have called fetch 4 times (one per language)
    expect(mockFetch).toHaveBeenCalledTimes(4);

    // Should dedupe repos that appear in multiple languages
    expect(stories).toHaveLength(2);
  });

  it('creates correct Story objects', async () => {
    mockFetch.mockResolvedValue(mockHtmlResponse(TRENDING_HTML));

    const stories = await fetchGithubTrending();
    const first = stories[0];

    expect(first.id).toBe('gh-owner1-repo1');
    expect(first.source).toBe('github-trending');
    expect(first.title).toBe('owner1/repo1');
    expect(first.url).toBe('https://github.com/owner1/repo1');
    expect(first.author).toBe('owner1');
    expect(first.description).toBe('A cool TypeScript framework');
    expect(first.relevant).toBe(true);
    expect(first.summary).toBeNull();
    expect(first.publishedAt).toBeNull();
  });

  it('deduplicates repos across languages', async () => {
    // All 4 languages return same repos
    mockFetch.mockResolvedValue(mockHtmlResponse(TRENDING_HTML));

    const stories = await fetchGithubTrending();
    const ids = stories.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('handles fetch errors for individual languages gracefully', async () => {
    // First language succeeds
    mockFetch.mockResolvedValueOnce(mockHtmlResponse(TRENDING_HTML));
    // Remaining languages fail
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const stories = await fetchGithubTrending();
    // Should still have stories from the first successful language
    expect(stories.length).toBeGreaterThan(0);
  });

  it('handles empty HTML (no trending repos)', async () => {
    mockFetch.mockResolvedValue(
      mockHtmlResponse('<html><body></body></html>')
    );

    const stories = await fetchGithubTrending();
    expect(stories).toHaveLength(0);
  });

  it('handles article without repo link', async () => {
    const html = `
      <html><body>
        <article class="Box-row">
          <h2><a></a></h2>
        </article>
      </body></html>
    `;
    mockFetch.mockResolvedValue(mockHtmlResponse(html));

    const stories = await fetchGithubTrending();
    expect(stories).toHaveLength(0);
  });

  it('handles article with single-part path', async () => {
    const html = `
      <html><body>
        <article class="Box-row">
          <h2><a href="/onlyowner">onlyowner</a></h2>
        </article>
      </body></html>
    `;
    mockFetch.mockResolvedValue(mockHtmlResponse(html));

    const stories = await fetchGithubTrending();
    expect(stories).toHaveLength(0);
  });

  it('sets tags from programming language', async () => {
    mockFetch.mockResolvedValue(mockHtmlResponse(TRENDING_HTML));

    const stories = await fetchGithubTrending();
    expect(stories[0].tags).toContain('typescript');
  });

  it('handles missing description', async () => {
    const html = `
      <html><body>
        <article class="Box-row">
          <h2><a href="/owner/repo">owner/repo</a></h2>
          <span itemprop="programmingLanguage">Go</span>
        </article>
      </body></html>
    `;
    mockFetch.mockResolvedValue(mockHtmlResponse(html));

    const stories = await fetchGithubTrending();
    // Empty string becomes null
    expect(stories[0].description).toBe(null);
  });

  it('handles HTTP error status', async () => {
    mockFetch.mockResolvedValue(mockHtmlResponse('', false, 429));

    // All 4 languages fail, but allSettled catches them
    const stories = await fetchGithubTrending();
    expect(stories).toHaveLength(0);
  });
});
