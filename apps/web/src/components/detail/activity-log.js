import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatRelativeTime } from '../../lib/format.js';
import { Badge } from '../common/badge.js';
function formatEventType(eventType) {
    return eventType
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}
export function ActivityLog({ events }) {
    if (events.length === 0) {
        return null;
    }
    return (_jsxs("div", { className: "card", children: [_jsxs("div", { className: "card__header", children: [_jsx("span", { className: "card__title", children: "Activity" }), _jsxs("span", { className: "card__subtitle", children: [events.length, " event", events.length !== 1 ? 's' : ''] })] }), _jsx("div", { className: "activity-list", children: events.map((event) => (_jsxs("div", { className: "activity-row", children: [_jsxs("div", { className: "activity-info", children: [_jsx("span", { className: "activity-title", children: formatEventType(event.eventType) }), _jsx("span", { className: "activity-subtitle", children: formatRelativeTime(event.createdAt) })] }), _jsx(Badge, { tone: "muted", children: event.actorType })] }, event.id))) })] }));
}
