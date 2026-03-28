import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
import { formatRelativeTime } from '../../lib/format.js';
import { Badge } from '../common/badge.js';
function reviewTone(state) {
    switch (state) {
        case 'pending':
            return 'warning';
        case 'approved':
            return 'success';
        case 'commented':
            return 'muted';
        case 'rejected':
            return 'danger';
    }
}
export function RequestListItemRow({ request, selected, onSelect, }) {
    return (_jsxs("button", { className: clsx('request-row', selected && 'selected'), onClick: () => onSelect(request.id), type: "button", children: [_jsxs("div", { className: "request-row__title-line", children: [_jsx("span", { className: "request-row__title", children: request.title }), _jsx(Badge, { tone: reviewTone(request.reviewState), children: request.reviewState })] }), _jsxs("div", { className: "request-row__meta", children: [_jsx("span", { children: request.sourceAgentLabel || request.sourceAgentId }), _jsx("span", { children: formatRelativeTime(request.updatedAt) })] })] }));
}
