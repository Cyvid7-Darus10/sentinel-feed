interface SearchInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly className?: string;
}

/** Search text field; emits the extracted value rather than the raw event. */
export function SearchInput({ value, onChange, className }: SearchInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search..."
      aria-label="Search stories"
      className={`search-input${className ? ` ${className}` : ''}`}
    />
  );
}
