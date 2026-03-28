import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ReviewEditor({ value, readOnly, saveState, onChange, onFocusReady, }) {
    return (_jsxs("section", { className: "panel stack-md", children: [_jsxs("div", { className: "section-heading", children: [_jsx("h2", { children: "Review content" }), _jsx("span", { children: saveState === 'saving'
                            ? 'Saving…'
                            : saveState === 'error'
                                ? 'Save failed'
                                : 'Saved' })] }), _jsxs("label", { className: "field", children: [_jsx("span", { className: "field__label", children: "Review markdown editor" }), _jsx("textarea", { className: "textarea editor-textarea", rows: 14, "aria-label": "Review markdown editor", value: value, readOnly: readOnly, onChange: (event) => onChange(event.target.value), ref: (element) => {
                            onFocusReady?.(element
                                ? () => {
                                    element.focus();
                                    element.setSelectionRange(element.value.length, element.value.length);
                                }
                                : null);
                        } })] })] }));
}
