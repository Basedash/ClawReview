import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ResumeStatusBanner({ request, onRetry, retrying = false, }) {
    if (request.resumeStatus === 'not_requested') {
        return null;
    }
    const variant = request.resumeStatus === 'failed'
        ? 'danger'
        : request.resumeStatus === 'succeeded'
            ? 'success'
            : 'warning';
    const label = request.resumeStatus === 'succeeded'
        ? 'Resume dispatched successfully'
        : request.resumeStatus === 'failed'
            ? 'Resume failed'
            : `Resume ${request.resumeStatus.replace(/_/g, ' ')}`;
    return (_jsxs("div", { className: `resume-banner resume-banner--${variant}`, children: [_jsxs("div", { className: "resume-banner__text", children: [_jsx("span", { className: "resume-banner__label", children: label }), request.resumeError ? (_jsx("span", { className: "resume-banner__detail", children: request.resumeError })) : null] }), request.resumeStatus === 'failed' && onRetry ? (_jsx("button", { type: "button", className: "button button--sm button--ghost", onClick: onRetry, disabled: retrying, children: retrying ? 'Retrying…' : 'Retry' })) : null] }));
}
