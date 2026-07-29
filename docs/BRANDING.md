# Design notes

The look borrows from Palantir Gotham by way of [Claude Mission Control](https://github.com/Cyvid7-Darus10/claude-mission-control): near-black backgrounds, neutral grays with no blue tint, monospace everywhere, and nothing rounded. It reads as an instrument panel rather than a news site, which is the point. The stories are ranked signal, not articles.

Everything here lives in `src/app/globals.css`. Tailwind 4 has no config file, so the tokens are CSS custom properties re-exported through `@theme inline`, which is what makes `bg-bg-panel` and `text-text-muted` work as utilities.

## Name

A sentinel watches and reports, and does it without being asked. The app runs on a cron whether or not anyone opens the tab, which is roughly the whole idea.

Logo mark, matching Mission Control's pattern:

```
{ SENTINEL }
```

Braces for the code reference, uppercase for the enterprise-terminal register, JetBrains Mono because everything is.

## Color

### Base tokens

| Token | Hex | Used for |
|-------|-----|----------|
| `--bg-base` | `#0a0a0c` | Page background |
| `--bg-primary` | `#111114` | Header, sector cards |
| `--bg-panel` | `#16161a` | Card bodies, tooltips |
| `--bg-hover` | `#1e1e23` | Hover state |
| `--border` | `#26262e` | Every divider and outline |
| `--text-bright` | `#eaeaf0` | Story titles, active labels |
| `--text-primary` | `#b8b8c4` | Body text |
| `--text-secondary` | `#78788a` | Summaries, metadata |
| `--text-muted` | `#48485a` | Timestamps, inactive controls |
| `--success` | `#34d399` | Healthy source, sweep line, crosshair |
| `--warning` | `#fbbf24` | Degraded source |
| `--danger` | `#f87171` | Error state, critical alert |
| `--info` | `#94a3b8` | Neutral fallback |

Four levels of text gray is more than most palettes need, but the density here is high enough that it earns its keep. A story card carries a title, a summary, a badge, an author, a timestamp, and a score in about 40 pixels of height, and the gray step is what stops all six from competing.

### Topic colors

Defined in `src/lib/topics.ts` rather than CSS, because the radar reads them in JavaScript to color dots and sector wedges.

| Sector | Hex |
|--------|-----|
| Security | `#f87171` |
| AI / ML | `#c084fc` |
| Systems | `#60a5fa` |
| Dev | `#4ade80` |
| Tools | `#fbbf24` |
| General | `#94a3b8` |

Security shares its hex with `--danger` on purpose. A red dot means the same thing everywhere in the app.

### Source badges

Each source gets its own badge color, mostly its real brand color where one exists.

| Source | Class | Hex |
|--------|-------|-----|
| Hacker News | `.badge-hn` | `#ff6600` on black |
| GitHub Trending | `.badge-gh` | `#8b5cf6` |
| Lobsters | `.badge-lo` | `#ac2e2e` |
| Dev.to | `.badge-dev` | `#3b49df` |
| daily.dev | `.badge-dd` | `#ce3df3` |
| Techmeme | `.badge-tm` | `#2d8c3c` |
| InfoQ | `.badge-iq` | `#007dc3` |

Adding a source means adding a rule here as well as a `SourceConfig` entry. There is no fallback badge color beyond a plain `bg-info`.

## Type

JetBrains Mono, with `ui-monospace` and `monospace` behind it. Body copy is 13px at 1.6 line height. Interface chrome runs smaller: 11px for filter buttons and tabs, 10px for pills, 9px for badges. Labels are uppercase with light letter-spacing, in the 0.02em to 0.08em range depending on size.

## Shape

Nothing has a border radius. The only exception in the stylesheet is the scrollbar thumb at 2px, which is small enough not to register.

Borders are always `1px solid var(--border)`. Emphasis comes from a colored left or top edge instead of a heavier outline: sector cards get a 2px top border in their topic color, tooltips get a 3px left border, the active topic tab gets a 2px bottom border.

Shadows are only used on things that float. Sector tooltips get `0 8px 24px rgba(0,0,0,0.5)`, radar briefings get `0 12px 32px rgba(0,0,0,0.6)`.

## Motion

Hover and color transitions are 120ms ease, fast enough to feel mechanical rather than smooth. That is deliberate.

The radar has its own set of loops, all in `globals.css`:

| Animation | Timing | What it does |
|-----------|--------|--------------|
| `radar-spin` | 6s linear infinite | The sweep line |
| `radar-dot-blink` | 6s ease-in-out infinite | Dots flare as the sweep passes, phase-offset per dot by its angle |
| `radar-pulse-anim` | 2s ease-in-out infinite | Critical dot halo |
| `alert-pulse` | 3s ease-in-out infinite | Critical alerts banner |
| `scanline-drift` | 12s linear infinite | CRT overlay, drifting 8px |
| `radar-card-in` | 180ms, `cubic-bezier(0.22, 1, 0.36, 1)` | Pinned briefing entrance |

The dot blink delay is computed per dot from its angle on the radar, so the flare tracks the sweep instead of everything blinking at once. That is the one piece of the effect that has to be calculated in JS.

`radar-card-in` has a second variant, `radar-card-in-flip`, for desktop. The briefing card is already positioned with `translateX(var(--tooltip-flip))` to keep it from clipping the right edge, so the entrance keyframes have to carry that transform through or the card jumps sideways as it animates. Both variants are disabled under `prefers-reduced-motion: reduce`.

The scanline overlay is a repeating linear gradient at 3% white, `pointer-events: none`, sitting over the radar only.

## Layout

Desktop puts the six sector cards in a 3x2 grid with a 1px gap that shows the border color through, so the grid lines are the background rather than drawn borders. Below 1024px it becomes 2x3. Below 640px it stays 2x3 but sector cards drop their max height and scroll with the page instead.

Sector tooltips flip to the left side of the card when the card is in the rightmost column, and that column changes with the breakpoint, so the `:nth-child` rules are duplicated per media query. Below 640px they are hidden outright: there is no hover on a phone, and the radar's tap-to-pin briefing covers that case properly.

## Copy

Terse and mechanical. Labels are uppercase (`SOURCES`, `STORIES`, `UPDATED`). Timestamps are relative and abbreviated (`3m`, `2h`). Status is a colored dot, not a word, unless something is wrong.

Verbs lean technical: fetched, aggregated, filtered. Not collected or gathered.

Empty and error states stay in register:

- Nothing fetched yet: `AWAITING INITIAL FETCH`
- Filters match nothing: `NO MATCHES`
- Source returned nothing: `NO INTEL`
- Rate limited: the auto-refresh notice says so plainly rather than silently going stale

## Metadata

- Title: `Sentinel Feed: Tech Intelligence Radar`
- Theme color: `#0a0a0c`
- Favicon and app icons: `public/`, plus `src/app/favicon.ico` and `src/app/apple-icon.png`
- Logo source art: `docs/brand/radar-512.jpg` and `docs/brand/radar-1024.jpg`
- OG image: `public/og-image.png`, a dashboard capture
