import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function formatRecord(record) {
    if (!record || Object.keys(record).length === 0) {
        return 'None';
    }
    return JSON.stringify(record, null, 2);
}
export function MetadataPanel({ request }) {
    return (_jsxs("section", { className: "panel stack-md", children: [_jsxs("div", { className: "section-heading", children: [_jsx("h2", { children: "Metadata" }), _jsx("span", { children: "Source and context" })] }), _jsxs("div", { className: "metadata-grid", children: [_jsxs("div", { children: [_jsx("dt", { children: "Harness" }), _jsx("dd", { children: request.sourceHarness })] }), _jsxs("div", { children: [_jsx("dt", { children: "Agent" }), _jsx("dd", { children: request.sourceAgentLabel || request.sourceAgentId })] }), _jsxs("div", { children: [_jsx("dt", { children: "Workflow" }), _jsx("dd", { children: request.sourceWorkflowLabel || 'Not provided' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Session" }), _jsx("dd", { children: request.sourceSessionKey })] }), _jsxs("div", { children: [_jsx("dt", { children: "Previous response" }), _jsx("dd", { children: request.sourcePreviousResponseId || 'None' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Gateway override" }), _jsx("dd", { children: request.sourceGatewayBaseUrl || 'Default' })] }), _jsxs("div", { children: [_jsx("dt", { children: "User key" }), _jsx("dd", { children: request.sourceUser || 'None' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Edited" }), _jsx("dd", { children: request.isEdited ? 'Yes' : 'No' })] })] }), _jsxs("div", { className: "metadata-code-group", children: [_jsxs("div", { children: [_jsx("h3", { children: "Source metadata" }), _jsx("pre", { children: formatRecord(request.sourceMetadata) })] }), _jsxs("div", { children: [_jsx("h3", { children: "Context" }), _jsx("pre", { children: formatRecord(request.context) })] })] })] }));
}
