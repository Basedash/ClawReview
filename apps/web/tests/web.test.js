import { jsx as _jsx } from "react/jsx-runtime";
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
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
describe('web app', () => {
    beforeEach(() => {
        const fetchMock = vi.fn(async (input, init) => {
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
            if (url.endsWith('/api/requests/req-1/content') && init?.method === 'PATCH') {
                const body = JSON.parse(String(init.body));
                return new Response(JSON.stringify({
                    request: {
                        ...detailPayload.request,
                        editedContentMarkdown: body.editedContentMarkdown,
                        isEdited: true,
                    },
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            if (url.endsWith('/api/requests/req-1/review') && init?.method === 'POST') {
                return new Response(JSON.stringify({
                    request: {
                        ...detailPayload.request,
                        status: 'closed',
                        reviewState: 'approved',
                        resumeStatus: 'succeeded',
                        closedAt: '2026-03-28T06:01:00.000Z',
                    },
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            throw new Error(`Unexpected fetch call: ${url}`);
        });
        vi.stubGlobal('fetch', fetchMock);
    });
    it('renders requests, edits content, and submits a review', async () => {
        const user = userEvent.setup();
        render(_jsx(App, {}));
        expect(await screen.findByText('Review release draft')).toBeInTheDocument();
        expect(await screen.findByText('Check release notes')).toBeInTheDocument();
        const editor = await screen.findByRole('textbox', {
            name: /review markdown editor/i,
        });
        await user.clear(editor);
        await user.type(editor, '# Revised draft');
        await waitFor(() => {
            expect(screen.getByText('Saved')).toBeInTheDocument();
        });
        await user.click(screen.getByRole('button', { name: 'Approve request' }));
        await waitFor(() => {
            expect(screen.getByText('Approve request')).toBeDisabled();
        });
    });
});
