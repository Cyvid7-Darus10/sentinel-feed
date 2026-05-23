interface FilterButtonProps {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
  readonly title?: string;
}

/** A pill-style toggle used for view modes, source filters, and time ranges. */
export function FilterButton({ active, onClick, children, title }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={`filter-btn ${active ? 'filter-btn-active' : 'filter-btn-inactive'}`}
    >
      {children}
    </button>
  );
}
