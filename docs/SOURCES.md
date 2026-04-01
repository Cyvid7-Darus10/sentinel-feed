# Tech News Sources Research

> Research conducted April 1, 2026. Verified endpoints, auth requirements, and rate limits.

## Summary Matrix

| # | Source | Category | Access Method | Auth | Rate Limit | Signal | Freshness | Verdict |
|---|--------|----------|--------------|------|------------|--------|-----------|---------|
| 1 | Hacker News | General | REST API (Firebase) | None | Unlimited | High | Real-time | INCLUDE (Phase 1) |
| 2 | Lobsters | General | JSON endpoints | None | Be polite (~1/min) | Very High | Real-time | INCLUDE (Phase 1) |
| 3 | Dev.to | Developer | REST API (Forem) | API key (free) | 30 req/min | Medium | Real-time | INCLUDE (Phase 1) |
| 4 | GitHub Trending | Code | Scrape HTML | None | ~60 req/hr | High | Daily | INCLUDE (Phase 1) |
| 5 | GitHub Releases | Code | Atom feeds + REST | None (or PAT) | 60/hr unauth, 5000/hr auth | High | Per-release | INCLUDE (Phase 1) |
| 6 | TechCrunch | General | RSS | None | Unlimited | Medium | ~10/day | INCLUDE (Phase 1) |
| 7 | Ars Technica | General | RSS | None | Unlimited | High | ~10/day | INCLUDE (Phase 1) |
| 8 | The Verge | General | RSS | None | Unlimited | Medium | ~20/day | INCLUDE (Phase 2) |
| 9 | Wired | General | RSS | None | Unlimited | Medium | ~5/day | SKIP |
| 10 | Product Hunt | Code | GraphQL API | OAuth token | Undocumented | Medium | Daily | INCLUDE (Phase 2) |
| 11 | Hashnode | Developer | GraphQL API | None (public) | Undocumented | Medium-Low | Real-time | SKIP |
| 12 | daily.dev | Developer | No public API | N/A | N/A | High (curated) | Real-time | SKIP |
| 13 | InfoQ | Developer | RSS | None | Unlimited | High | ~5/day | INCLUDE (Phase 2) |
| 14 | DZone | Developer | RSS | None | Unlimited | Medium | ~10/day | SKIP |
| 15 | Reddit | Social | REST API | OAuth (free tier) | 100 req/min | Variable | Real-time | INCLUDE (Phase 2) |
| 16 | Anthropic Blog | AI/ML | Scrape or RSSHub | None | N/A | Very High | ~2/week | INCLUDE (Phase 1) |
| 17 | OpenAI Blog | AI/ML | RSS | None | Unlimited | Very High | ~3/week | INCLUDE (Phase 1) |
| 18 | Google AI Blog | AI/ML | RSS | None | Unlimited | High | ~3/week | INCLUDE (Phase 1) |
| 19 | Hugging Face Papers | AI/ML | REST API | None | Undocumented | Very High | Daily | INCLUDE (Phase 1) |
| 20 | Papers with Code | AI/ML | REST API | None (read) | Undocumented | High | Daily | INCLUDE (Phase 2) |
| 21 | arXiv | AI/ML | REST API | None | 3 req/sec | Research-grade | Daily | INCLUDE (Phase 2) |
| 22 | Next.js Releases | Changelog | GitHub Atom | None | Unlimited | High | Per-release | INCLUDE (Phase 1) |
| 23 | React Releases | Changelog | GitHub Atom | None | Unlimited | High | Per-release | INCLUDE (Phase 1) |
| 24 | Node.js Releases | Changelog | GitHub Atom | None | Unlimited | High | Per-release | INCLUDE (Phase 1) |
| 25 | TypeScript Releases | Changelog | GitHub Atom | None | Unlimited | High | Per-release | INCLUDE (Phase 1) |
| 26 | Python Releases | Changelog | RSS | None | Unlimited | High | Per-release | INCLUDE (Phase 1) |
| 27 | Vercel Changelog | Changelog | Scrape or RSSHub | None | N/A | High | ~3/week | INCLUDE (Phase 2) |
| 28 | TLDR Newsletter | Newsletter | RSS (community) | None | Unlimited | High (curated) | Daily | INCLUDE (Phase 2) |
| 29 | JavaScript Weekly | Newsletter | RSS | None | Unlimited | Very High | Weekly | INCLUDE (Phase 2) |
| 30 | Python Weekly | Newsletter | RSS | None | Unlimited | High | Weekly | INCLUDE (Phase 2) |
| 31 | Engineering Blogs | Developer | RSS | None | Unlimited | Very High | Variable | INCLUDE (Phase 2) |

