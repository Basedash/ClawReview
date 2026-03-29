import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Badge } from '../common/badge.js';
import { Timestamp } from '../common/timestamp.js';
export function RequestHeader({ request }) {
    return (_jsxs("div", { className: "detail-header", children: [_jsxs("div", { className: "detail-header__top", children: [_jsx(Badge, { tone: request.status === 'open' ? 'success' : 'muted', dot: true, children: request.status }), request.isEdited ? _jsx(Badge, { tone: "warning", children: "edited" }) : null] }), _jsx("h1", { children: request.title }), _jsxs("div", { className: "detail-header__meta", children: [_jsx("span", { children: request.publicId }), _jsx("span", { className: "detail-header__meta-sep" }), _jsx("span", { children: _jsx(Timestamp, { value: request.createdAt }) }), _jsx("span", { className: "detail-header__meta-sep" }), _jsxs("span", { children: ["Updated ", _jsx(Timestamp, { value: request.updatedAt })] }), request.resumeStatus !== 'not_requested' && (_jsxs(_Fragment, { children: [_jsx("span", { className: "detail-header__meta-sep" }), _jsxs(Badge, { tone: request.resumeStatus === 'failed'
                                    ? 'danger'
                                    : request.resumeStatus === 'succeeded'
                                        ? 'success'
                                        : 'muted', children: ["resume: ", request.resumeStatus.replace(/_/g, ' ')] })] }))] })] }));
}
