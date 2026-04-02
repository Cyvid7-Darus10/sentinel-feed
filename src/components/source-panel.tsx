import type { SourceHealth } from '@/lib/types';
import { relativeTime } from '@/lib/utils';

interface SourcePanelProps {
  readonly health: SourceHealth;
}

function statusDot(status: string): string {
  switch (status) {
    case 'healthy':
      return 'bg-success pulse-dot';
    case 'degraded':
      return 'bg-warning pulse-dot';
    case 'error':
      return 'bg-danger';
    default:
      return 'bg-text-muted';
  }
}

export function SourcePanel({ health }: SourcePanelProps) {
  const sources = Object.entries(health.sources);

  return (
    <div className="border border-border bg-bg-panel">
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary">
          Source Status
        </h2>
      </div>
      <div className="divide-y divide-border">
        {sources.length === 0 && (
          <div className="px-3 py-4 text-center text-[11px] text-text-muted">
            No sources active. Waiting for first fetch cycle.
          </div>
        )}
        {sources.map(([key, source]) => (
          <div
            key={key}
            className="flex items-center justify-between px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full ${statusDot(source.status)}`} />
              <span className="text-[11px] text-text-bright">{source.name}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-text-muted">
              <span>
                <span className="text-text-secondary">{source.totalStoriesToday}</span> today
              </span>
              {source.lastFetchAt && (
                <span>{relativeTime(source.lastFetchAt)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
