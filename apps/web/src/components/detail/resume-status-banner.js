import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from '../common/badge.js';
export function ResumeStatusBanner({ request, onRetry, retrying = false, }) {
    if (request.resumeStatus === 'not_requested') {
        return null;
    }
    const tone = request.resumeStatus === 'failed'
        ? 'danger'
        : request.resumeStatus === 'succeeded'
            ? 'success'
            : 'warning';
    const label = request.resumeStatus.replace(/_/g, ' ');
    return (_jsxs("div", { className: `resume-banner tone-${tone}`, children: [_jsxs("div", { className: "resume-banner__header", children: [_jsx(Badge, { tone: tone, children: label }), request.resumeStatus === 'failed' && onRetry ? (_jsx("button", { type: "button", className: "button button--ghost", onClick: onRetry, disabled: retrying, children: retrying ? 'Retrying…' : 'Retry resume' })) : null] }), request.resumeStatus === 'succeeded' ? (_jsx("p", { className: "resume-banner__success", children: "Resume dispatched successfully." })) : null, request.resumeError ? (_jsx("p", { className: "resume-banner__error", children: request.resumeError })) : null] }));
}
