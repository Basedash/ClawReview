import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function EmptyState({ title, description, action }) {
    return (_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-state__title", children: title }), _jsx("div", { className: "empty-state__description", children: description }), action ? _jsx("div", { className: "empty-state__action", children: action }) : null] }));
}