---

## A. General Tech News

### 1. Hacker News -- INCLUDE (Phase 1)

**Access:** REST API via Firebase
**Base URL:** `https://hacker-news.firebaseio.com/v0`
**Auth:** None
**Rate Limit:** No documented limit (Firebase-hosted, very permissive)
**Signal:** High -- community-curated, strong developer focus
**Freshness:** Real-time, hundreds of new stories daily

**Endpoints:**
| Endpoint | Returns |
|----------|---------|
| `/topstories.json` | Up to 500 story IDs sorted by rank |
| `/beststories.json` | Top stories by score |
| `/newstories.json` | 500 newest stories |
| `/showstories.json` | Up to 200 Show HN stories |
| `/askstories.json` | Up to 200 Ask HN stories |
| `/item/{id}.json` | Single story/comment/poll item |
| `/updates.json` | Recently changed items and profiles |

**Item fields:** `id`, `type`, `by`, `time`, `title`, `url`, `score`, `descendants`, `kids[]`, `text`

**Also available:** RSS at `https://news.ycombinator.com/rss` (top 30 only, less useful)

**Strategy:** Fetch `/topstories.json`, take top 30 IDs, batch-fetch items with `Promise.allSettled`. Filter by score > 50 for signal.

---

### 2. Lobsters -- INCLUDE (Phase 1)

**Access:** JSON endpoints (append `.json` to any page)
**Base URL:** `https://lobste.rs`
**Auth:** None
**Rate Limit:** No documented limit, but be respectful (~1 request/minute)
**Signal:** Very High -- invite-only community, strong CS/programming focus, lower noise than HN
**Freshness:** Real-time, ~30-50 stories/day

**Endpoints:**
| Endpoint | Returns |
|----------|---------|
| `/hottest.json` | Hottest stories (front page) |
| `/newest.json` | Newest stories |
| `/s/{short_id}.json` | Single story with comments |
| `/t/{tag}.json` | Stories by tag |
| `/hottest.rss` | RSS feed of hottest stories |
| `/newest.rss` | RSS feed of newest stories |

**Item fields:** `short_id`, `title`, `url`, `score`, `flags`, `comment_count`, `description`, `submitter_user`, `user_is_author`, `tags[]`, `short_id_url`, `comments_url`, `created_at`

**Tags of interest:** `ai`, `ml`, `programming`, `release`, `devops`, `security`, `web`, `rust`, `python`, `javascript`

**Strategy:** Fetch `/hottest.json` every 30 minutes. Higher signal-to-noise than HN due to invite-only community and mandatory tagging.

---

### 3. TechCrunch -- INCLUDE (Phase 1)

**Access:** RSS feed
**Feed URL:** `https://techcrunch.com/feed/`
**Auth:** None
**Rate Limit:** Standard RSS (unlimited reasonable polling)
**Signal:** Medium -- broad tech news, includes startup funding noise
**Freshness:** ~10-15 articles/day

**Category-specific feeds:**
- Startups: `https://techcrunch.com/startups/feed/`
- AI: `https://techcrunch.com/category/artificial-intelligence/feed/`

**Strategy:** Fetch main feed every 2 hours. Filter with AI for developer relevance. Full article content available in RSS.

---

### 4. Ars Technica -- INCLUDE (Phase 1)

**Access:** RSS feed
**Feed URL:** `http://feeds.arstechnica.com/arstechnica/index/`
**Auth:** None
**Rate Limit:** Standard RSS
**Signal:** High -- in-depth technical reporting, less noise than TechCrunch
**Freshness:** ~10 articles/day

**Strategy:** Fetch every 2 hours. Ars provides excerpts in RSS; full articles need scraping. Good for deep-dive technical stories.

---

### 5. The Verge -- INCLUDE (Phase 2)

**Access:** RSS feed
**Feed URLs:**
- Full site: `https://www.theverge.com/rss/index.xml`
- Full content: `http://www.theverge.com/rss/full.xml`

