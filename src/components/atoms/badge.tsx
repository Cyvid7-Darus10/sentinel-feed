import { getSourceConfig } from '@/lib/sources';

interface BadgeProps {
  readonly sourceId: string;
  readonly className?: string;
}

export function Badge({ sourceId, className }: BadgeProps) {
  const { badge, badgeClass } = getSourceConfig(sourceId);
  return (
    <span className={`badge ${badgeClass}${className ? ` ${className}` : ''}`}>
      {badge}
    </span>
  );
}
