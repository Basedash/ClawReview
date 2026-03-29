import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { EmptyState } from './common/empty-state.js';
import { KeyboardShortcutsDialog } from './common/keyboard-shortcuts-dialog.js';
import { ThemeToggle } from './common/theme-toggle.js';
import { ActivityLog } from './detail/activity-log.js';
import { RequestHeader } from './detail/request-header.js';
import { RequestSummary } from './detail/request-summary.js';
import { ResumeStatusBanner } from './detail/resume-status-banner.js';
import { ReviewActions, } from './detail/review-actions.js';
import { ReviewEditor } from './detail/review-editor.js';
import { RequestFilters } from './sidebar/request-filters.js';
import { RequestList } from './sidebar/request-list.js';
import { SearchBox } from './sidebar/search-box.js';
export function LayoutShell({ requests, selectedId, selectedRequest, statusFilter, search, searchRef, saveState, isReviewSubmitting, isShortcutsOpen, shortcutEntries, reviewDraft, theme, onThemeToggle, onSearchChange, onStatusFilterChange, onSelectRequest, onCloseShortcuts, onContentChange, onReviewDraftChange, onReviewSubmit, onRetryResume, registerEditorFocus, }) {
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "app-shell", children: [_jsxs("aside", { className: "sidebar", children: [_jsx("div", { className: "sidebar__header", children: _jsxs("div", { className: "sidebar__brand", children: [_jsx("div", { className: "sidebar__logo", children: _jsx("svg", { viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M4 8l3 3 5-6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx("span", { className: "sidebar__title", children: "ClawReview" })] }) }), _jsxs("div", { className: "sidebar__controls", children: [_jsx(SearchBox, { value: search, onChange: onSearchChange, inputRef: searchRef }), _jsx(RequestFilters, { value: statusFilter, onChange: onStatusFilterChange })] }), requests.length > 0 ? (_jsx(RequestList, { requests: requests, selectedId: selectedId, onSelect: onSelectRequest, statusLabel: statusFilter })) : (_jsx(EmptyState, { title: "No requests", description: "Review requests from agents will appear here." })), _jsxs("div", { className: "sidebar__footer", children: [_jsxs("span", { className: "sidebar__footer-info", children: [requests.length, " request", requests.length !== 1 ? 's' : ''] }), _jsx(ThemeToggle, { theme: theme, onToggle: onThemeToggle })] })] }), _jsx("main", { className: "detail-pane", children: selectedRequest ? (_jsxs("div", { className: "detail-pane__content", children: [_jsx(RequestHeader, { request: selectedRequest }), _jsx(ResumeStatusBanner, { request: selectedRequest, onRetry: selectedRequest.resumeStatus === 'failed'
                                        ? onRetryResume
                                        : undefined, retrying: isReviewSubmitting }), _jsx(RequestSummary, { request: selectedRequest }), _jsx(ReviewEditor, { value: selectedRequest.editedContentMarkdown, readOnly: selectedRequest.status === 'closed', saveState: saveState, onChange: onContentChange, onFocusReady: registerEditorFocus }), _jsx(ReviewActions, { draft: reviewDraft, disabled: saveState === 'saving' ||
                                        selectedRequest.status === 'closed' ||
                                        isReviewSubmitting, onChange: onReviewDraftChange, onSubmit: onReviewSubmit }), _jsx(ActivityLog, { events: selectedRequest.events })] })) : (_jsx("div", { className: "detail-pane__empty", children: _jsx(EmptyState, { title: "No request selected", description: "Select a request from the sidebar to begin reviewing." }) })) })] }), _jsx(KeyboardShortcutsDialog, { open: isShortcutsOpen, shortcuts: shortcutEntries, onClose: onCloseShortcuts })] }));
}
