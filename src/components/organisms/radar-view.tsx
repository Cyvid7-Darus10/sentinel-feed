'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import type { Story } from '@/lib/types';
import { TOPICS } from '@/lib/topics';
import { CRITICAL_COLOR, CRITICAL_COLOR_LIGHT, ACCENT_GREEN } from '@/lib/config';
import { isSafeUrl } from '@/lib/utils';
import { plotStories, sectorPath, type PlottedStory } from '@/lib/radar-geometry';
import { StoryTooltip } from '../molecules/story-tooltip';
import { TopicDot } from '../atoms/topic-dot';

interface RadarViewProps {
  readonly stories: readonly Story[];
  readonly onSelectTopic: (topicId: string) => void;
}

export function RadarView({ stories, onSelectTopic }: RadarViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredStory, setHoveredStory] = useState<PlottedStory | null>(null);
  // flip is precomputed on hover so render never reads the ref; CSS positions the tooltip.
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, flip: false });

  const size = 700;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 70; // extra padding for labels

  const plotted = useMemo(() => plotStories(stories, cx, cy, outerR), [stories, cx, cy, outerR]);
  const criticalCount = useMemo(() => plotted.filter((p) => p.critical).length, [plotted]);

  const handleDotHover = useCallback(
    (p: PlottedStory, e: React.MouseEvent) => {
      setHoveredStory(p);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const rawX = e.clientX - rect.left + 16;
        const rawY = e.clientY - rect.top - 12;
        const maxX = rect.width - 320;
        const x = Math.max(8, Math.min(rawX, maxX));
        setTooltipPos({
          x,
          y: Math.max(8, rawY),
          flip: x > rect.width / 2,
        });
      }
    },
    []
  );

  const handleDotLeave = useCallback(() => {
    setHoveredStory(null);
  }, []);

  const handleDotTap = useCallback(
    (p: PlottedStory, e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (hoveredStory?.story.id === p.story.id) {
        // Second tap on same story → navigate
        if (isSafeUrl(p.story.url)) {
          window.open(p.story.url, '_blank', 'noopener,noreferrer');
        }
        setHoveredStory(null);
        return;
      }
      // First tap → show tooltip
      setHoveredStory(p);
    },
    [hoveredStory]
  );

  const handleDotClick = useCallback(
    (p: PlottedStory) => {
      if (isSafeUrl(p.story.url)) {
        window.open(p.story.url, '_blank', 'noopener,noreferrer');
      }
    },
    []
  );

  const sectorAngle = (2 * Math.PI) / TOPICS.length;

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
    <div ref={containerRef} className="relative flex h-full items-center justify-center overflow-hidden bg-bg-base" onTouchStart={() => setHoveredStory(null)}>
      <div className="radar-scanlines pointer-events-none absolute inset-0 z-[1]" />
      <div className="pointer-events-none absolute inset-0 z-[1]" style={{
        background: 'radial-gradient(circle at center, transparent 40%, rgba(10,10,12,0.5) 100%)',
      }} />

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
          <linearGradient id="sweep-trail" gradientTransform="rotate(0)">
            <stop offset="0%" stopColor={ACCENT_GREEN} stopOpacity="0.12" />
            <stop offset="100%" stopColor={ACCENT_GREEN} stopOpacity="0" />
          </linearGradient>
          <radialGradient id="critical-glow">
            <stop offset="0%" stopColor={CRITICAL_COLOR} stopOpacity="0.7" />
            <stop offset="50%" stopColor={CRITICAL_COLOR} stopOpacity="0.2" />
            <stop offset="100%" stopColor={CRITICAL_COLOR} stopOpacity="0" />
          </radialGradient>
          {TOPICS.map((topic) => (
            <radialGradient key={topic.id} id={`glow-${topic.id}`}>
              <stop offset="0%" stopColor={topic.color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={topic.color} stopOpacity="0" />
            </radialGradient>
          ))}
          <clipPath id="radar-clip">
            <circle cx={cx} cy={cy} r={outerR} />
          </clipPath>
        </defs>

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

        <g className="radar-sweep" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <path
            d={sectorPath(cx, cy, outerR, -0.7, 0)}
            fill={ACCENT_GREEN}
            opacity="0.04"
          />
          <line
            x1={cx}
            y1={cy}
            x2={cx + outerR}
            y2={cy}
            stroke={ACCENT_GREEN}
            strokeWidth="1.5"
            opacity="0.4"
          />
        </g>

        {plotted.map((p) => {
          // Calculate angle for sweep-blink animation delay
          const dx = p.x - cx;
          const dy = p.y - cy;
          const dotAngle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
          const blinkDelay = (dotAngle / 360) * 6; // 6s = sweep duration

          return (
            <g key={p.story.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={p.dotR * 3}
                fill={p.critical ? 'url(#critical-glow)' : `url(#glow-${TOPICS[p.topicIdx].id})`}
                opacity={p.critical ? 1 : 0.5}
                className={p.critical ? 'radar-pulse' : ''}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={Math.max(p.dotR * 3, 18)}
                fill="transparent"
                className="cursor-pointer"
                onTouchStart={(e) => handleDotTap(p, e)}
                onClick={() => handleDotClick(p)}
                onMouseEnter={(e) => handleDotHover(p, e)}
                onMouseLeave={handleDotLeave}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={p.dotR}
                fill={p.critical ? CRITICAL_COLOR : p.topicColor}
                stroke={p.critical ? CRITICAL_COLOR_LIGHT : `${p.topicColor}80`}
                strokeWidth={p.critical ? 1.5 : 0.5}
                className="radar-dot pointer-events-none"
                style={{
                  animationDelay: `${blinkDelay}s`,
                  filter: p.critical ? `drop-shadow(0 0 6px ${CRITICAL_COLOR})` : `drop-shadow(0 0 2px ${p.topicColor})`,
                  '--dot-color': p.critical ? CRITICAL_COLOR : p.topicColor,
                }}
              />
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r="4" fill="none" stroke={ACCENT_GREEN} strokeWidth="1" opacity="0.5" />
        <circle cx={cx} cy={cy} r="1.5" fill={ACCENT_GREEN} opacity="0.8" />
        <line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy} stroke={ACCENT_GREEN} strokeWidth="0.5" opacity="0.4" />
        <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 10} stroke={ACCENT_GREEN} strokeWidth="0.5" opacity="0.4" />

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

      {hoveredStory && (
        <div
          className="radar-tooltip pointer-events-none absolute z-50 max-sm:left-2 max-sm:right-2 max-sm:top-10"
          style={{
            '--tooltip-x': `${tooltipPos.x}px`,
            '--tooltip-y': `${tooltipPos.y}px`,
            '--tooltip-flip': tooltipPos.flip ? '-100%' : '0px',
          }}
        >
          <div className="max-sm:w-full">
            <StoryTooltip story={hoveredStory.story} topicColor={hoveredStory.topicColor} className="radar-tooltip-inner" />
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border/50 bg-bg-base/80 px-3 py-2 text-[10px] text-text-muted backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-danger" style={{ boxShadow: `0 0 4px ${CRITICAL_COLOR}` }} />
          CRITICAL
        </span>
        <span className="hidden text-border sm:inline">|</span>
        <span>LARGE = HIGH SCORE</span>
        <span className="hidden text-border sm:inline">|</span>
        {TOPICS.map((topic) => (
          <span key={topic.id} className="flex items-center gap-1">
            <TopicDot color={topic.color} className="h-1.5 w-1.5 rounded-full" />
            <span style={{ color: topic.color }}>{topic.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
