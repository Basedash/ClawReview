import type {
  RequestDetail,
  RequestFilterStatus,
  RequestListItem,
} from '@clawreview/shared';
import type { RefObject } from 'react';

import type { ShortcutDefinition } from '../lib/shortcuts.js';
import { EmptyState } from './common/empty-state.js';
import { KeyboardShortcutsDialog } from './common/keyboard-shortcuts-dialog.js';
import { ThemeToggle } from './common/theme-toggle.js';
import { ActivityLog } from './detail/activity-log.js';
import { RequestHeader } from './detail/request-header.js';
import { RequestSummary } from './detail/request-summary.js';
import { ResumeStatusBanner } from './detail/resume-status-banner.js';
import {
  ReviewActions,
  type ReviewDraftState,
} from './detail/review-actions.js';
import { ReviewEditor } from './detail/review-editor.js';
import { RequestFilters } from './sidebar/request-filters.js';
import { RequestList } from './sidebar/request-list.js';
import { SearchBox } from './sidebar/search-box.js';

export type { ReviewDraftState } from './detail/review-actions.js';

export interface LayoutShellProps {
  requests: RequestListItem[];
  selectedId: string | null;
  selectedRequest: RequestDetail | null;
  statusFilter: RequestFilterStatus;
  search: string;
  searchRef: RefObject<HTMLInputElement | null>;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  isReviewSubmitting: boolean;
  isShortcutsOpen: boolean;
  shortcutEntries: ShortcutDefinition[];
  reviewDraft: ReviewDraftState;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (status: RequestFilterStatus) => void;
  onSelectRequest: (requestId: string) => void;
  onCloseShortcuts: () => void;
  onContentChange: (markdown: string) => void;
  onReviewDraftChange: (draft: ReviewDraftState) => void;
  onReviewSubmit: (draft: ReviewDraftState) => Promise<void>;
  onRetryResume: () => void;
  registerEditorFocus: (focus: (() => void) | null) => void;
}

export function LayoutShell({
  requests,
  selectedId,
  selectedRequest,
  statusFilter,
  search,
  searchRef,
  saveState,
  isReviewSubmitting,
  isShortcutsOpen,
  shortcutEntries,
  reviewDraft,
  theme,
  onThemeToggle,
  onSearchChange,
  onStatusFilterChange,
  onSelectRequest,
  onCloseShortcuts,
  onContentChange,
  onReviewDraftChange,
  onReviewSubmit,
  onRetryResume,
  registerEditorFocus,
}: LayoutShellProps) {
  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar__header">
            <div className="sidebar__brand">
              <div className="sidebar__logo">
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M4 8l3 3 5-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="sidebar__title">ClawReview</span>
            </div>
          </div>

          <div className="sidebar__controls">
            <SearchBox
              value={search}
              onChange={onSearchChange}
              inputRef={searchRef}
            />
            <RequestFilters
              value={statusFilter}
              onChange={onStatusFilterChange}
            />
          </div>

          {requests.length > 0 ? (
            <RequestList
              requests={requests}
              selectedId={selectedId}
              onSelect={onSelectRequest}
              statusLabel={statusFilter}
            />
          ) : (
            <EmptyState
              title="No requests"
              description="Review requests from agents will appear here."
            />
          )}

          <div className="sidebar__footer">
            <span className="sidebar__footer-info">
              {requests.length} request{requests.length !== 1 ? 's' : ''}
            </span>
            <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          </div>
        </aside>

        <main className="detail-pane">
          {selectedRequest ? (
            <div className="detail-pane__content">
              <RequestHeader request={selectedRequest} />
              <ResumeStatusBanner
                request={selectedRequest}
                onRetry={
                  selectedRequest.resumeStatus === 'failed'
                    ? onRetryResume
                    : undefined
                }
                retrying={isReviewSubmitting}
              />
              <RequestSummary request={selectedRequest} />

              <ReviewEditor
                value={selectedRequest.editedContentMarkdown}
                readOnly={selectedRequest.status === 'closed'}
                saveState={saveState}
                onChange={onContentChange}
                onFocusReady={registerEditorFocus}
              />

              <ReviewActions
                draft={reviewDraft}
                disabled={
                  saveState === 'saving' ||
                  selectedRequest.status === 'closed' ||
                  isReviewSubmitting
                }
                onChange={onReviewDraftChange}
                onSubmit={onReviewSubmit}
              />

              <ActivityLog events={selectedRequest.events} />
            </div>
          ) : (
            <div className="detail-pane__empty">
              <EmptyState
                title="No request selected"
                description="Select a request from the sidebar to begin reviewing."
              />
            </div>
          )}
        </main>
      </div>

      <KeyboardShortcutsDialog
        open={isShortcutsOpen}
        shortcuts={shortcutEntries}
        onClose={onCloseShortcuts}
      />
    </>
  );
}
