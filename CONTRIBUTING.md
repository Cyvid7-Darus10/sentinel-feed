# Contributing to Sentinel Feed

Thank you for your interest in contributing. This guide covers the process for submitting changes.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/sentinel-feed.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env.local` and fill in the values
5. Start the dev server: `npm run dev`

## Development Workflow

1. Create a branch from `main`: `git checkout -b feat/my-feature`
2. Write tests first, then implement
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Verify the build: `npm run build`
6. Commit with a descriptive message (see below)
7. Push and open a pull request

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Reddit RSS source
fix: handle empty HN response gracefully
refactor: extract shared RSS parser
docs: update source list in README
test: add coverage for topic categorization
chore: bump dependencies
```

## Adding a New Source

Each source is a single file returning `Story[]`:

1. Create `src/lib/fetchers/your-source.ts`
2. Add the source ID to the `SourceId` union in `src/lib/types.ts`
3. Register the fetcher in `src/lib/fetchers/index.ts`
4. Add display name and badge in `src/lib/sources.ts`
5. Add badge styles in `src/app/globals.css`
6. Write tests in `src/lib/fetchers/__tests__/your-source.test.ts`

See `src/lib/fetchers/lobsters.ts` as a minimal reference (~50 lines).

## Pull Requests

- Keep PRs focused on a single change
- Include a clear description of what and why
- Ensure all tests pass and the build succeeds
- Add tests for new functionality
- Update the README if you add a source or feature

## Code Style

- TypeScript strict mode
- Immutable patterns (no mutation)
- Functions under 50 lines, files under 800 lines
- No `console.log` in production code
- No `any` — use `unknown` and narrow

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS if relevant
- Screenshots if applicable

## Questions

Open a discussion or issue. We're happy to help.
