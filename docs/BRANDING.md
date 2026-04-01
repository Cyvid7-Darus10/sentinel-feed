# Sentinel Feed — Branding & Design System

> Visual identity and design language for the Sentinel Feed intelligence dashboard.
> Inherits the Palantir Gotham aesthetic from [Claude Mission Control](https://github.com/Cyvid7-Darus10/claude-mission-control).

## Brand Identity

### Name

**Sentinel Feed** — a sentinel watches, monitors, and reports. The name communicates:
- **Surveillance** — always watching your tech sources
- **Intelligence** — filtered, summarized, relevant
- **Duty** — it runs automatically, you just consume the output

### Tagline

> **60 minutes of tech news. Distilled to 5.**

### Logo Mark

Text-based logo matching Mission Control's `{ SENTINEL }` pattern:
```
{ SENTINEL }
```
- Curly braces: tech aesthetic, code reference
- Uppercase: military/enterprise authority
- Monospace: JetBrains Mono

### Classification Banner

```
SENTINEL FEED — INTERNAL USE ONLY
```
- 9px font, sans-serif, uppercase
- 2px letter-spacing
- `#454549` text on `#1a1a1e` background
- 20px height, centered
- 1px bottom border

## Color System

### Palantir Gotham Palette

Directly inherited from Claude Mission Control. True Palantir: near-black, neutral grays, no blue tint.

#### Backgrounds (darkest to lightest)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-base` | `#0a0a0c` | Page background |
| `--bg-primary` | `#101114` | Header, column backgrounds |
| `--bg-panel` | `#161619` | Panel bodies, card backgrounds |
| `--bg-panel-alt` | `#1a1a1e` | Alternate panels, banner |
| `--bg-hover` | `#222226` | Hover states |
| `--bg-active` | `#2a2a2e` | Selected/active items |
| `--bg-focus` | `rgba(255,255,255,0.04)` | Focus layer |

#### Borders

| Token | Hex | Usage |
|-------|-----|-------|
| `--border` | `#252528` | Primary dividers |
| `--border-bright` | `#333338` | Secondary dividers, accents |
| `--border-focus` | `#555555` | Focus outline |

#### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `--text-bright` | `#ededf0` | Headers, story titles, important |
| `--text-primary` | `#c8c8cc` | Body text, descriptions |
| `--text-secondary` | `#7a7a80` | Labels, metadata, secondary info |
| `--text-muted` | `#454549` | Hints, disabled, timestamps |

#### Status (Semantic)

| Token | Hex | Usage |
|-------|-----|-------|
| `--success` | `#4ade80` | Healthy source, high relevance |
| `--success-dim` | `#22803d` | Success borders |
| `--warning` | `#eab308` | Degraded source, medium relevance |
| `--warning-dim` | `#92710a` | Warning borders |
| `--danger` | `#ef4444` | Error state, source down |
| `--danger-dim` | `#b91c1c` | Danger borders |
| `--info` | `#94a3b8` | Informational, neutral |

#### Glow Effects

| Token | Value | Usage |
|-------|-------|-------|
| `--glow-accent` | `rgba(200,200,204,0.12)` | Subtle hover glow |
| `--glow-success` | `rgba(74,222,128,0.15)` | Healthy source glow |
| `--glow-danger` | `rgba(239,68,68,0.15)` | Error state glow |

### Source Colors

Each source gets a unique accent for badges and indicators:

| Source | Color | Hex |
|--------|-------|-----|
| Hacker News | Orange | `#ff6600` |
| GitHub Trending | White/Light | `#ededf0` |
| Reddit | Orange-Red | `#ff4500` |
| Anthropic | Amber | `#d4a574` |
| Vercel | White | `#ffffff` |
| Node.js | Green | `#68a063` |

## Typography

### Font Stack

| Type | Fonts | Usage |
|------|-------|-------|
| Monospace (primary) | JetBrains Mono, Fira Code, Cascadia Code | Body text, story titles, data |
| Sans-serif (secondary) | -apple-system, Helvetica Neue, Arial | Labels, banner, buttons |

### Size Scale

| Token | Size | Usage |
|-------|------|-------|
| `--font-size-xs` | 10px | Timestamps, metadata |
| `--font-size-sm` | 11px | Labels, badges |
| `--font-size-base` | 12px | Body text, descriptions |
| `--font-size-md` | 13px | Story titles |
| `--font-size-lg` | 14px | Panel headers, stats |

### Text Rendering

```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### Text Conventions

- **Headers/labels:** Uppercase, letter-spacing 1-2px, sans-serif, `--text-secondary`
- **Story titles:** Normal case, `--text-bright`, monospace
- **Metadata:** Uppercase, letter-spacing 0.5px, `--text-muted`
- **Source badges:** Uppercase, letter-spacing 1px, 9px, bold 700

## Spacing & Geometry

### Border Radius

```
--radius: 0px
```

**Everything is sharp-cornered.** No rounded edges anywhere. This is core to the Palantir aesthetic.

Only exception: scrollbar thumb (2px radius).

### Borders

- All borders: `1px solid var(--border)`
- Decorative borders: `stroke-dasharray: 2 4`

### Shadows

| Context | Shadow |
|---------|--------|
| Panels | `0 4px 16px rgba(0,0,0,0.4)` |
| Overlays | `0 8px 40px rgba(0,0,0,0.7)` |
| Selected rows | `inset 2px 0 0 var(--accent)` |

### Scrollbars

```css
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-bright); }
```

## Component Patterns

### Classification Banner

```
┌──────────────────────────────────────────────────────────┐
│          SENTINEL FEED — INTERNAL USE ONLY                │
└──────────────────────────────────────────────────────────┘
```
- 20px height
- `--bg-panel-alt` background
- 1px bottom border
- 9px sans-serif, uppercase, 2px letter-spacing
- `--text-muted` color

### Header Bar

```
┌──────────────────────────────────────────────────────────┐
│  { SENTINEL }   SOURCES 2  STORIES 47  UPDATED 3m   ● │
└──────────────────────────────────────────────────────────┘
```
- 44px height
- `--bg-primary` background
- Logo left, stats center, connection dot right
- Stats: uppercase label + value pairs

### Story Card

```
┌──────────────────────────────────────────────────────────┐
│  HN  Show HN: I built a Rust compiler in 30 days   342 │
│  Demonstrates modern compiler design patterns       3h  │
└──────────────────────────────────────────────────────────┘
```
- `--bg-panel` background
- 1px border `--border`
- 10px 12px padding
- Source badge (9px, uppercase, bold, source-colored)
- Title in `--text-bright`, monospace
- Score right-aligned, `--text-secondary`
- Summary in `--text-primary`, smaller
- Timestamp in `--text-muted`, right-aligned
- Hover: `--bg-hover`, 80ms transition

### Source Panel Item

```
┌──────────────────────────────────────────────────────────┐
│  ● Hacker News              47 stories    fetched 3m ago │
│  ● GitHub Trending          23 stories    fetched 3m ago │
└──────────────────────────────────────────────────────────┘
```
- Status dot: `--success` (healthy), `--warning` (degraded), `--danger` (error)
- Active source dot pulses (2s animation)
- Source name in `--text-primary`
- Count + timestamp in `--text-muted`

### Stats Bar Values

| Stat | Format | Example |
|------|--------|---------|
| Sources | `SOURCES {n}` | `SOURCES 2` |
| Stories today | `STORIES {n}` | `STORIES 142` |
| Last update | `UPDATED {relative}` | `UPDATED 3m` |

### Filter Buttons

```
[ ALL ]  [ HN ]  [ GITHUB ]     [ 6H ]  [ 12H ]  [ 24H ]  [ 7D ]
```
- Active: `--bg-active` + `--text-bright` + 1px `--border-bright`
- Inactive: transparent + `--text-secondary`
- Hover: `--bg-hover`, 80ms transition
- 9px uppercase, monospace

## Animations

### Transitions

| Context | Duration | Easing |
|---------|----------|--------|
| Button/row hover | 80ms | ease |
| Panel collapse | 150ms | ease |
| Color changes | 150ms | ease |

### Keyframe Animations

| Animation | Duration | Usage |
|-----------|----------|-------|
| `pulse-dot` | 2s ease-in-out infinite | Active source status dot |
| `blink-alert` | 1.2s step-end infinite | Error/degraded source |
| `scanline-scroll` | — (static) | CRT overlay (no animation, repeating gradient) |

### Pulse Dot

```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

