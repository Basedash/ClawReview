import type { RequestFilterStatus } from '@clawreview/shared';

const FILTERS: Array<{
  label: string;
  value: RequestFilterStatus;
}> = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
  { label: 'All', value: 'all' },
];

interface RequestFiltersProps {
  value: RequestFilterStatus;
  onChange: (value: RequestFilterStatus) => void;
}

export function RequestFilters({ value, onChange }: RequestFiltersProps) {
  return (
    <fieldset className="filter-row" aria-label="Request filters">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          className={`filter-chip ${value === filter.value ? 'is-active' : ''}`}
          onClick={() => onChange(filter.value)}
          type="button"
        >
          {filter.label}
        </button>
      ))}
    </fieldset>
  );
}