**Auth:** None
**Rate Limit:** Standard RSS
**Signal:** Medium -- consumer tech heavy, but covers major platform news
**Freshness:** ~20 articles/day

**Verdict:** Phase 2 because content skews consumer; overlap with TechCrunch/Ars.

---

### 6. Wired -- SKIP

**Access:** RSS at `https://www.wired.com/feed/rss`
**Auth:** None
**Signal:** Medium -- long-form, magazine-style. Rarely breaking dev news.
**Reason for skip:** Low freshness, consumer focus, high overlap with other general sources. Not worth the noise.

---

## B. Developer-Specific

### 7. Dev.to (Forem) -- INCLUDE (Phase 1)

**Access:** REST API (Forem v1)
**Base URL:** `https://dev.to/api`
**Auth:** API key required (free, get from Settings > Extensions > API Keys)
**Rate Limit:** 30 requests/minute (authenticated), 10/min (unauthenticated)
**Signal:** Medium -- community posts vary in quality, but good for tutorials/announcements
**Freshness:** Real-time, hundreds of posts/day

**Key Endpoints:**
| Endpoint | Description |
|----------|-------------|
| `GET /articles` | List published articles (paginated, 30/page) |
| `GET /articles?top=7` | Top articles from past 7 days |
| `GET /articles?tag=javascript` | Filter by tag |
| `GET /articles?username=devteam` | Articles by user/org |
| `GET /articles/{id}` | Single article with full body |

**Headers required:**
```
Accept: application/vnd.forem.api-v1+json
api-key: {your_api_key}
User-Agent: SentinelFeed/1.0
```

**Response fields:** `id`, `title`, `description`, `url`, `published_at`, `tag_list`, `positive_reactions_count`, `comments_count`, `reading_time_minutes`, `user`

**Strategy:** Fetch `/articles?top=7` daily. Use tags `ai`, `javascript`, `typescript`, `python`, `devops`, `webdev`. Filter by `positive_reactions_count > 20` for quality.

---

### 8. Hashnode -- SKIP

**Access:** GraphQL API at `https://gql.hashnode.com`
**Auth:** None for public queries
**Signal:** Medium-Low -- individual blogs, inconsistent quality
**Reason for skip:** GraphQL complexity, no "trending" or "top" endpoint, content overlaps with Dev.to. Hashnode content already appears in daily.dev.

---

### 9. daily.dev -- SKIP

**Access:** No public API
**Signal:** High (it aggregates and curates)
**Reason for skip:** No API available. They have a browser extension only. There is an open GitHub discussion requesting RSS/API with no resolution.

---

### 10. InfoQ -- INCLUDE (Phase 2)

**Access:** RSS feed
**Feed URL:** `https://feed.infoq.com/`
**Auth:** None
**Signal:** High -- enterprise-grade technical content, architecture deep dives
**Freshness:** ~5 articles/day

**Topic feeds:**
- `https://feed.infoq.com/development`
- `https://feed.infoq.com/java`
- `https://feed.infoq.com/dotnet`
- `https://feed.infoq.com/microservices`
- `https://feed.infoq.com/ai-ml-data-eng`

**Verdict:** Phase 2. High quality but lower volume. Good for architecture/enterprise perspective.

---

### 11. DZone -- SKIP

**Access:** RSS at `https://feeds.dzone.com/home`
**Signal:** Medium -- article quality varies widely, lots of sponsored content
**Reason for skip:** Lower signal than InfoQ, significant sponsored/promotional content noise.

---

## C. Code & Repos

### 12. GitHub Trending -- INCLUDE (Phase 1)

Already documented in RESEARCH.md. Scrape HTML.

**URL:** `https://github.com/trending/{language}?since={daily|weekly|monthly}`
**Auth:** None
**Strategy:** Scrape daily for `typescript`, `python`, `rust`, `go`. Use cheerio selectors.

---

### 13. GitHub Releases (Atom Feeds) -- INCLUDE (Phase 1)

**Access:** Atom feeds (XML) -- no API auth needed
**Format:** `https://github.com/{owner}/{repo}/releases.atom`
**Auth:** None for public repos
**Rate Limit:** Standard GitHub rate limits for web (generous for Atom)
**Signal:** Very High -- authoritative release information
**Freshness:** Per-release

