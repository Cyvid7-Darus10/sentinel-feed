'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import type { Story } from '@/lib/types';
import type { Topic } from '@/lib/topics';
import { TOPICS, categorizeTopic } from '@/lib/topics';
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

function sourceBadgeLabel(source: string): string {
  switch (source) {
    case 'hackernews': return 'HN';
    case 'github-trending': return 'GH';
    case 'lobsters': return 'LO';
    case 'devto': return 'DEV';
    case 'reddit': return 'RD';
    default: return source.slice(0, 2).toUpperCase();
  }
}

function sourceBadgeClass(source: string): string {
  switch (source) {
    case 'hackernews': return 'badge-hn';
    case 'github-trending': return 'badge-gh';
    case 'lobsters': return 'badge-lo';
    case 'devto': return 'badge-dev';
    case 'reddit': return 'badge-rd';
    default: return 'bg-info text-black';
  }
}

function scoreLabel(story: Story): string | null {
  if (story.score === null || story.score === 0) return null;
  if (story.source === 'github-trending') return `${story.score.toLocaleString()}\u2605`;
  if (story.source === 'devto') return `${story.score.toLocaleString()}\u2764`;
  return `${story.score.toLocaleString()} pts`;
}

interface PlottedStory {
  readonly story: Story;
  readonly topicId: string;
  readonly topicColor: string;
  readonly cx: number;
  readonly cy: number;
  readonly critical: boolean;
}

