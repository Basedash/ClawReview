import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from '../common/badge.js';
import { Timestamp } from '../common/timestamp.js';
export function RequestHeader({ request }) {
    return (_jsxs("div", { className: "detail-header", children: [_jsxs("div", { children: [_jsxs("div", { className: "detail-header-topline", children: [_jsx(Badge, { tone: "muted", children: request.publicId }), _jsx(Badge, { tone: request.status === 'open' ? 'success' : 'muted', children: request.status }), _jsxs(Badge, { tone: request.resumeStatus === 'failed' ? 'danger' : 'muted', children: ["resume ", request.resumeStatus.replace(/_/g, ' ')] }), request.isEdited ? _jsx(Badge, { tone: "warning", children: "edited" }) : null] }), _jsx("h1", { children: request.title })] }), _jsxs("div", { className: "detail-header-meta", children: [_jsxs("div", { children: [_jsx("span", { children: "Updated" }), _jsx(Timestamp, { value: request.updatedAt })] }), _jsxs("div", { children: [_jsx("span", { children: "Created" }), _jsx(Timestamp, { value: request.createdAt })] })] })] }));
}
