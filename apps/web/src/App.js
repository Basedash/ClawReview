import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutShell } from './components/layout-shell.js';
import { useTheme } from './lib/use-theme.js';
import { fetchRequestDetail, fetchRequests, retryResume, submitReview, updateRequestContent, } from './lib/api.js';
import { getShortcutEntries, isEditableTarget } from './lib/shortcuts.js';
import './styles/tokens.css';
import './styles/globals.css';
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
export default function App() {
    const [requests, setRequests] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [statusFilter, setStatusFilter] = useState('open');
    const [search, setSearch] = useState('');
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
    const [saveState, setSaveState] = useState('idle');
    const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [reviewDraft, setReviewDraft] = useState({
        action: 'approve',
        comment: '',
    });
    const { theme, toggle: toggleTheme } = useTheme();
    const searchRef = useRef(null);
    const editorFocusRef = useRef(null);
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
                    setSelectedId((current) => {
                        if (!requests.length) {
                            return null;
                        }
                        const index = requests.findIndex((request) => request.id === current);
                        return (requests[Math.min(index + 1, requests.length - 1)]?.id ??
                            requests[0]?.id ??
                            null);
                    });
                    break;
                case 'k':
                    event.preventDefault();
                    setSelectedId((current) => {
                        if (!requests.length) {
                            return null;
                        }
                        const index = requests.findIndex((request) => request.id === current);
                        return (requests[Math.max(index - 1, 0)]?.id ?? requests[0]?.id ?? null);
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
                        return (requests[Math.max(index - 1, 0)]?.id ?? requests[0]?.id ?? null);
                    });
                    break;
                case ']':
                    event.preventDefault();
                    setSelectedId((current) => {
                        if (!requests.length) {
                            return null;
                        }
                        const index = requests.findIndex((request) => request.id === current);
                        return (requests[Math.min(index + 1, requests.length - 1)]?.id ??
                            requests[0]?.id ??
                            null);
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
    async function handleContentChange(nextMarkdown) {
        if (!selectedRequest) {
            return;
        }
        setSaveState('saving');
        try {
            const updated = await updateRequestContent(selectedRequest.id, {
                editedContentMarkdown: nextMarkdown,
            });
            setSelectedRequest(updated.request);
            setSaveState('saved');
            setReloadKey((current) => current + 1);
        }
        catch {
            setSaveState('error');
        }
    }
    async function handleReviewSubmit(input) {
        if (!selectedRequest) {
            return;
        }
        const previousRequest = selectedRequest;
        const previousDraft = reviewDraft;
        const optimisticRequest = buildOptimisticReviewRequest(selectedRequest, input);
        setSelectedRequest(optimisticRequest);
        setRequests((current) => reconcileRequestList(current, statusFilter, optimisticRequest));
        setReviewDraft({ action: 'approve', comment: '' });
        setIsReviewSubmitting(true);
        try {
            const response = await submitReview(selectedRequest.id, {
                action: input.action,
                comment: input.comment,
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
    return (_jsx(LayoutShell, { requests: requests, selectedId: selectedId, selectedRequest: selectedRequest, statusFilter: statusFilter, search: search, searchRef: searchRef, saveState: saveState, isReviewSubmitting: isReviewSubmitting, isShortcutsOpen: isShortcutsOpen, shortcutEntries: shortcutEntries, reviewDraft: reviewDraft, theme: theme, onThemeToggle: toggleTheme, onSearchChange: setSearch, onStatusFilterChange: setStatusFilter, onSelectRequest: setSelectedId, onCloseShortcuts: () => setIsShortcutsOpen(false), onContentChange: handleContentChange, onReviewDraftChange: setReviewDraft, onReviewSubmit: handleReviewSubmit, onRetryResume: handleRetryResume, registerEditorFocus: (focus) => {
            editorFocusRef.current = focus;
        } }));
}
