import { FilterButton } from '../atoms/filter-button';

export type ViewMode = 'list' | 'map' | 'radar';

const VIEW_MODES: readonly { id: ViewMode; label: string; title: string }[] = [
  { id: 'radar', label: 'RADAR', title: 'Radar view' },
  { id: 'map', label: 'MAP', title: 'Sector map view' },
  { id: 'list', label: 'LIST', title: 'List view' },
];

interface ViewToggleProps {
  readonly value: ViewMode;
  readonly onChange: (mode: ViewMode) => void;
}

/** RADAR / MAP / LIST view switcher. */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1">
      {VIEW_MODES.map((v) => (
        <FilterButton
          key={v.id}
          active={value === v.id}
          onClick={() => onChange(v.id)}
          title={v.title}
        >
          {v.label}
        </FilterButton>
      ))}
    </div>
  );
}
