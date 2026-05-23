import { FilterButton } from '../atoms/filter-button';

interface FilterOption<T> {
  readonly id: T;
  readonly label: string;
}

interface FilterGroupProps<T> {
  readonly options: readonly FilterOption<T>[];
  readonly value: T;
  readonly onChange: (id: T) => void;
}

/** A horizontal group of mutually-exclusive filter buttons (sources, time ranges). */
export function FilterGroup<T>({ options, value, onChange }: FilterGroupProps<T>) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      {options.map((o) => (
        <FilterButton
          key={String(o.id ?? 'all')}
          active={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </FilterButton>
      ))}
    </div>
  );
}
