import { jsx as _jsx } from "react/jsx-runtime";
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
describe('web app', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
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
                const payload = JSON.parse(String(init.body ?? '{}'));
                return new Response(JSON.stringify({
                    request: {
                        ...detailPayload.request,
                        editedContentMarkdown: payload.editedContentMarkdown,
                        isEdited: payload.editedContentMarkdown !==
                            detailPayload.request.originalContentMarkdown,
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
    it('renders the open request, detail summary, and editor surface', async () => {
        render(_jsx(App, {}));
        expect(await screen.findByText('Review release draft')).toBeInTheDocument();
        expect(await screen.findByText('Check release notes')).toBeInTheDocument();
        expect(await screen.findByRole('textbox', {
            name: /review markdown editor/i,
        })).toBeInTheDocument();
        expect(await screen.findByText('Metadata')).toBeInTheDocument();
        expect(await screen.findByText('Activity')).toBeInTheDocument();
        expect(await screen.findByRole('heading', { name: 'Draft' })).toBeInTheDocument();
    });
    it('keeps markdown formatting inline and saves markdown output', async () => {
        const user = userEvent.setup({
            advanceTimers: (delay) => vi.advanceTimersByTime(delay),
        });
        render(_jsx(App, {}));
        const editor = await screen.findByRole('textbox', {
            name: /review markdown editor/i,
        });
        expect(await screen.findByRole('heading', { name: 'Draft' })).toBeInTheDocument();
        await user.click(editor);
        await user.keyboard('{Control>}a{/Control}# Updated heading');
        vi.advanceTimersByTime(500);
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Updated heading' })).toBeInTheDocument();
        });
        const fetchMock = vi.mocked(fetch);
        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/api/requests/req-1/content', expect.objectContaining({
                method: 'PATCH',
                body: JSON.stringify({
                    editedContentMarkdown: '# Updated heading',
                }),
            }));
        });
    });
});
