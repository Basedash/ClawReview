import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';

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
const SAVE_DEBOUNCE_MS = 400;

function requestPath(requestId: string) {
  return `/requests/${encodeURIComponent(requestId)}`;
}

function ReviewWorkspace() {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId?: string }>();
  const selectedId = requestId ?? null;
  const [requests, setRequests] = useState<RequestListItem[]>([]);
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
  const selectedIdRef = useRef<string | null>(selectedId);
  const saveTimeoutRef = useRef<number | null>(null);
  const syncedMarkdownRef = useRef('');
  const saveTokenRef = useRef(0);

  const shortcutEntries = useMemo(() => getShortcutEntries(), []);
  const selectRequest = useCallback(
    (requestId: string | null, options?: { replace?: boolean }) => {
      void navigate(requestId ? requestPath(requestId) : '/', {
        replace: options?.replace ?? false,
      });
    },
    [navigate],
  );

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

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

      const nextSelectedId = selectedIdRef.current;
      if (!nextSelectedId && response.requests[0]?.id) {
        selectRequest(response.requests[0].id, { replace: true });
      }
    });

    return () => {
      mounted = false;
    };
  }, [statusFilter, search, reloadKey, selectRequest]);

  useEffect(() => {
    saveTokenRef.current += 1;
    syncedMarkdownRef.current = '';
    setSaveState('idle');
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (!selectedId) {
      setSelectedRequest(null);
      return;
    }

    let mounted = true;
    void fetchRequestDetail(selectedId)
      .then((response) => {
        if (!mounted) {
          return;
        }
        setSelectedRequest(response.request);
        syncedMarkdownRef.current = response.request.editedContentMarkdown;
        setSaveState('saved');
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setSelectedRequest(null);
      });

    return () => {
      mounted = false;
    };
  }, [selectedId, reloadKey]);

  useEffect(() => {
    if (!selectedRequest) {
      return;
    }

    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const nextMarkdown = selectedRequest.editedContentMarkdown;
    if (nextMarkdown === syncedMarkdownRef.current) {
      return;
    }

    setSaveState('saving');
    const requestId = selectedRequest.id;
    const saveToken = saveTokenRef.current + 1;
    saveTokenRef.current = saveToken;

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        const updated = await updateRequestContent(requestId, {
          editedContentMarkdown: nextMarkdown,
        } satisfies UpdateRequestContentInput);

        if (saveTokenRef.current !== saveToken) {
          return;
        }

        syncedMarkdownRef.current = updated.request.editedContentMarkdown;
        setSelectedRequest((current) =>
          current?.id === requestId ? updated.request : current,
        );
        setRequests((current) =>
          current.map((request) =>
            request.id === requestId
              ? {
                  ...request,
                  updatedAt: updated.request.updatedAt,
                  isEdited: updated.request.isEdited,
                  status: updated.request.status,
                  reviewState: updated.request.reviewState,
                  resumeStatus: updated.request.resumeStatus,
                }
              : request,
          ),
        );
        setSaveState('saved');
      } catch {
        if (saveTokenRef.current === saveToken) {
          setSaveState('error');
        }
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [selectedRequest?.editedContentMarkdown, selectedRequest?.id]);

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
          selectRequest(
            (() => {
              if (!requests.length) {
                return null;
              }

              const index = requests.findIndex(
                (request) => request.id === selectedIdRef.current,
              );
              return (
                requests[Math.min(index + 1, requests.length - 1)]?.id ??
                requests[0]?.id ??
                null
              );
            })(),
          );
          break;
        case 'k':
          event.preventDefault();
          selectRequest(
            (() => {
              if (!requests.length) {
                return null;
              }

              const index = requests.findIndex(
                (request) => request.id === selectedIdRef.current,
              );
              return (
                requests[Math.max(index - 1, 0)]?.id ?? requests[0]?.id ?? null
              );
            })(),
          );
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
          selectRequest(
            (() => {
              if (!requests.length) {
                return null;
              }

              const index = requests.findIndex(
                (request) => request.id === selectedIdRef.current,
              );
              return (
                requests[Math.max(index - 1, 0)]?.id ?? requests[0]?.id ?? null
              );
            })(),
          );
          break;
        case ']':
          event.preventDefault();
          selectRequest(
            (() => {
              if (!requests.length) {
                return null;
              }

              const index = requests.findIndex(
                (request) => request.id === selectedIdRef.current,
              );
              return (
                requests[Math.min(index + 1, requests.length - 1)]?.id ??
                requests[0]?.id ??
                null
              );
            })(),
          );
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
  }, [requests, selectRequest]);

  function handleContentChange(nextMarkdown: string) {
    setSelectedRequest((current) =>
      current
        ? {
            ...current,
            editedContentMarkdown: nextMarkdown,
            isEdited: nextMarkdown !== current.originalContentMarkdown,
          }
        : current,
    );
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
      onSelectRequest={(requestId) => selectRequest(requestId)}
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ReviewWorkspace />} />
      <Route path="/requests/:requestId" element={<ReviewWorkspace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
