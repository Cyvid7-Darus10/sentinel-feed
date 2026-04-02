'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import type { Story } from '@/lib/types';
import type { Topic } from '@/lib/topics';
import { TOPICS, categorizeTopic } from '@/lib/topics';
import { getSourceConfig, formatScore } from '@/lib/sources';
import { relativeTime } from '@/lib/utils';

interface RadarViewProps {
  readonly stories: readonly Story[];
  readonly onSelectTopic: (topicId: string) => void;
}

const CRITICAL_PATTERN =
  /cve[-\s]?\d|vulnerab|exploit|zero.?day|breach|ransomware|backdoor|rce\b|remote.?code|critical.?(flaw|bug|patch|update)|supply.?chain.?attack/i;

function isCritical(story: Story): boolean {
  const text = `${story.title} ${story.summary ?? ''} ${story.description ?? ''}`;
  return CRITICAL_PATTERN.test(text);
}

// ── Seeded PRNG for deterministic but random-looking placement ──
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Normal-ish distribution between min and max (average of two uniforms)
function normalBetween(rng: () => number, min: number, max: number): number {
  return min + (rng() + rng()) / 2 * (max - min);
}

// ── SVG arc path for a sector wedge ──
function sectorPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
}

interface PlottedStory {
  readonly story: Story;
  readonly topicIdx: number;
  readonly topicColor: string;
  readonly critical: boolean;
  readonly dotR: number;
  x: number;
  y: number;
}

