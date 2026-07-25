import type { Story } from '@/lib/types';
import { isSafeUrl } from '@/lib/utils';
import { StoryMeta } from './story-meta';

type StoryTooltipVariant = 'bare' | 'preview' | 'pinned';

interface StoryTooltipProps {
  readonly story: Story;
  readonly topicColor: string;
  readonly className?: string;
  /**
   * `bare` (default) renders the briefing alone, which is what the sector map uses.
   * `preview` adds a non-interactive hint, for desktop hover on the radar.
   * `pinned` adds the action row, so opening the source is a deliberate click.
   */
  readonly variant?: StoryTooltipVariant;
  readonly onClose?: () => void;
}

export function StoryTooltip({
  story,
  topicColor,
  className,
  variant = 'bare',
  onClose,
}: StoryTooltipProps) {
  const canOpen = isSafeUrl(story.url);

  return (
    <div className={className} style={{ borderColor: topicColor }}>
      <p className="text-[13px] font-medium leading-snug text-text-bright">
        {story.title}
      </p>
      {story.summary && (
        <p className="mt-1.5 text-[12px] leading-relaxed text-text-secondary">
          {story.summary}
        </p>
      )}
      <StoryMeta
        story={story}
        topicColor={topicColor}
        showScore
        className="mt-2 text-[11px]"
      />
      {story.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {story.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium"
              style={{ color: topicColor }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {variant === 'preview' && (
        <p className="mt-2.5 border-t border-border pt-2 text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
          {canOpen ? 'Click to open source ↗' : 'No source link'}
        </p>
      )}

      {variant === 'pinned' && (
        <div className="mt-3 flex items-stretch gap-2 border-t border-border pt-2.5">
          <a
            href={canOpen ? story.url : undefined}
            target={canOpen ? '_blank' : undefined}
            rel={canOpen ? 'noopener noreferrer' : undefined}
            onClick={canOpen ? onClose : undefined}
            aria-disabled={!canOpen}
            tabIndex={canOpen ? undefined : -1}
            className={`radar-open group/open flex min-h-[44px] flex-1 items-center justify-center gap-1.5 border text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-1 ${
              canOpen ? '' : 'pointer-events-none opacity-40'
            }`}
            style={{ color: topicColor, borderColor: `${topicColor}59` }}
          >
            {canOpen ? 'Open source' : 'No source'}
            {canOpen && (
              <span
                aria-hidden
                className="transition-transform duration-200 ease-out group-hover/open:translate-x-0.5 group-hover/open:-translate-y-0.5"
              >
                ↗
              </span>
            )}
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss briefing"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-border text-[13px] text-text-muted transition-colors hover:border-text-muted hover:text-text-bright focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-muted"
          >
            <span aria-hidden>✕</span>
          </button>
        </div>
      )}
    </div>
  );
}