**Key repos to monitor:**

| Framework | Feed URL |
|-----------|----------|
| Next.js | `https://github.com/vercel/next.js/releases.atom` |
| React | `https://github.com/facebook/react/releases.atom` |
| Node.js | `https://github.com/nodejs/node/releases.atom` |
| TypeScript | `https://github.com/microsoft/TypeScript/releases.atom` |
| Bun | `https://github.com/oven-sh/bun/releases.atom` |
| Deno | `https://github.com/denoland/deno/releases.atom` |
| Rust | `https://github.com/rust-lang/rust/releases.atom` |
| Go | `https://github.com/golang/go/releases.atom` |
| Python (CPython) | `https://github.com/python/cpython/releases.atom` |
| Tailwind CSS | `https://github.com/tailwindlabs/tailwindcss/releases.atom` |
| Vite | `https://github.com/vitejs/vite/releases.atom` |
| SvelteKit | `https://github.com/sveltejs/kit/releases.atom` |
| Astro | `https://github.com/withastro/astro/releases.atom` |
| Turbopack | `https://github.com/vercel/turborepo/releases.atom` |
| ESLint | `https://github.com/eslint/eslint/releases.atom` |
| Prettier | `https://github.com/prettier/prettier/releases.atom` |
| Docker | `https://github.com/moby/moby/releases.atom` |
| Kubernetes | `https://github.com/kubernetes/kubernetes/releases.atom` |

**Also via REST API:**
```
GET https://api.github.com/repos/{owner}/{repo}/releases
GET https://api.github.com/repos/{owner}/{repo}/releases/latest
```
- Unauth: 60 req/hr
- With PAT: 5,000 req/hr

**Atom feed fields:** `title`, `link`, `updated`, `author`, `content` (release notes as HTML)

**Strategy:** Poll Atom feeds every 6 hours. Parse XML. Only surface major/minor releases (filter out patch/pre-release if noisy). Atom feeds are lightweight and don't count against API rate limits.

---

### 14. Product Hunt -- INCLUDE (Phase 2)

**Access:** GraphQL API
**Endpoint:** `https://api.producthunt.com/v2/api/graphql`
**Auth:** OAuth2 required. Get developer token from `https://api.producthunt.com/v2/oauth/applications`
**Rate Limit:** Undocumented but reportedly generous
**Signal:** Medium -- tech product launches, some noise from non-dev products
**Freshness:** Daily (batch of launches each day)

**Key query:**
```graphql
query {
  posts(order: VOTES, first: 10) {
    edges {
      node {
        id
        name
        tagline
        votesCount
        url
        topics { edges { node { name } } }
      }
    }
  }
}
```

**Verdict:** Phase 2 -- requires OAuth setup, content is hit-or-miss for pure dev news. Good for discovering new dev tools.

---

## D. AI/ML Specific

### 15. Anthropic Blog -- INCLUDE (Phase 1)

**Access:** No official RSS feed found. Use RSSHub or scrape.
**Blog URL:** `https://www.anthropic.com/news`
**Research URL:** `https://www.anthropic.com/research`
**Auth:** None
**Signal:** Very High -- primary source for Claude updates
**Freshness:** ~2 posts/week

**Options:**
1. **RSSHub:** Use `https://rsshub.app/anthropic/news` (community-maintained, may break)
2. **Scrape:** Fetch `https://www.anthropic.com/news` and parse article links
3. **GitHub:** Monitor `https://github.com/anthropics` releases via Atom feeds

**Strategy:** Scrape the news page every 6 hours. Low volume makes it trivial. Also monitor:
- `https://github.com/anthropics/anthropic-sdk-python/releases.atom`
- `https://github.com/anthropics/anthropic-sdk-typescript/releases.atom`
- `https://github.com/anthropics/claude-code/releases.atom`

---

### 16. OpenAI Blog -- INCLUDE (Phase 1)

**Access:** RSS feed
**Feed URL:** `https://openai.com/news/rss.xml`
**Engineering feed:** `https://openai.com/news/engineering/rss.xml`
**Auth:** None
**Signal:** Very High -- primary source for GPT/API updates
**Freshness:** ~3 posts/week

**Strategy:** Poll RSS every 6 hours. Engineering feed has higher signal for developers.

