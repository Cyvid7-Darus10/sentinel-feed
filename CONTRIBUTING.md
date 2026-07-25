# Contributing

Bug reports, new sources, and fixes are all welcome. This is what the process looks like.

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/sentinel-feed.git
cd sentinel-feed
npm install
cp .env.example .env.local   # fill in BLOB_READ_WRITE_TOKEN and CRON_SECRET
npm run dev
```

The dashboard starts empty. Populate it with one manual fetch:

```bash
curl http://localhost:3000/api/fetch -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Workflow

Branch off `main`, write the test before the implementation, and make sure all four of these pass before you push:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Reddit RSS source
fix: handle empty HN response gracefully
refactor: extract shared RSS parser
docs: update source list in README
test: add coverage for topic categorization
chore: bump dependencies
```

Branch names use the same prefixes, for example `feat/reddit-source`.

## Adding a source

A source is one file that returns `Story[]`. Copy `src/lib/fetchers/lobsters.ts` if you want the shortest working example.

1. Write `src/lib/fetchers/your-source.ts`. Build rows with `createStory`, and pass `AbortSignal.timeout(FETCHER_TIMEOUT_MS)` to `fetch`.
2. Add the ID to the `SourceId` union in `src/lib/types.ts`.
3. Register the fetcher in the `fetchers` array in `src/lib/fetchers/index.ts`.
4. Add a `SourceConfig` entry in `src/lib/sources.ts`. That single entry drives the display name, the filter button, the badge, and the score unit.
5. Add the matching `.badge-xx` rule in `src/app/globals.css`.
6. Write tests in `src/lib/fetchers/__tests__/your-source.test.ts`. Mock `fetch` and cover the empty response and the malformed response, not just the happy path.

## Pull requests

One change per PR. If the description needs bullet points about unrelated things, it should have been two PRs. Say why you made the change, since the diff already says what. Update the README if you added a source or a user-visible feature.

## Code style

- TypeScript strict mode. No `any`. Use `unknown` and narrow it.
- No mutation. Return new objects.
- Functions under 50 lines, files under 800.
- No `console.log` in shipped code. `console.warn` and `console.error` in server routes are fine and are how source failures get surfaced.

## Reporting bugs

Open an issue with steps to reproduce, what you expected, what actually happened, and your browser and OS if the bug is visual. A screenshot usually saves a round trip.

## Security

Do not open an issue for a vulnerability. See [SECURITY.md](SECURITY.md).
