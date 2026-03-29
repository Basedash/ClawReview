import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });

  return {
    promise,
    resolve,
  };
}

describe('web app', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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
  });

  it('renders the open request, detail summary, and editor surface', async () => {
    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Review release draft' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Check release notes')).toBeInTheDocument();
    expect(
      await screen.findByRole('textbox', {
        name: /review markdown editor/i,
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Activity')).toBeInTheDocument();
  });

  it('optimistically closes the request immediately after submit', async () => {
    const submitResponse = createDeferred<Response>();

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (method === 'GET' && url.includes('/api/requests?')) {
        return Promise.resolve(
          new Response(JSON.stringify(listPayload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }

      if (method === 'GET' && url.endsWith('/api/requests/req-1')) {
        return Promise.resolve(
          new Response(JSON.stringify(detailPayload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }

      if (method === 'POST' && url.endsWith('/api/requests/req-1/review')) {
        return submitResponse.promise;
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Review release draft' }),
    ).toBeInTheDocument();

    fireEvent.change(
      await screen.findByRole('textbox', { name: /reviewer comment/i }),
      {
        target: { value: 'Ship it' },
      },
    );
    const approveButtons = await screen.findAllByRole('button', {
      name: /approve request/i,
    });
    fireEvent.click(approveButtons.at(-1)!);

    await waitFor(() => {
      expect(screen.getByText('closed')).toBeInTheDocument();
      expect(screen.getByText('resume pending')).toBeInTheDocument();
      expect(screen.getByText('review.submitted')).toBeInTheDocument();
      expect(screen.getByText('resume.dispatched')).toBeInTheDocument();
    });

    submitResponse.resolve(
      new Response(
        JSON.stringify({
          request: {
            ...detailPayload.request,
            status: 'closed',
            reviewState: 'approved',
            resumeStatus: 'pending',
            closedAt: '2026-03-28T06:05:00.000Z',
            updatedAt: '2026-03-28T06:05:00.000Z',
            lastResumeAttemptAt: '2026-03-28T06:05:00.000Z',
            reviews: [
              {
                id: 'rev-1',
                requestId: 'req-1',
                action: 'approve',
                commentText: 'Ship it',
                resumePayloadJson: null,
                submittedAt: '2026-03-28T06:05:00.000Z',
              },
            ],
            events: [
              ...detailPayload.request.events,
              {
                id: 'evt-2',
                requestId: 'req-1',
                eventType: 'review.submitted',
                actorType: 'human',
                payload: { action: 'approve', comment: 'Ship it' },
                createdAt: '2026-03-28T06:05:00.000Z',
              },
              {
                id: 'evt-3',
                requestId: 'req-1',
                eventType: 'resume.dispatched',
                actorType: 'system',
                payload: null,
                createdAt: '2026-03-28T06:05:00.000Z',
              },
            ],
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    await waitFor(() => {
      expect(screen.getByText('closed')).toBeInTheDocument();
      expect(screen.getByText('review.submitted')).toBeInTheDocument();
    });
  });
});
