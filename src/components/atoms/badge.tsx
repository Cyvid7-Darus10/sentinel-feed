import { getSourceConfig } from '@/lib/sources';

interface BadgeProps {
  readonly sourceId: string;
  /** Extra utility classes for positioning/visibility at the call site. */
  readonly className?: string;
}

/** Source badge (e.g. "HN", "GH") with the per-source color from sources config. */
export function Badge({ sourceId, className }: BadgeProps) {
  const { badge, badgeClass } = getSourceConfig(sourceId);
  return (
    <span className={`badge ${badgeClass}${className ? ` ${className}` : ''}`}>
      {badge}
    </span>
  );
}
