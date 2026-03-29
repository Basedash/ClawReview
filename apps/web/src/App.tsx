import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  RequestDetail,
  RequestFilterStatus,
  RequestListItem,
  SubmitReviewInput,
  UpdateRequestContentInput,
} from '@clawreview/shared';

import { LayoutShell, type ReviewDraftState } from './components/layout-shell.js';
import { useTheme } from './lib/use-theme.js';
import {
  fetchRequestDetail,
  fetchRequests,
  retryResume,
  submitReview,
  updateRequestContent,
} from './lib/api.js';
import { getShortcutEntries, isEditableTarget } from './lib/shortcuts.js';
import './styles/tokens.css';
import './styles/globals.css';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function App() {
  const [requests, setRequests] = useState<RequestListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<RequestFilterStatus>('open');
  const [search, setSearch] = useState('');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraftState>({
    action: 'approve',
    comment: '',
  });
  const { theme, toggle: toggleTheme } = useTheme();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const editorFocusRef = useRef<(() => void) | null>(null);

  const shortcutEntries = useMemo(() => getShortcutEntries(), []);

  useEffect(() => {
    let mounted = true;

    void fetchRequests({
      status: statusFilter,
      search,
      limit: 100,
    }).then((response) => {
      if (!mounted) {
        return;
      }

      setRequests(response.requests);
      setSelectedId((current) => current ?? response.requests[0]?.id ?? null);
    });

    return () => {
      mounted = false;
    };
  }, [statusFilter, search, reloadKey]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedRequest(null);
      return;
    }

    let mounted = true;
    void fetchRequestDetail(selectedId).then((response) => {
      if (!mounted) {
        return;
      }

      setSelectedRequest(response.request);
    });

    return () => {
      mounted = false;
    };
  }, [selectedId, reloadKey]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        if (event.key === '?' && event.shiftKey) {
          setIsShortcutsOpen((current) => !current);
        }
        return;
      }

      switch (event.key) {
        case 'j':
          event.preventDefault();
          setSelectedId((current) => {
            if (!requests.length) {
              return null;
            }
            const index = requests.findIndex((request) => request.id === current);
            return (
              requests[Math.min(index + 1, requests.length - 1)]?.id ??
              requests[0]?.id ??
              null
            );
          });
          break;
        case 'k':
          event.preventDefault();
          setSelectedId((current) => {
            if (!requests.length) {
              return null;
            }
            const index = requests.findIndex((request) => request.id === current);
            return (
              requests[Math.max(index - 1, 0)]?.id ?? requests[0]?.id ?? null
            );
          });
          break;
        case '/':
          event.preventDefault();
          searchRef.current?.focus();
          break;
        case 'e':
          event.preventDefault();
          editorFocusRef.current?.();
          break;
        case '?':
          event.preventDefault();
          setIsShortcutsOpen((current) => !current);
          break;
        case '[':
          event.preventDefault();
          setSelectedId((current) => {
            if (!requests.length) {
              return null;
            }
            const index = requests.findIndex((request) => request.id === current);
            return (
              requests[Math.max(index - 1, 0)]?.id ?? requests[0]?.id ?? null
            );
          });
          break;
        case ']':
          event.preventDefault();
          setSelectedId((current) => {
            if (!requests.length) {
              return null;
            }
            const index = requests.findIndex((request) => request.id === current);
            return (
              requests[Math.min(index + 1, requests.length - 1)]?.id ??
              requests[0]?.id ??
              null
            );
          });
          break;
        default:
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
          }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [requests]);

  async function handleContentChange(nextMarkdown: string) {
    if (!selectedRequest) {
      return;
    }

    setSaveState('saving');
    try {
      const updated = await updateRequestContent(selectedRequest.id, {
        editedContentMarkdown: nextMarkdown,
      } satisfies UpdateRequestContentInput);
      setSelectedRequest(updated.request);
      setSaveState('saved');
      setReloadKey((current) => current + 1);
    } catch {
      setSaveState('error');
    }
  }

  async function handleReviewSubmit(input: {
    action: ReviewDraftState['action'];
    comment: string;
  }) {
    if (!selectedRequest) {
      return;
    }

    setIsReviewSubmitting(true);
    try {
      const response = await submitReview(selectedRequest.id, {
        action: input.action,
        comment: input.comment,
      } satisfies SubmitReviewInput);
      setSelectedRequest(response.request);
      setReviewDraft({ action: 'approve', comment: '' });
      setReloadKey((current) => current + 1);
    } finally {
      setIsReviewSubmitting(false);
    }
  }

  async function handleRetryResume() {
    if (!selectedRequest) {
      return;
    }

    const response = await retryResume(selectedRequest.id);
    setSelectedRequest((current: RequestDetail | null) =>
      current
        ? {
            ...current,
            resumeStatus: response.resumeStatus,
          }
        : current,
    );
    setReloadKey((current) => current + 1);
  }

  return (
    <LayoutShell
      requests={requests}
      selectedId={selectedId}
      selectedRequest={selectedRequest}
      statusFilter={statusFilter}
      search={search}
      searchRef={searchRef}
      saveState={saveState}
      isReviewSubmitting={isReviewSubmitting}
      isShortcutsOpen={isShortcutsOpen}
      shortcutEntries={shortcutEntries}
      reviewDraft={reviewDraft}
      theme={theme}
      onThemeToggle={toggleTheme}
      onSearchChange={setSearch}
      onStatusFilterChange={setStatusFilter}
      onSelectRequest={setSelectedId}
      onCloseShortcuts={() => setIsShortcutsOpen(false)}
      onContentChange={handleContentChange}
      onReviewDraftChange={setReviewDraft}
      onReviewSubmit={handleReviewSubmit}
      onRetryResume={handleRetryResume}
      registerEditorFocus={(focus) => {
        editorFocusRef.current = focus;
      }}
    />
  );
}
