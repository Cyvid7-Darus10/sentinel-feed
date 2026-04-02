interface HeaderProps {
  readonly storyCount: number;
  readonly sourceCount: number;
  readonly lastUpdate: string | null;
}

export function Header({ storyCount, sourceCount, lastUpdate }: HeaderProps) {
  return (
    <header className="bg-bg-primary border-b border-border px-4 py-3">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-2 w-2 shrink-0 rounded-full bg-success pulse-dot" aria-hidden="true" />
          <h1 className="whitespace-nowrap text-sm font-bold uppercase tracking-[0.15em] text-text-bright">
            Sentinel Feed
          </h1>
          <span className="hidden text-[10px] uppercase text-text-muted sm:inline">v1.0</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase text-text-secondary sm:gap-6 sm:text-[11px]">
          <span>
            <span className="text-text-bright">{storyCount}</span> stories
          </span>
          <span>
            <span className="text-text-bright">{sourceCount}</span> sources
          </span>
          {lastUpdate && (
            <span className="hidden sm:inline">
              upd <span className="text-success">{lastUpdate}</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
