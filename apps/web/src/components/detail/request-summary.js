import { jsx as _jsx } from "react/jsx-runtime";
export function RequestSummary({ request }) {
    if (!request.summary) {
        return null;
    }
    return (_jsx("div", { className: "card", children: _jsx("div", { className: "card__body", children: _jsx("p", { className: "summary-text", children: request.summary }) }) }));
}