---

### 17. Google AI Blog -- INCLUDE (Phase 1)

**Access:** RSS feed
**Feed URL:** `https://blog.research.google/feeds/posts/default?alt=rss`
**Also:** `http://googleresearch.blogspot.com/atom.xml`
**Auth:** None
**Signal:** High -- Gemini updates, research breakthroughs
**Freshness:** ~3 posts/week

**Strategy:** Poll RSS every 6 hours.

---

### 18. Hugging Face Daily Papers -- INCLUDE (Phase 1)

**Access:** REST API + web page
**Trending papers:** `https://huggingface.co/papers`
**API endpoint:** `https://huggingface.co/api/daily_papers`
**Paper content:** `https://huggingface.co/papers/{PAPER_ID}.md`
**Auth:** None
**Rate Limit:** Undocumented, reasonable use expected
**Signal:** Very High -- community-curated AI research, upvote system
**Freshness:** Daily (new papers every day)

**Strategy:** Fetch `/api/daily_papers` once daily. Get paper metadata (title, authors, upvotes, abstract). High signal for AI/ML developments.

---

### 19. Papers with Code -- INCLUDE (Phase 2)

**Access:** REST API
**Base URL:** `https://paperswithcode.com/api/v1/`
**Docs:** `https://paperswithcode.com/api/v1/docs/`
**Python client:** `pip install paperswithcode-client`
**Auth:** None for reads, API token for writes
**Rate Limit:** Undocumented
**Signal:** High -- papers with actual implementations
**Freshness:** Daily

**Key endpoints:**
| Endpoint | Description |
|----------|-------------|
| `GET /papers/` | Paginated list of papers |
| `GET /papers/?q=search_term` | Search papers |
| `GET /papers/{id}/repositories/` | Code repos for a paper |

**Verdict:** Phase 2. Overlaps with HF Papers for discovery. Unique value is the code linkage.

---

### 20. arXiv -- INCLUDE (Phase 2)

**Access:** REST API
**Base URL:** `http://export.arxiv.org/api/query`
**Auth:** None
**Rate Limit:** 3 requests/second (enforced, will throttle)
**Signal:** Research-grade -- raw papers, no curation
**Freshness:** Daily submissions

**Example query:**
```
GET http://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=20
```

**Categories of interest:** `cs.AI`, `cs.CL`, `cs.LG`, `cs.CV`, `cs.SE`

**Verdict:** Phase 2. Raw feed needs heavy AI filtering. HF Papers is better curated for Phase 1.

---

## E. Framework/Platform Changelogs

### 21. GitHub Releases Atom Feeds -- INCLUDE (Phase 1)

See Section C.13 above for complete list. All follow the pattern:
```
https://github.com/{owner}/{repo}/releases.atom
```

No auth, no rate limit concerns for Atom feeds. Parse with standard XML parser.

---

### 22. Python Releases -- INCLUDE (Phase 1)

**Access:** RSS feed
**Feed URL:** `https://blog.python.org/feeds/posts/default?alt=rss`
**Also:** `https://github.com/python/cpython/releases.atom`
**Auth:** None
**Freshness:** Per-release

---

### 23. Vercel Changelog -- INCLUDE (Phase 2)

**Access:** No official RSS feed. Scrape or use RSSHub.
**URL:** `https://vercel.com/changelog`
**Signal:** High for Vercel users
**Freshness:** ~3 updates/week

**Options:**
1. Scrape the changelog page
2. RSSHub: `https://rsshub.app/vercel/changelog`
3. Monitor `@vercel` announcements

**Verdict:** Phase 2. Requires scraping. Vercel platform changes are relevant but not critical for general dev news.

---

## F. Social/Community

### 24. Reddit -- INCLUDE (Phase 2)

**Access:** REST API (OAuth2) or RSS feeds
**Auth:** OAuth2 required for API. Free tier available for non-commercial use.
**Rate Limit:** 100 req/min (OAuth), 10 req/min (unauthenticated)
**Signal:** Variable by subreddit

