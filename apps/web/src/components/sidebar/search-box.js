import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SearchBox({ value, onChange, inputRef }) {
    return (_jsxs("label", { className: "search-box", children: [_jsxs("svg", { className: "search-box__icon", width: "14", height: "14", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: [_jsx("circle", { cx: "7", cy: "7", r: "4.5", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("path", { d: "M10.5 10.5L14 14", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }), _jsx("input", { ref: inputRef, className: "search-box__input", type: "search", placeholder: "Search...", value: value, onChange: (event) => onChange(event.target.value) }), _jsx("span", { className: "search-box__hint", children: "/" })] }));
}
