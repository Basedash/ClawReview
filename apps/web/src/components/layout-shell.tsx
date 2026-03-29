import type {
  RequestDetail,
  RequestFilterStatus,
  RequestListItem,
} from '@clawreview/shared';
import type { RefObject } from 'react';

import type { ShortcutDefinition } from '../lib/shortcuts.js';
import { EmptyState } from './common/empty-state.js';
import { KeyboardShortcutsDialog } from './common/keyboard-shortcuts-dialog.js';
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
            <div>
              <div className="eyebrow">Human review</div>
              <h1 className="sidebar__title">ClawReview</h1>
            </div>
            <p className="sidebar__subtitle">
              Review queued agent work and resume the originating workflow.
            </p>
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
              title="No matching requests"
              description="Open review requests will appear here once an agent submits them."
            />
          )}
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

              <section className="card detail-pane__primary">
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
              </section>

              <ActivityLog events={selectedRequest.events} />
            </div>
          ) : (
            <div className="detail-pane__empty">
              <EmptyState
                title="Select a request"
                description="Choose a request from the sidebar to inspect its summary, edit its markdown, and send a review decision."
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
