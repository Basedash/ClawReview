import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function RequestSummary({ request }) {
    return (_jsxs("section", { className: "panel", children: [_jsx("h3", { className: "panel-title", children: "Summary" }), _jsx("p", { className: "summary-text", children: request.summary || 'No summary was provided for this review request.' })] }));
}
