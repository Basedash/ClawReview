import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function KeyboardShortcutsDialog({ open, shortcuts, onClose, }) {
    if (!open) {
        return null;
    }
    return (_jsx("div", { className: "overlay", role: "dialog", "aria-modal": "true", "aria-label": "Keyboard shortcuts", children: _jsxs("div", { className: "modal", children: [_jsxs("div", { className: "modal-header", children: [_jsx("h2", { children: "Keyboard shortcuts" }), _jsx("button", { className: "ghost-button", type: "button", onClick: onClose, children: "Close" })] }), _jsx("div", { className: "shortcut-list", children: shortcuts.map((shortcut) => (_jsxs("div", { className: "shortcut-row", children: [_jsx("span", { children: shortcut.description }), _jsx("kbd", { children: shortcut.keys })] }, shortcut.keys))) })] }) }));
}