## Effects

### CRT Scanlines

Fixed overlay, `pointer-events: none`, `z-index: 9999`:
```css
background: repeating-linear-gradient(
  0deg,
  transparent,
  transparent 2px,
  rgba(0, 0, 0, 0.03) 2px,
  rgba(0, 0, 0, 0.03) 4px
);
```

### Glow on Hover

Story cards get a subtle glow on hover:
```css
box-shadow: 0 0 8px var(--glow-accent);
```

## Layout

### Desktop (>900px)

```
┌──────────────────────────────────────────────────────┐
│ Classification Banner                                 │
├──────────────────────────────────────────────────────┤
│ Header Bar                                           │
├──────────────────┬───────────────────────────────────┤
│ Sources Panel    │ Stories Feed                       │
│ (220-320px)      │ (remaining space)                  │
│                  │                                    │
│ ● Hacker News    │ ┌──────────────────────────────┐  │
│ ● GitHub Trend.  │ │ Story Card                   │  │
│                  │ └──────────────────────────────┘  │
│ ─────────────    │ ┌──────────────────────────────┐  │
│ Filters          │ │ Story Card                   │  │
│ [ALL] [HN] [GH]  │ └──────────────────────────────┘  │
│ [6H][12H][24H]   │ ┌──────────────────────────────┐  │
│                  │ │ Story Card                   │  │
│                  │ └──────────────────────────────┘  │
│                  │                                    │
└──────────────────┴───────────────────────────────────┘
```

