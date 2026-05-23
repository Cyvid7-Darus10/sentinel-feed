interface SearchInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly className?: string;
}

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
