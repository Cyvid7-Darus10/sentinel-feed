interface TabProps {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
  /** Drives the active underline color via the --tab-color custom property. */
  readonly color?: string;
}

/** Underlined tab used by the topic filter bar. */
export function Tab({ active, onClick, children, color }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`topic-tab ${active ? 'topic-tab-active' : ''}`}
      style={color ? { '--tab-color': color } : undefined}
    >
      {children}
    </button>
  );
}
