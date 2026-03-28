import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SearchBox({ value, onChange, inputRef, }) {
    return (_jsxs("label", { className: "search-box", children: [_jsx("span", { className: "search-box__hint", children: "/" }), _jsx("input", { ref: inputRef, className: "search-box__input", type: "search", placeholder: "Search requests", value: value, onChange: (event) => onChange(event.target.value) })] }));
}