**RSS feeds (no auth needed):**
| Subreddit | Feed URL | Signal |
|-----------|----------|--------|
| r/programming | `https://www.reddit.com/r/programming/.rss` | High |
| r/ClaudeAI | `https://www.reddit.com/r/ClaudeAI/.rss` | Medium |
| r/LocalLLaMA | `https://www.reddit.com/r/LocalLLaMA/.rss` | High |
| r/MachineLearning | `https://www.reddit.com/r/MachineLearning/.rss` | Very High |
| r/ExperiencedDevs | `https://www.reddit.com/r/ExperiencedDevs/.rss` | High |
| r/webdev | `https://www.reddit.com/r/webdev/.rss` | Medium |
| r/typescript | `https://www.reddit.com/r/typescript/.rss` | Medium |
| r/rust | `https://www.reddit.com/r/rust/.rss` | High |
| r/golang | `https://www.reddit.com/r/golang/.rss` | High |

**RSS approach (recommended):** Use `.rss` suffix on subreddit URLs. No auth needed. Returns top 25 posts. Poll every 2 hours.

**API approach (if needed):**
```
GET https://oauth.reddit.com/r/{subreddit}/hot?limit=25
Authorization: Bearer {access_token}
```

**Verdict:** Phase 2. RSS feeds work without auth but have limited data. API needs OAuth app registration. Reddit has gotten hostile to API consumers -- RSS is safer.

---

### 25. X/Twitter -- SKIP (for now)

**Access:** API v2
**Auth:** OAuth2, requires approved developer account
**Cost:** Free tier: 1,500 tweets/month read, Basic ($200/month): 10,000 read
**Signal:** High for breaking news if following right accounts
**Reason for skip:** Expensive, hostile API terms, rate limits. Better to get the same info from HN/Lobsters/blogs where it gets posted.

---

### 26. Mastodon -- SKIP

**Access:** REST API, no auth for public timelines
**Signal:** Low -- fragmented, hard to find signal
**Reason for skip:** Distributed nature makes aggregation complex. Tech community is split across many instances. Low ROI.

---

## G. Newsletters/Curated

### 27. TLDR Newsletter -- INCLUDE (Phase 2)

**Access:** Community RSS feed
**Feed URL:** `https://tldr.tech/tech/rss` (unofficial, via github.com/Bullrich/tldr-rss)
**Also:** Archives at `https://tldr.tech/tech/archives`
**Auth:** None
**Signal:** High -- human-curated daily digest
**Freshness:** Daily (weekdays)

**Sub-newsletters:**
- TLDR AI: `https://tldr.tech/ai/archives`
- TLDR Web Dev: `https://tldr.tech/webdev/archives`
- TLDR DevOps: `https://tldr.tech/devops/archives`

**Verdict:** Phase 2. The RSS feed is community-maintained and may break. Could also scrape archives page.

---

### 28. JavaScript Weekly (Cooperpress) -- INCLUDE (Phase 2)

**Access:** RSS feed
**Feed URL:** `https://javascriptweekly.com/rss`
**Auth:** None
**Signal:** Very High -- expertly curated, industry standard
**Freshness:** Weekly (Fridays)

**Related Cooperpress newsletters:**
- Node Weekly: `https://nodeweekly.com/rss`
- React Status: `https://react.statuscode.com/rss`
- Golang Weekly: `https://golangweekly.com/rss`
- Ruby Weekly: `https://rubyweekly.com/rss`

---

### 29. Python Weekly -- INCLUDE (Phase 2)

**Access:** RSS feed
**Feed URL:** `https://us2.campaign-archive.com/feed?u=e2e180baf855ac797ef407fc7&id=9e26887fc5`
**Auth:** None
**Signal:** High
**Freshness:** Weekly

---

### 30. Engineering Blogs -- INCLUDE (Phase 2)

High-signal RSS feeds from major tech companies:

| Company | Feed URL |
|---------|----------|
| Cloudflare | `https://blog.cloudflare.com/rss/` |
| Stripe | `https://stripe.com/blog/feed.rss` |
| Netflix Tech | `https://netflixtechblog.com/feed` |
| Uber Engineering | `https://www.uber.com/blog/engineering/rss/` |
| Spotify Engineering | `https://engineering.atspotify.com/feed/` |
| Meta Engineering | `https://engineering.fb.com/feed/` |
| Shopify Engineering | `https://shopifyengineering.myshopify.com/blogs/engineering.atom` |
| Slack Engineering | `https://slack.engineering/feed` |
| Dropbox Tech | `https://dropbox.tech/feed` |
| Signal Blog | `https://signal.org/blog/rss.xml` |
| NVIDIA Developer | `https://developer.nvidia.com/blog/feed` |