function plotStories(
  stories: readonly Story[],
  centerX: number,
  centerY: number,
  radius: number
): PlottedStory[] {
  const byTopic: Record<string, Story[]> = {};
  for (const topic of TOPICS) {
    byTopic[topic.id] = [];
  }
  for (const story of stories) {
    byTopic[categorizeTopic(story)].push(story);
  }
  for (const topic of TOPICS) {
    byTopic[topic.id].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  const sectorAngle = (2 * Math.PI) / TOPICS.length;
  const plotted: PlottedStory[] = [];

  for (let i = 0; i < TOPICS.length; i++) {
    const topic = TOPICS[i];
    const topicStories = byTopic[topic.id];
    const baseAngle = i * sectorAngle - Math.PI / 2;
    const maxScore = topicStories[0]?.score ?? 1;

    for (let j = 0; j < topicStories.length; j++) {
      const story = topicStories[j];
      const rng = seededRandom(story.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
      const critical = isCritical(story);

      // Score-based radius: high score → inner, low → outer
      const normalizedScore = maxScore > 0 ? (story.score ?? 0) / maxScore : 0.5;
      const rMin = radius * 0.15;
      const rMax = radius * 0.92;
      const r = rMin + (1 - normalizedScore * 0.75) * (rMax - rMin);

      // Random angle within sector (normal distribution, clustered toward center of sector)
      const angleMargin = sectorAngle * 0.08;
      const angle = normalBetween(
        rng,
        baseAngle + angleMargin,
        baseAngle + sectorAngle - angleMargin
      );

      // Add radius jitter for organic feel
      const jitteredR = r + (rng() - 0.5) * radius * 0.12;

      // Dot size: bigger for higher score, critical stories larger
      const dotR = critical ? 6 : 3 + normalizedScore * 3;

      plotted.push({
        story,
        topicIdx: i,
        topicColor: topic.color,
        critical,
        dotR,
        x: centerX + jitteredR * Math.cos(angle),
        y: centerY + jitteredR * Math.sin(angle),
      });
    }
  }

  // ── Simple iterative collision relaxation (no D3 needed) ──
  const padding = 2;
  for (let iter = 0; iter < 12; iter++) {
    for (let a = 0; a < plotted.length; a++) {
      for (let b = a + 1; b < plotted.length; b++) {
        const pa = plotted[a];
        const pb = plotted[b];
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = pa.dotR + pb.dotR + padding;
        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          pa.x -= nx * overlap;
          pa.y -= ny * overlap;
          pb.x += nx * overlap;
          pb.y += ny * overlap;
        }
      }
    }

    // Clamp back into sector bounds after each iteration
    for (const p of plotted) {
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Keep within radar circle
      if (dist > radius * 0.93) {
        const scale = (radius * 0.93) / dist;
        p.x = centerX + dx * scale;
        p.y = centerY + dy * scale;
      }
      // Keep outside center dead zone
      if (dist < radius * 0.1) {
        const scale = (radius * 0.1) / dist;
        p.x = centerX + dx * scale;
        p.y = centerY + dy * scale;
      }
    }
  }

  return plotted;
}

function TooltipContent({
  story,
  topicColor,
}: {
  readonly story: Story;
  readonly topicColor: string;
}) {
  const src = getSourceConfig(story.source);
  const score = formatScore(story.source, story.score);
  return (
    <div className="radar-tooltip-inner" style={{ borderColor: topicColor }}>
      <p className="text-[13px] font-medium leading-snug text-text-bright">
        {story.title}
      </p>
      {story.summary && (
        <p className="mt-1.5 text-[12px] leading-relaxed text-text-secondary">
          {story.summary}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
        <span className={`badge ${src.badgeClass}`}>
          {src.badge}
        </span>
        {story.author && <span>{story.author}</span>}
        <span>{relativeTime(story.publishedAt ?? story.fetchedAt)}</span>
        {score && (
          <span className="font-semibold" style={{ color: topicColor }}>
            {score}
          </span>
        )}
      </div>
      {story.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {story.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="text-[10px] font-medium" style={{ color: topicColor }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function RadarView({ stories, onSelectTopic }: RadarViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredStory, setHoveredStory] = useState<PlottedStory | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const size = 700;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 70; // extra padding for labels

  const plotted = useMemo(() => plotStories(stories, cx, cy, outerR), [stories, cx, cy, outerR]);
  const criticalCount = useMemo(() => plotted.filter((p) => p.critical).length, [plotted]);

  const handleDotInteract = useCallback(
    (p: PlottedStory, e: React.MouseEvent | React.TouchEvent) => {
      // On touch, toggle; on mouse, show
      if (hoveredStory?.story.id === p.story.id && 'touches' in e) {
        setHoveredStory(null);
        return;
      }
      setHoveredStory(p);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const rawX = clientX - rect.left + 16;
        const rawY = clientY - rect.top - 12;
        // Clamp tooltip within container
        const maxX = rect.width - 320;
        setTooltipPos({
          x: Math.max(8, Math.min(rawX, maxX)),
          y: Math.max(8, rawY),
        });
      }
    },
    [hoveredStory]
  );

  const handleDotLeave = useCallback(() => {
    setHoveredStory(null);
  }, []);

  const sectorAngle = (2 * Math.PI) / TOPICS.length;

  // Tick marks on outermost ring
  const tickCount = 72;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angle = (i / tickCount) * 2 * Math.PI - Math.PI / 2;
    const isMajor = i % 6 === 0;
    const inner = outerR - (isMajor ? 8 : 4);
    return {
      x1: cx + inner * Math.cos(angle),
      y1: cy + inner * Math.sin(angle),
      x2: cx + outerR * Math.cos(angle),
      y2: cy + outerR * Math.sin(angle),
      isMajor,
    };
  });

  return (
    <div ref={containerRef} className="relative flex h-full items-center justify-center overflow-hidden bg-bg-base">
      {/* CRT scanline overlay */}
      <div className="radar-scanlines pointer-events-none absolute inset-0 z-[1]" />
      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 z-[1]" style={{
        background: 'radial-gradient(circle at center, transparent 40%, rgba(10,10,12,0.5) 100%)',
      }} />

      {/* Critical alert banner */}
      {criticalCount > 0 && (
        <div className="absolute left-0 right-0 top-0 z-10 border-b border-danger/30 bg-danger/10 px-4 py-1.5 text-center text-[11px] font-semibold tracking-wider text-danger radar-alert-pulse">
          {criticalCount} CRITICAL {criticalCount === 1 ? 'ALERT' : 'ALERTS'} DETECTED
        </div>
      )}

      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-full max-h-[min(85vh,700px)] w-full max-w-[min(85vh,700px)]"
        style={{ position: 'relative', zIndex: 2 }}
      >
        <defs>
          {/* Sweep trail conic gradient approximation */}
          <linearGradient id="sweep-trail" gradientTransform="rotate(0)">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
          {/* Critical glow */}
          <radialGradient id="critical-glow">
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#f87171" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
          </radialGradient>
          {/* Dot glow per topic */}
          {TOPICS.map((topic) => (
            <radialGradient key={topic.id} id={`glow-${topic.id}`}>
              <stop offset="0%" stopColor={topic.color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={topic.color} stopOpacity="0" />
            </radialGradient>
          ))}
          {/* Clip to radar circle */}
          <clipPath id="radar-clip">
            <circle cx={cx} cy={cy} r={outerR} />
          </clipPath>
        </defs>

        {/* ── Sector wedge backgrounds ── */}
        <g clipPath="url(#radar-clip)">
          {TOPICS.map((topic, i) => {
            const startAngle = i * sectorAngle - Math.PI / 2;
            const endAngle = startAngle + sectorAngle;
            return (
              <path
                key={`sector-bg-${topic.id}`}
                d={sectorPath(cx, cy, outerR, startAngle, endAngle)}
                fill={topic.color}
                opacity="0.04"
                className="cursor-pointer transition-opacity hover:opacity-[0.08]"
                onClick={() => onSelectTopic(topic.id)}
              />
            );
          })}
        </g>

        {/* ── Concentric rings ── */}
        {[0.25, 0.5, 0.75, 1].map((frac) => (
          <circle
            key={frac}
            cx={cx}
            cy={cy}
            r={outerR * frac}
            fill="none"
            stroke="var(--border)"
            strokeWidth={frac === 1 ? '1' : '0.5'}
            opacity={frac === 1 ? '0.8' : '0.4'}
          />
        ))}

        {/* ── Tick marks on outer ring ── */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="var(--border)"
            strokeWidth={t.isMajor ? '1' : '0.5'}
            opacity={t.isMajor ? '0.6' : '0.3'}
          />
        ))}

        {/* ── Crosshair lines (cardinal directions) ── */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle) => (
          <line
            key={angle}
            x1={cx}
            y1={cy}
            x2={cx + outerR * Math.cos(angle - Math.PI / 2)}
            y2={cy + outerR * Math.sin(angle - Math.PI / 2)}
            stroke="var(--border)"
            strokeWidth="0.3"
            opacity="0.25"
            strokeDasharray="4 6"
          />
        ))}

        {/* ── Sector divider lines ── */}
        {TOPICS.map((topic, i) => {
          const angle = i * sectorAngle - Math.PI / 2;
          return (
            <line
              key={`div-${topic.id}`}
              x1={cx}
              y1={cy}
              x2={cx + outerR * Math.cos(angle)}
              y2={cy + outerR * Math.sin(angle)}
              stroke={topic.color}
              strokeWidth="0.5"
              opacity="0.2"
            />
          );
        })}

        {/* ── Rotating sweep line + trail ── */}
        <g className="radar-sweep" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          {/* Sweep trail wedge */}
          <path
            d={sectorPath(cx, cy, outerR, -0.7, 0)}
            fill="#34d399"
            opacity="0.04"
          />
          {/* Sweep line */}
          <line
            x1={cx}
            y1={cy}
            x2={cx + outerR}
            y2={cy}
            stroke="#34d399"
            strokeWidth="1.5"
            opacity="0.4"
          />
        </g>

        {/* ── Story dots ── */}
        {plotted.map((p) => {
          // Calculate angle for sweep-blink animation delay
          const dx = p.x - cx;
          const dy = p.y - cy;
          const dotAngle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
          const blinkDelay = (dotAngle / 360) * 6; // 6s = sweep duration

          return (
            <g key={p.story.id}>
              {/* Ambient glow behind dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r={p.dotR * 3}
                fill={p.critical ? 'url(#critical-glow)' : `url(#glow-${TOPICS[p.topicIdx].id})`}
                opacity={p.critical ? 1 : 0.5}
                className={p.critical ? 'radar-pulse' : ''}
              />
              {/* The dot */}
              <a href={p.story.url} target="_blank" rel="noopener noreferrer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.dotR}
                  fill={p.critical ? '#f87171' : p.topicColor}
                  stroke={p.critical ? '#fca5a5' : `${p.topicColor}80`}
                  strokeWidth={p.critical ? 1.5 : 0.5}
                  className="radar-dot cursor-pointer"
                  style={{
                    animationDelay: `${blinkDelay}s`,
                    filter: p.critical ? 'drop-shadow(0 0 6px #f87171)' : `drop-shadow(0 0 2px ${p.topicColor})`,
                    '--dot-color': p.critical ? '#f87171' : p.topicColor,
                  } as React.CSSProperties}
                  onMouseEnter={(e) => handleDotInteract(p, e)}
                  onMouseLeave={handleDotLeave}
                  onTouchStart={(e) => { e.preventDefault(); handleDotInteract(p, e); }}
                />
              </a>
            </g>
          );
        })}

        {/* ── Center crosshair ── */}
        <circle cx={cx} cy={cy} r="4" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.5" />
        <circle cx={cx} cy={cy} r="1.5" fill="#34d399" opacity="0.8" />
        <line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy} stroke="#34d399" strokeWidth="0.5" opacity="0.4" />
        <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 10} stroke="#34d399" strokeWidth="0.5" opacity="0.4" />

        {/* ── Sector labels ── */}
        {TOPICS.map((topic, i) => {
          const midAngle = (i + 0.5) * sectorAngle - Math.PI / 2;
          const labelR = outerR + 40;
          const lx = cx + labelR * Math.cos(midAngle);
          const ly = cy + labelR * Math.sin(midAngle);
          const count = plotted.filter((p) => p.topicIdx === i).length;
          return (
            <g key={`label-${topic.id}`} className="cursor-pointer" onClick={() => onSelectTopic(topic.id)}>
              <text
                x={lx}
                y={ly - 8}
                textAnchor="middle"
                dominantBaseline="central"
                fill={topic.color}
                fontSize="16"
                fontWeight="700"
                fontFamily="var(--font-mono)"
                letterSpacing="0.06em"
              >
                {topic.label}
              </text>
              <text
                x={lx}
                y={ly + 10}
                textAnchor="middle"
                dominantBaseline="central"
                fill={topic.color}
                fontSize="13"
                fontFamily="var(--font-mono)"
                opacity="0.5"
              >
                {count}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip — fixed top-center on mobile, cursor-following on desktop */}
      {hoveredStory && (
        <div
          className="pointer-events-none absolute z-50 max-sm:left-2 max-sm:right-2 max-sm:top-10 sm:left-auto sm:right-auto sm:top-auto"
          style={{
            ...((typeof window !== 'undefined' && window.innerWidth >= 640) ? {
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: tooltipPos.x > (containerRef.current?.clientWidth ?? 700) / 2
                ? 'translateX(-100%)'
                : 'translateX(0)',
            } : {}),
          }}
        >
          <div className="max-sm:w-full">
            <TooltipContent story={hoveredStory.story} topicColor={hoveredStory.topicColor} />
          </div>
        </div>
      )}

      {/* Legend — single centered bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border/50 bg-bg-base/80 px-3 py-2 text-[10px] text-text-muted backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-danger" style={{ boxShadow: '0 0 4px #f87171' }} />
          CRITICAL
        </span>
        <span className="hidden text-border sm:inline">|</span>
        <span>LARGE = HIGH SCORE</span>
        <span className="hidden text-border sm:inline">|</span>
        {TOPICS.map((topic) => (
          <span key={topic.id} className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: topic.color }} />
            <span style={{ color: topic.color }}>{topic.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
