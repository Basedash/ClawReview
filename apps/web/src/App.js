import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutShell } from './components/layout-shell.js';
import { useTheme } from './lib/use-theme.js';
import { fetchRequestDetail, fetchRequests, retryResume, submitReview, updateRequestContent, } from './lib/api.js';
import { getShortcutEntries, isEditableTarget } from './lib/shortcuts.js';
import './styles/tokens.css';
import './styles/globals.css';
const SAVE_DEBOUNCE_MS = 400;
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
    const saveTimeoutRef = useRef(null);
    const syncedMarkdownRef = useRef('');
    const saveTokenRef = useRef(0);
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
        void fetchRequestDetail(selectedId).then((response) => {
            if (!mounted) {
                return;
            }
            setSelectedRequest(response.request);
            syncedMarkdownRef.current = response.request.editedContentMarkdown;
            setSaveState('saved');
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
    }, [selectedRequest?.editedContentMarkdown, selectedRequest?.id]);
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
        setIsReviewSubmitting(true);
        try {
            const response = await submitReview(selectedRequest.id, {
                action: input.action,
                comment: input.comment,
            });
            setSelectedRequest(response.request);
            setReviewDraft({ action: 'approve', comment: '' });
            setReloadKey((current) => current + 1);
        }
        finally {
            setIsReviewSubmitting(false);
        }
    }
    async function handleRetryResume() {
        if (!selectedRequest) {
            return;
        }
        const response = await retryResume(selectedRequest.id);
        setSelectedRequest((current) => current
            ? {
                ...current,
                resumeStatus: response.resumeStatus,
            }
            : current);
        setReloadKey((current) => current + 1);
    }
    return (_jsx(LayoutShell, { requests: requests, selectedId: selectedId, selectedRequest: selectedRequest, statusFilter: statusFilter, search: search, searchRef: searchRef, saveState: saveState, isReviewSubmitting: isReviewSubmitting, isShortcutsOpen: isShortcutsOpen, shortcutEntries: shortcutEntries, reviewDraft: reviewDraft, theme: theme, onThemeToggle: toggleTheme, onSearchChange: setSearch, onStatusFilterChange: setStatusFilter, onSelectRequest: setSelectedId, onCloseShortcuts: () => setIsShortcutsOpen(false), onContentChange: handleContentChange, onReviewDraftChange: setReviewDraft, onReviewSubmit: handleReviewSubmit, onRetryResume: handleRetryResume, registerEditorFocus: (focus) => {
            editorFocusRef.current = focus;
        } }));
}
