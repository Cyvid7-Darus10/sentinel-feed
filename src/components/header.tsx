interface HeaderProps {
  readonly storyCount: number;
  readonly sourceCount: number;
  readonly lastUpdate: string | null;
}

export function Header({ storyCount, sourceCount, lastUpdate }: HeaderProps) {
  return (
    <header className="bg-bg-primary border-b border-border px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-success pulse-dot" />
          <h1 className="text-sm font-bold uppercase tracking-[0.15em] text-text-bright">
            Sentinel Feed
          </h1>
          <span className="text-[10px] uppercase text-text-muted">v1.0</span>
        </div>
        <div className="flex items-center gap-6 text-[11px] uppercase text-text-secondary">
          <span>
            <span className="text-text-bright">{storyCount}</span> stories
          </span>
          <span>
            <span className="text-text-bright">{sourceCount}</span> sources
          </span>
          {lastUpdate && (
            <span>
              upd <span className="text-success">{lastUpdate}</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
