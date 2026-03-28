import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatRelativeTime } from '../../lib/format.js';
import { Badge } from '../common/badge.js';
export function ActivityLog({ events }) {
    return (_jsxs("section", { className: "panel", children: [_jsx("div", { className: "section-header", children: _jsx("h3", { children: "Activity" }) }), _jsx("div", { className: "activity-list", children: events.map((event) => (_jsxs("div", { className: "activity-row", children: [_jsxs("div", { children: [_jsx("div", { className: "activity-title", children: event.eventType }), _jsxs("div", { className: "activity-subtitle", children: [event.actorType, " \u00B7 ", formatRelativeTime(event.createdAt)] })] }), _jsx(Badge, { tone: "neutral", children: event.actorType })] }, event.id))) })] }));
}
