import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { LayoutShell } from './components/layout-shell.js';
import { useTheme } from './lib/use-theme.js';
import { fetchRequestDetail, fetchRequests, retryResume, submitReview, updateRequestContent, } from './lib/api.js';
import { getShortcutEntries, isEditableTarget } from './lib/shortcuts.js';
import './styles/tokens.css';
import './styles/globals.css';
const SAVE_DEBOUNCE_MS = 400;
const REVIEW_POLL_INTERVAL_MS = 2_000;
function toReviewState(action) {
    switch (action) {
        case 'approve':
            return 'approved';
        case 'comment':
            return 'commented';
        case 'reject':
            return 'rejected';
    }
}
function toListItem(request) {
    return {
        id: request.id,
        publicId: request.publicId,
        title: request.title,
        summary: request.summary,
        status: request.status,
        reviewState: request.reviewState,
        resumeStatus: request.resumeStatus,
        isEdited: request.isEdited,
        sourceHarness: request.sourceHarness,
        sourceAgentId: request.sourceAgentId,
        sourceAgentLabel: request.sourceAgentLabel,
        sourceWorkflowLabel: request.sourceWorkflowLabel,
        updatedAt: request.updatedAt,
        createdAt: request.createdAt,
        closedAt: request.closedAt,
    };
}
function reconcileRequestList(requests, statusFilter, request) {
    const nextItem = toListItem(request);
    const shouldInclude = statusFilter === 'all' || statusFilter === nextItem.status;
    const remaining = requests.filter((item) => item.id !== nextItem.id);
    if (!shouldInclude) {
        return remaining;
    }
    return [nextItem, ...remaining];
}
function createOptimisticEvent(requestId, eventType, actorType, createdAt, payload) {
    return {
        id: `optimistic-${eventType}-${createdAt}`,
        requestId,
        eventType,
        actorType,
        payload,
        createdAt,
    };
}
function buildOptimisticReviewRequest(request, draft) {
    const submittedAt = new Date().toISOString();
    const commentText = draft.comment.trim().length > 0 ? draft.comment : null;
    const optimisticReview = {
        id: `optimistic-review-${submittedAt}`,
        requestId: request.id,
        action: draft.action,
        commentText,
        resumePayloadJson: null,
        submittedAt,
    };
    return {
        ...request,
        status: 'closed',
        reviewState: toReviewState(draft.action),
        resumeStatus: 'pending',
        resumeError: null,
        closedAt: submittedAt,
        updatedAt: submittedAt,
        lastResumeAttemptAt: submittedAt,
        lastResumeResponseId: null,
        reviews: [optimisticReview, ...request.reviews],
        events: [
            ...request.events,
            createOptimisticEvent(request.id, 'review.submitted', 'human', submittedAt, {
                action: draft.action,
                comment: draft.comment,
            }),
            createOptimisticEvent(request.id, 'resume.dispatched', 'system', submittedAt, null),
        ],
    };
}
function buildOptimisticRetryRequest(request) {
    const attemptedAt = new Date().toISOString();
    return {
        ...request,
        resumeStatus: 'pending',
        resumeError: null,
        updatedAt: attemptedAt,
        lastResumeAttemptAt: attemptedAt,
        lastResumeResponseId: null,
        events: [
            ...request.events,
            createOptimisticEvent(request.id, 'resume.dispatched', 'system', attemptedAt, null),
        ],
    };
}
function requestPath(requestId) {
    return `/requests/${encodeURIComponent(requestId)}`;
}
function ReviewWorkspace() {
    const navigate = useNavigate();
    const { requestId } = useParams();
    const selectedId = requestId ?? null;
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [statusFilter, setStatusFilter] = useState('open');
    const [search, setSearch] = useState('');
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
    const [saveState, setSaveState] = useState('idle');
    const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
    const [reviewDraft, setReviewDraft] = useState({
        action: 'approve',
        comment: '',
    });
    const { theme, toggle: toggleTheme } = useTheme();
    const searchRef = useRef(null);
    const editorFocusRef = useRef(null);
    const selectedIdRef = useRef(selectedId);
    const saveTimeoutRef = useRef(null);
    const syncedMarkdownRef = useRef('');
    const saveTokenRef = useRef(0);
    const shortcutEntries = useMemo(() => getShortcutEntries(), []);
    const selectRequest = useCallback((requestId, options) => {
        void navigate(requestId ? requestPath(requestId) : '/', {
            replace: options?.replace ?? false,
        });
    }, [navigate]);
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
    }, [statusFilter, search, selectRequest]);
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
    }, [selectedId]);
    useEffect(() => {
        if (!selectedRequest ||
            selectedRequest.resumeStatus !== 'pending' ||
            isReviewSubmitting) {
            return;
        }
        const pendingRequestId = selectedRequest.id;
        let cancelled = false;
        async function refreshPendingRequest() {
            try {
                const [detailResponse, listResponse] = await Promise.all([
                    fetchRequestDetail(pendingRequestId),
                    fetchRequests({
                        status: statusFilter,
                        search,
                        limit: 100,
                    }),
                ]);
                if (cancelled) {
                    return;
                }
                setSelectedRequest((current) => current?.id === detailResponse.request.id
                    ? detailResponse.request
                    : current);
                setRequests(listResponse.requests);
            }
            catch {
                // Keep polling on the next interval if the background refresh fails.
            }
        }
        void refreshPendingRequest();
        const intervalId = window.setInterval(() => {
            void refreshPendingRequest();
        }, REVIEW_POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [
        isReviewSubmitting,
        search,
        selectedRequest,
        statusFilter,
    ]);
    useEffect(() => {
        if (!selectedRequest) {
            return;
        }
        if (saveTimeoutRef.current !== null) {
            window.clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }
        if (selectedRequest.status === 'closed') {
            return;
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
                });
                if (saveTokenRef.current !== saveToken) {
                    return;
                }
                syncedMarkdownRef.current = updated.request.editedContentMarkdown;
                setSelectedRequest((current) => current?.id === requestId ? updated.request : current);
                setRequests((current) => current.map((request) => request.id === requestId
                    ? {
                        ...request,
                        updatedAt: updated.request.updatedAt,
                        isEdited: updated.request.isEdited,
                        status: updated.request.status,
                        reviewState: updated.request.reviewState,
                        resumeStatus: updated.request.resumeStatus,
                    }
                    : request));
                setSaveState('saved');
            }
            catch {
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
    }, [
        selectedRequest?.editedContentMarkdown,
        selectedRequest?.id,
        selectedRequest?.status,
    ]);
    useEffect(() => {
        function onKeyDown(event) {
            if (isEditableTarget(event.target)) {
                if (event.key === '?' && event.shiftKey) {
                    setIsShortcutsOpen((current) => !current);
                }
                return;
            }
            switch (event.key) {
                case 'j':
                    event.preventDefault();
                    selectRequest((() => {
                        if (!requests.length) {
                            return null;
                        }
                        const index = requests.findIndex((request) => request.id === selectedIdRef.current);
                        return (requests[Math.min(index + 1, requests.length - 1)]?.id ??
                            requests[0]?.id ??
                            null);
                    })());
                    break;
                case 'k':
                    event.preventDefault();
                    selectRequest((() => {
                        if (!requests.length) {
                            return null;
                        }
                        const index = requests.findIndex((request) => request.id === selectedIdRef.current);
                        return (requests[Math.max(index - 1, 0)]?.id ?? requests[0]?.id ?? null);
                    })());
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
                    selectRequest((() => {
                        if (!requests.length) {
                            return null;
                        }
                        const index = requests.findIndex((request) => request.id === selectedIdRef.current);
                        return (requests[Math.max(index - 1, 0)]?.id ?? requests[0]?.id ?? null);
                    })());
                    break;
                case ']':
                    event.preventDefault();
                    selectRequest((() => {
                        if (!requests.length) {
                            return null;
                        }
                        const index = requests.findIndex((request) => request.id === selectedIdRef.current);
                        return (requests[Math.min(index + 1, requests.length - 1)]?.id ??
                            requests[0]?.id ??
                            null);
                    })());
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
    function handleContentChange(nextMarkdown) {
        setSelectedRequest((current) => current
            ? {
                ...current,
                editedContentMarkdown: nextMarkdown,
                isEdited: nextMarkdown !== current.originalContentMarkdown,
            }
            : current);
    }
    async function handleReviewSubmit(input) {
        if (!selectedRequest) {
            return;
        }
        const previousRequest = selectedRequest;
        const previousDraft = reviewDraft;
        const optimisticRequest = buildOptimisticReviewRequest(selectedRequest, input);
        saveTokenRef.current += 1;
        if (saveTimeoutRef.current !== null) {
            window.clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }
        setSaveState('saved');
        setSelectedRequest(optimisticRequest);
        setRequests((current) => reconcileRequestList(current, statusFilter, optimisticRequest));
        setReviewDraft({ action: 'approve', comment: '' });
        setIsReviewSubmitting(true);
        try {
            const response = await submitReview(selectedRequest.id, {
                action: input.action,
                comment: input.comment,
                editedContentMarkdown: selectedRequest.editedContentMarkdown,
            });
            setSelectedRequest(response.request);
            setRequests((current) => reconcileRequestList(current, statusFilter, response.request));
        }
        catch (error) {
            setSelectedRequest(previousRequest);
            setRequests((current) => reconcileRequestList(current, statusFilter, previousRequest));
            setReviewDraft(previousDraft);
            throw error;
        }
        finally {
            setIsReviewSubmitting(false);
        }
    }
    async function handleRetryResume() {
        if (!selectedRequest) {
            return;
        }
        const previousRequest = selectedRequest;
        const optimisticRequest = buildOptimisticRetryRequest(selectedRequest);
        setSelectedRequest(optimisticRequest);
        setRequests((current) => reconcileRequestList(current, statusFilter, optimisticRequest));
        setIsReviewSubmitting(true);
        try {
            const response = await retryResume(selectedRequest.id);
            setSelectedRequest((current) => current
                ? {
                    ...current,
                    resumeStatus: response.resumeStatus,
                    resumeError: null,
                }
                : current);
            setRequests((current) => current.map((request) => request.id === response.requestId
                ? {
                    ...request,
                    resumeStatus: response.resumeStatus,
                }
                : request));
        }
        catch (error) {
            setSelectedRequest(previousRequest);
            setRequests((current) => reconcileRequestList(current, statusFilter, previousRequest));
            throw error;
        }
        finally {
            setIsReviewSubmitting(false);
        }
    }
    return (_jsx(LayoutShell, { requests: requests, selectedId: selectedId, selectedRequest: selectedRequest, statusFilter: statusFilter, search: search, searchRef: searchRef, saveState: saveState, isReviewSubmitting: isReviewSubmitting, isShortcutsOpen: isShortcutsOpen, shortcutEntries: shortcutEntries, reviewDraft: reviewDraft, theme: theme, onThemeToggle: toggleTheme, onSearchChange: setSearch, onStatusFilterChange: setStatusFilter, onSelectRequest: (requestId) => selectRequest(requestId), onCloseShortcuts: () => setIsShortcutsOpen(false), onContentChange: handleContentChange, onReviewDraftChange: setReviewDraft, onReviewSubmit: handleReviewSubmit, onRetryResume: handleRetryResume, registerEditorFocus: (focus) => {
            editorFocusRef.current = focus;
        } }));
}
export default function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(ReviewWorkspace, {}) }), _jsx(Route, { path: "/requests/:requestId", element: _jsx(ReviewWorkspace, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
