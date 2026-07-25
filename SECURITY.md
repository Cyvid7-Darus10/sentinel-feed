# Security

## Reporting a vulnerability

Email **security@pastelero.ph**. Please do not open a public issue.

Include what the vulnerability is, how to reproduce it, and what an attacker could do with it. A suggested fix is welcome but not expected.

You will get a reply within 48 hours. Nothing gets disclosed publicly until there is a fix, and you get credit unless you would rather not.

## In scope

- The web app at `sentinel-feed.pastelero.ph`
- The Sentinel Bar macOS app
- The public read endpoints, `/api/stories` and `/api/sources`
- This codebase

## Out of scope

- Third-party services we only read from: Vercel, GitHub, Hacker News, and the rest of the sources
- Denial of service
- Social engineering

The app has no accounts, no user data, and no writes from the browser, so reports about session handling or authorization between users do not apply here. Reports about the cron routes accepting unauthenticated writes very much do.

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