function plotStories(
  stories: readonly Story[],
  centerX: number,
  centerY: number,
  radius: number
): readonly PlottedStory[] {
  const byTopic: Record<string, Story[]> = {};
  for (const topic of TOPICS) {
    byTopic[topic.id] = [];
  }
  for (const story of stories) {
    const tid = categorizeTopic(story);
    byTopic[tid].push(story);
  }
  for (const topic of TOPICS) {
    byTopic[topic.id].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  const sectorAngle = (2 * Math.PI) / TOPICS.length;
  const plotted: PlottedStory[] = [];

  for (let i = 0; i < TOPICS.length; i++) {
    const topic = TOPICS[i];
    const topicStories = byTopic[topic.id];
    const baseAngle = i * sectorAngle - Math.PI / 2; // start at top

    for (let j = 0; j < topicStories.length; j++) {
      const story = topicStories[j];

      // Higher score = closer to center (more prominent)
      const maxScore = topicStories[0]?.score ?? 1;
      const normalizedScore = maxScore > 0 ? (story.score ?? 0) / maxScore : 0.5;
      const r = radius * 0.2 + radius * 0.7 * (1 - normalizedScore * 0.8);

      // Spread stories within the sector
      const spreadCount = Math.min(topicStories.length, 20);
      const angleOffset = (j / Math.max(spreadCount, 1) - 0.5) * sectorAngle * 0.7;
      const angle = baseAngle + sectorAngle / 2 + angleOffset;

      // Add some jitter to avoid perfect lines
      const jitterR = r + (((j * 7 + i * 13) % 11) - 5) * 2;

      plotted.push({
        story,
        topicId: topic.id,
        topicColor: topic.color,
        cx: centerX + jitterR * Math.cos(angle),
        cy: centerY + jitterR * Math.sin(angle),
        critical: isCritical(story),
      });
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
  const score = scoreLabel(story);
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
        <span className={`badge ${sourceBadgeClass(story.source)}`}>
          {sourceBadgeLabel(story.source)}
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

  const size = 600;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 40;

  const plotted = useMemo(() => plotStories(stories, cx, cy, outerR), [stories, cx, cy, outerR]);

  const criticalCount = useMemo(() => plotted.filter((p) => p.critical).length, [plotted]);

  const handleDotHover = useCallback(
    (p: PlottedStory, e: React.MouseEvent) => {
      setHoveredStory(p);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPos({
          x: e.clientX - rect.left + 12,
          y: e.clientY - rect.top - 8,
        });
      }
    },
    []
  );

  const handleDotLeave = useCallback(() => {
    setHoveredStory(null);
  }, []);

  const sectorAngle = 360 / TOPICS.length;

  return (
    <div ref={containerRef} className="relative flex h-full items-center justify-center overflow-hidden bg-bg-base">
      {/* Critical alert banner */}
      {criticalCount > 0 && (
        <div className="absolute left-0 right-0 top-0 z-10 border-b border-danger/30 bg-danger/10 px-4 py-1.5 text-center text-[11px] font-semibold text-danger">
          {criticalCount} CRITICAL {criticalCount === 1 ? 'ALERT' : 'ALERTS'} DETECTED
        </div>
      )}

      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="radar-svg h-full max-h-[min(80vh,600px)] w-full max-w-[min(80vh,600px)]"
      >
        <defs>
          {/* Sweep gradient */}
          <linearGradient id="sweep-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
          {/* Critical pulse */}
          <radialGradient id="critical-glow">
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Concentric rings */}
        {[0.25, 0.5, 0.75, 1].map((frac) => (
          <circle
            key={frac}
            cx={cx}
            cy={cy}
            r={outerR * frac}
            fill="none"
            stroke="var(--border)"
            strokeWidth="0.5"
            opacity="0.6"
          />
        ))}

        {/* Sector divider lines + labels */}
        {TOPICS.map((topic, i) => {
          const angle = (i * sectorAngle - 90) * (Math.PI / 180);
          const x2 = cx + outerR * Math.cos(angle);
          const y2 = cy + outerR * Math.sin(angle);
          const labelAngle = ((i + 0.5) * sectorAngle - 90) * (Math.PI / 180);
          const labelR = outerR + 20;
          const lx = cx + labelR * Math.cos(labelAngle);
          const ly = cy + labelR * Math.sin(labelAngle);
          return (
            <g key={topic.id}>
              <line
                x1={cx}
                y1={cy}
                x2={x2}
                y2={y2}
                stroke="var(--border)"
                strokeWidth="0.5"
                opacity="0.5"
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                fill={topic.color}
                fontSize="9"
                fontWeight="700"
                fontFamily="var(--font-mono)"
                letterSpacing="0.05em"
                className="cursor-pointer"
                onClick={() => onSelectTopic(topic.id)}
              >
                {topic.label}
              </text>
            </g>
          );
        })}

        {/* Rotating sweep line */}
        <line
          x1={cx}
          y1={cy}
          x2={cx + outerR}
          y2={cy}
          stroke="#34d399"
          strokeWidth="1"
          opacity="0.3"
          className="radar-sweep"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Story dots */}
        {plotted.map((p) => (
          <g key={p.story.id}>
            {/* Critical glow */}
            {p.critical && (
              <circle
                cx={p.cx}
                cy={p.cy}
                r="10"
                fill="url(#critical-glow)"
                className="radar-pulse"
              />
            )}
            {/* Dot */}
            <a
              href={p.story.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <circle
                cx={p.cx}
                cy={p.cy}
                r={p.critical ? 5 : 3.5}
                fill={p.critical ? '#f87171' : p.topicColor}
                opacity={p.critical ? 1 : 0.8}
                stroke={p.critical ? '#fca5a5' : 'none'}
                strokeWidth={p.critical ? 1 : 0}
                className="cursor-pointer transition-all duration-150 hover:opacity-100"
                onMouseEnter={(e) => handleDotHover(p, e)}
                onMouseLeave={handleDotLeave}
                style={{ filter: p.critical ? 'drop-shadow(0 0 4px #f87171)' : undefined }}
              />
            </a>
          </g>
        ))}

        {/* Center point */}
        <circle cx={cx} cy={cy} r="3" fill="#34d399" opacity="0.6" />
      </svg>

      {/* Tooltip */}
      {hoveredStory && (
        <div
          className="radar-tooltip pointer-events-none absolute z-50"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: tooltipPos.x > (containerRef.current?.clientWidth ?? 600) / 2
              ? 'translateX(-100%)'
              : 'translateX(0)',
          }}
        >
          <TooltipContent story={hoveredStory.story} topicColor={hoveredStory.topicColor} />
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-4 text-[10px] text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-danger" style={{ boxShadow: '0 0 4px #f87171' }} />
          CRITICAL
        </span>
        <span>CENTER = HIGH SCORE</span>
        <span>EDGE = LOW SCORE</span>
      </div>
    </div>
  );
}
