interface TabProps {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
  readonly color?: string;
}

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
