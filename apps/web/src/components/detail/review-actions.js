import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
const actions = [
    { value: 'approve', label: 'Approve' },
    { value: 'comment', label: 'Comment' },
    { value: 'reject', label: 'Reject' },
];
export function ReviewActions({ disabled = false, draft, onChange, onSubmit, }) {
    const [submitting, setSubmitting] = useState(false);
    const submitLabel = useMemo(() => {
        const selected = actions.find((item) => item.value === draft.action);
        return selected ? `${selected.label} request` : 'Submit review';
    }, [draft.action]);
    async function handleSubmit() {
        if (disabled || submitting) {
            return;
        }
        setSubmitting(true);
        try {
            await onSubmit(draft);
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsxs("section", { className: "panel stack-md", children: [_jsxs("div", { className: "stack-xs", children: [_jsx("div", { className: "section-title", children: "Review" }), _jsx("div", { className: "muted", children: "Approve to continue, comment to request another pass, or reject to stop this path." })] }), _jsx("div", { className: "segmented", role: "tablist", "aria-label": "Review actions", children: actions.map((item) => (_jsx("button", { type: "button", className: `segmented__item ${draft.action === item.value ? 'segmented__item--active' : ''}`, "aria-pressed": draft.action === item.value, onClick: () => onChange({ ...draft, action: item.value }), disabled: disabled || submitting, children: item.label }, item.value))) }), _jsxs("label", { className: "field", children: [_jsx("span", { className: "field__label", children: "Reviewer comment" }), _jsx("textarea", { className: "textarea", rows: 4, placeholder: "Optional notes for the agent...", value: draft.comment, onChange: (event) => onChange({ ...draft, comment: event.target.value }), disabled: disabled || submitting })] }), _jsx("div", { className: "actions-row", children: _jsx("button", { type: "button", className: "button button--primary", onClick: handleSubmit, disabled: disabled || submitting, children: submitting ? 'Submitting…' : submitLabel }) })] }));
}
