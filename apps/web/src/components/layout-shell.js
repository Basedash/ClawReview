import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { EmptyState } from './common/empty-state.js';
import { KeyboardShortcutsDialog } from './common/keyboard-shortcuts-dialog.js';
import { ActivityLog } from './detail/activity-log.js';
import { MetadataPanel } from './detail/metadata-panel.js';
import { RequestHeader } from './detail/request-header.js';
import { RequestSummary } from './detail/request-summary.js';
import { ResumeStatusBanner } from './detail/resume-status-banner.js';
import { ReviewActions, } from './detail/review-actions.js';
import { ReviewEditor } from './detail/review-editor.js';
import { RequestFilters } from './sidebar/request-filters.js';
import { RequestList } from './sidebar/request-list.js';
import { SearchBox } from './sidebar/search-box.js';
export function LayoutShell({ requests, selectedId, selectedRequest, statusFilter, search, searchRef, saveState, isReviewSubmitting, isShortcutsOpen, shortcutEntries, reviewDraft, onSearchChange, onStatusFilterChange, onSelectRequest, onCloseShortcuts, onContentChange, onReviewDraftChange, onReviewSubmit, onRetryResume, registerEditorFocus, }) {
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "app-shell", children: [_jsxs("aside", { className: "sidebar", children: [_jsxs("div", { className: "sidebar__header", children: [_jsxs("div", { children: [_jsx("div", { className: "eyebrow", children: "Human review" }), _jsx("h1", { className: "sidebar__title", children: "ClawReview" })] }), _jsx("p", { className: "sidebar__subtitle", children: "Review queued agent work and resume the originating workflow." })] }), _jsxs("div", { className: "sidebar__controls", children: [_jsx(SearchBox, { value: search, onChange: onSearchChange, inputRef: searchRef }), _jsx(RequestFilters, { value: statusFilter, onChange: onStatusFilterChange })] }), requests.length > 0 ? (_jsx(RequestList, { requests: requests, selectedId: selectedId, onSelect: onSelectRequest, statusLabel: statusFilter })) : (_jsx(EmptyState, { title: "No matching requests", description: "Open review requests will appear here once an agent submits them." }))] }), _jsx("main", { className: "detail-pane", children: selectedRequest ? (_jsxs("div", { className: "detail-pane__content", children: [_jsx(RequestHeader, { request: selectedRequest }), _jsx(ResumeStatusBanner, { request: selectedRequest, onRetry: selectedRequest.resumeStatus === 'failed'
                                        ? onRetryResume
                                        : undefined, retrying: isReviewSubmitting }), _jsx(RequestSummary, { request: selectedRequest }), _jsxs("div", { className: "detail-pane__grid", children: [_jsxs("section", { className: "card detail-pane__primary", children: [_jsx(ReviewEditor, { value: selectedRequest.editedContentMarkdown, readOnly: selectedRequest.status === 'closed', saveState: saveState, onChange: onContentChange, onFocusReady: registerEditorFocus }), _jsx(ReviewActions, { draft: reviewDraft, disabled: saveState === 'saving' ||
                                                        selectedRequest.status === 'closed' ||
                                                        isReviewSubmitting, onChange: onReviewDraftChange, onSubmit: onReviewSubmit })] }), _jsxs("aside", { className: "detail-pane__secondary", children: [_jsx(MetadataPanel, { request: selectedRequest }), _jsx(ActivityLog, { events: selectedRequest.events })] })] })] })) : (_jsx("div", { className: "detail-pane__empty", children: _jsx(EmptyState, { title: "Select a request", description: "Choose a request from the sidebar to inspect its summary, edit its markdown, and send a review decision." }) })) })] }), _jsx(KeyboardShortcutsDialog, { open: isShortcutsOpen, shortcuts: shortcutEntries, onClose: onCloseShortcuts })] }));
}