- 2-column grid: `minmax(220px, 320px) 1fr`
- Left: sources + filters (scrollable)
- Right: story feed (scrollable)

### Mobile (<640px)

```
┌──────────────────────────────┐
│ { SENTINEL }           ●     │
├──────────────────────────────┤
│                              │
│ ┌──────────────────────────┐ │
│ │ Story Card               │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Story Card               │ │
│ └──────────────────────────┘ │
│                              │
├──────────────────────────────┤
│ [Sources] [Feed] [Bookmarks] │
└──────────────────────────────┘
```

- Single column
- Bottom tab bar (44px)
- Tab-based navigation
- Compact header (logo + connection dot only)

## Tailwind CSS Mapping

The design system maps to Tailwind CSS via `tailwind.config.ts`:

```typescript
// Colors map to CSS custom properties
colors: {
  bg: {
    base: 'var(--bg-base)',
    primary: 'var(--bg-primary)',
    panel: 'var(--bg-panel)',
    'panel-alt': 'var(--bg-panel-alt)',
    hover: 'var(--bg-hover)',
    active: 'var(--bg-active)',
  },
  border: {
    DEFAULT: 'var(--border)',
    bright: 'var(--border-bright)',
  },
  text: {
    bright: 'var(--text-bright)',
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
  },
  status: {
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
    info: 'var(--info)',
  },
},
borderRadius: {
  DEFAULT: '0px',  // Sharp corners everywhere
},
fontFamily: {
  mono: ['var(--font-mono)'],
  sans: ['var(--font-sans)'],
},
```

## Voice & Tone

### Dashboard Copy

- **Terse** — no unnecessary words
- **Uppercase labels** — SOURCES, STORIES, UPDATED, FETCHED
- **Relative timestamps** — "3m ago", "2h ago", "yesterday"
- **Status indicators** — dots and colors, not words
- **Technical** — "fetched", "aggregated", "filtered", not "collected", "gathered"

### Error States

- Source degraded: yellow dot, "DEGRADED" badge
- Source error: red dot, "ERROR" badge, blinking animation
- No stories: "NO INTEL" in `--text-muted`
- Stale data: "STALE — LAST FETCH {time}" in `--warning`

### Empty States

- First run: "AWAITING INITIAL FETCH — STAND BY"
- No results for filter: "NO MATCHES — ADJUST FILTERS"
- Source has no stories: "NO INTEL FROM THIS SOURCE"

## Favicon & Metadata

- Favicon: simple `S` in monospace on dark background (SVG)
- Title: `Sentinel Feed — Tech Intelligence`
- Description: `Personal tech intelligence feed. AI-filtered, AI-summarized.`
- Theme color: `#0a0a0c`
- OG image: dashboard screenshot with classification banner