**Individual devs (high signal):**
| Author | Feed URL |
|--------|----------|
| Julia Evans | `https://jvns.ca/atom.xml` |
| Dan Luu | `https://danluu.com/atom.xml` |
| Dan Abramov (Overreacted) | `https://overreacted.io/rss.xml` |
| Josh Comeau | `https://joshwcomeau.com/rss.xml` |
| Martin Kleppmann | `https://feeds.feedburner.com/martinkl?format=xml` |
| Joel Spolsky | `https://www.joelonsoftware.com/feed/` |
| Pragmatic Engineer | `https://blog.pragmaticengineer.com/rss/` |

---

## Phase Implementation Plan

### Phase 1 -- Core Sources (MVP, ~12 sources)

These require no auth or only free API keys, have high signal, and are straightforward to implement:

1. **Hacker News** -- Firebase REST API, top 30 stories
2. **Lobsters** -- JSON endpoints, hottest stories
3. **GitHub Trending** -- Scrape HTML (already planned)
4. **GitHub Releases** -- Atom feeds for 18 key repos
5. **Dev.to** -- REST API, top articles by tag
6. **TechCrunch** -- RSS feed
7. **Ars Technica** -- RSS feed
8. **OpenAI Blog** -- RSS feed
9. **Google AI Blog** -- RSS feed
10. **Anthropic Blog** -- Scrape news page
11. **Hugging Face Papers** -- REST API, daily papers
12. **Python blog** -- RSS feed

**Estimated implementation:** ~200 lines of fetcher code total. All fetchable with standard `fetch()` + XML parser + cheerio.

### Phase 2 -- Extended Sources (~10 additional)

These require auth, scraping, or have lower priority:

1. **Reddit** -- RSS feeds for key subreddits (no auth needed for RSS)
2. **Product Hunt** -- GraphQL API (needs OAuth token)
3. **The Verge** -- RSS feed
4. **InfoQ** -- RSS feed
5. **Papers with Code** -- REST API
6. **arXiv** -- REST API (needs filtering)
7. **Vercel Changelog** -- Scrape or RSSHub
8. **TLDR Newsletter** -- Community RSS or scrape
9. **JavaScript Weekly** -- RSS feed
10. **Engineering Blogs** -- RSS feeds (batch of ~10)

### Skipped Sources

| Source | Reason |
|--------|--------|
| Wired | Low freshness, consumer focus, redundant |
| Hashnode | GraphQL complexity, no trending API, overlaps Dev.to |
| daily.dev | No public API |
| DZone | Sponsored content noise, lower signal than InfoQ |
| X/Twitter | $200/month for basic API, hostile terms |
| Mastodon | Fragmented, low ROI for aggregation |

---

## Technical Notes

### RSS/Atom Parsing

All RSS and Atom feeds can be parsed with a single lightweight XML parser. Recommended: use the built-in `DOMParser` in edge runtime or a library like `fast-xml-parser` (~30KB).

### Unified Fetch Pattern

All sources converge to a common output:
```typescript
interface FeedItem {
  id: string;           // Unique ID (URL hash or source ID)
  source: string;       // 'hn' | 'lobsters' | 'github-trending' | etc.
  title: string;
  url: string;
  score?: number;       // Upvotes/stars where available
  commentCount?: number;
  author?: string;
  publishedAt: string;  // ISO 8601
  tags?: string[];
  summary?: string;     // AI-generated or source-provided
}
```

### Fetch Schedule

| Frequency | Sources |
|-----------|---------|
| Every 30 min | Hacker News, Lobsters |
| Every 2 hours | Dev.to, TechCrunch, Ars Technica, Reddit RSS |
| Every 6 hours | AI blogs (Anthropic, OpenAI, Google), HF Papers |
| Every 6 hours | GitHub Releases (Atom feeds) |
| Daily | GitHub Trending |
| Weekly | Newsletter feeds (JS Weekly, Python Weekly, etc.) |

### Dedup Strategy

Dedup by normalized URL. Many stories appear across HN, Lobsters, Reddit, and Dev.to simultaneously. Keep the version with the highest score/engagement.
