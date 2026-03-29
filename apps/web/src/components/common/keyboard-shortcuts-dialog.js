import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function KeyboardShortcutsDialog({ open, shortcuts, onClose, }) {
    if (!open) {
        return null;
    }
    return (_jsx("div", { className: "overlay", role: "dialog", "aria-modal": "true", "aria-label": "Keyboard shortcuts", onClick: (e) => {
            if (e.target === e.currentTarget)
                onClose();
        }, onKeyDown: (e) => {
            if (e.key === 'Escape')
                onClose();
        }, children: _jsxs("div", { className: "modal", children: [_jsxs("div", { className: "modal__header", children: [_jsx("h2", { children: "Keyboard shortcuts" }), _jsx("button", { className: "modal__close", type: "button", onClick: onClose, "aria-label": "Close", children: _jsx("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M4 4l8 8M12 4l-8 8", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }) })] }), _jsx("div", { className: "shortcut-list", children: shortcuts.map((shortcut) => (_jsxs("div", { className: "shortcut-row", children: [_jsx("span", { children: shortcut.description }), _jsx("kbd", { children: shortcut.keys })] }, shortcut.keys))) })] }) }));
}
