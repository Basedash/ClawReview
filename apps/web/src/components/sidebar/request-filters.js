import { jsx as _jsx } from "react/jsx-runtime";
const FILTERS = [
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
    { label: 'All', value: 'all' },
];
export function RequestFilters({ value, onChange }) {
    return (_jsx("fieldset", { className: "filter-row", "aria-label": "Request filters", children: FILTERS.map((filter) => (_jsx("button", { className: `filter-chip ${value === filter.value ? 'is-active' : ''}`, onClick: () => onChange(filter.value), type: "button", children: filter.label }, filter.value))) }));
}
