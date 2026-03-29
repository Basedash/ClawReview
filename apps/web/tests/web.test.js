import { jsx as _jsx } from "react/jsx-runtime";
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import App from '../src/App.js';
const listPayload = {
    requests: [
        {
            id: 'req-1',
            publicId: 'CR-0001',
            title: 'Review release draft',
            summary: 'Check release notes',
            status: 'open',
            reviewState: 'pending',
            resumeStatus: 'not_requested',
            isEdited: false,
            sourceHarness: 'openclaw',
            sourceAgentId: 'agent-1',
            sourceAgentLabel: 'Planner',
            sourceWorkflowLabel: 'release',
            updatedAt: '2026-03-28T06:00:00.000Z',
            createdAt: '2026-03-28T05:59:00.000Z',
            closedAt: null,
        },
    ],
};
const detailPayload = {
    request: {
        ...listPayload.requests[0],
        originalContentMarkdown: '# Draft',
        editedContentMarkdown: '# Draft',
        sourceSessionKey: 'main',
        sourcePreviousResponseId: null,
        sourceGatewayBaseUrl: null,
        sourceUser: null,
        sourceMetadata: null,
        context: { branch: 'cursor/human-review-platform-5c64' },
        resumeError: null,
        lastResumeAttemptAt: null,
        lastResumeResponseId: null,
        reviews: [],
        events: [
            {
                id: 'evt-1',
                requestId: 'req-1',
                eventType: 'request.created',
                actorType: 'agent',
                payload: { title: 'Review release draft' },
                createdAt: '2026-03-28T05:59:00.000Z',
            },
        ],
    },
};
const pendingDetailPayload = {
    request: {
        ...detailPayload.request,
        status: 'closed',
        reviewState: 'approved',
        resumeStatus: 'pending',
        events: [
            ...detailPayload.request.events,
            {
                id: 'evt-2',
                requestId: 'req-1',
                eventType: 'review.submitted',
                actorType: 'human',
                payload: { action: 'approve' },
                createdAt: '2026-03-28T06:01:00.000Z',
            },
            {
                id: 'evt-3',
                requestId: 'req-1',
                eventType: 'resume.dispatched',
                actorType: 'system',
                payload: null,
                createdAt: '2026-03-28T06:01:01.000Z',
            },
        ],
    },
};
const succeededDetailPayload = {
    request: {
        ...pendingDetailPayload.request,
        resumeStatus: 'succeeded',
        events: [
            ...pendingDetailPayload.request.events,
            {
                id: 'evt-4',
                requestId: 'req-1',
                eventType: 'resume.succeeded',
                actorType: 'system',
                payload: { responseId: null },
                createdAt: '2026-03-28T06:01:03.000Z',
            },
        ],
    },
};
describe('web app', () => {
    beforeEach(() => {
        vi.useRealTimers();
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(() => ({
                matches: false,
                media: '(prefers-color-scheme: dark)',
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
    });
    it('renders the open request, detail summary, and editor surface', async () => {
        const fetchMock = vi.fn(async (input) => {
            const url = String(input);
            if (url.includes('/api/requests?')) {
                return new Response(JSON.stringify(listPayload), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            if (url.endsWith('/api/requests/req-1')) {
                return new Response(JSON.stringify(detailPayload), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            throw new Error(`Unexpected fetch call: ${url}`);
        });
        vi.stubGlobal('fetch', fetchMock);
        render(_jsx(App, {}));
        expect(await screen.findByText('Review release draft')).toBeInTheDocument();
        expect(await screen.findByText('Check release notes')).toBeInTheDocument();
        expect(await screen.findByRole('textbox', {
            name: /review markdown editor/i,
        })).toBeInTheDocument();
        expect(await screen.findByText('Review content')).toBeInTheDocument();
        expect(await screen.findByText('Review')).toBeInTheDocument();
        expect(await screen.findByText('Activity')).toBeInTheDocument();
    });
    it('polls pending resumes until the success event appears', async () => {
        let detailFetchCount = 0;
        const fetchMock = vi.fn(async (input) => {
            const url = String(input);
            if (url.includes('/api/requests?')) {
                return new Response(JSON.stringify({
                    requests: [
                        {
                            ...listPayload.requests[0],
                            status: 'closed',
                            reviewState: 'approved',
                            resumeStatus: detailFetchCount >= 2 ? 'succeeded' : 'pending',
                        },
                    ],
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            if (url.endsWith('/api/requests/req-1')) {
                detailFetchCount += 1;
                const payload = detailFetchCount >= 2 ? succeededDetailPayload : pendingDetailPayload;
                return new Response(JSON.stringify(payload), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            throw new Error(`Unexpected fetch call: ${url}`);
        });
        vi.stubGlobal('fetch', fetchMock);
        render(_jsx(App, {}));
        await waitFor(() => expect(detailFetchCount).toBeGreaterThanOrEqual(1));
        expect(await screen.findByText('resume pending')).toBeInTheDocument();
        expect(await screen.findByText('resume.dispatched')).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText('resume succeeded')).toBeInTheDocument(), { timeout: 5_000 });
        expect(screen.getByText('resume.succeeded')).toBeInTheDocument();
    }, 10_000);
});
