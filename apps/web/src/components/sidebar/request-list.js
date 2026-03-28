import { jsx as _jsx } from "react/jsx-runtime";
import { EmptyState } from '../common/empty-state';
import { RequestListItemRow } from './request-list-item';
export function RequestList({ requests, selectedId, onSelect, statusLabel, }) {
    if (requests.length === 0) {
        return (_jsx(EmptyState, { title: `No ${statusLabel.toLowerCase()} requests`, description: "New human review requests will appear here." }));
    }
    return (_jsx("div", { className: "request-list", role: "listbox", "aria-label": "Review requests", children: requests.map((request) => (_jsx(RequestListItemRow, { request: request, selected: request.id === selectedId, onSelect: () => onSelect(request.id) }, request.id))) }));
}
