import { FilterButton } from '../atoms/filter-button';

interface FilterOption<T> {
  readonly id: T;
  readonly label: string;
  readonly title?: string;
}

interface FilterGroupProps<T> {
  readonly options: readonly FilterOption<T>[];
  readonly value: T;
  readonly onChange: (id: T) => void;
}

// T is constrained to primitives so String(id) yields stable, collision-free keys.
export function FilterGroup<T extends string | null>({
  options,
  value,
  onChange,
}: FilterGroupProps<T>) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      {options.map((o) => (
        <FilterButton
          key={String(o.id ?? 'all')}
          active={value === o.id}
          onClick={() => onChange(o.id)}
          title={o.title}
        >
          {o.label}
        </FilterButton>
      ))}
    </div>
  );
}
