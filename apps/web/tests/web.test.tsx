import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';

import App from '../src/App';

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
    {
      id: 'req-2',
      publicId: 'CR-0002',
      title: 'Review database migration',
      summary: 'Validate migration sequencing',
      status: 'open',
      reviewState: 'pending',
      resumeStatus: 'not_requested',
      isEdited: false,
      sourceHarness: 'openclaw',
      sourceAgentId: 'agent-2',
      sourceAgentLabel: 'Builder',
      sourceWorkflowLabel: 'deploy',
      updatedAt: '2026-03-28T07:00:00.000Z',
      createdAt: '2026-03-28T06:59:00.000Z',
      closedAt: null,
    },
  ],
};

function createDetailPayload(index: number, markdown = `# ${listPayload.requests[index].title}`) {
  const request = listPayload.requests[index];

  return {
    request: {
      ...request,
      originalContentMarkdown: markdown,
      editedContentMarkdown: markdown,
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
          id: `evt-${index + 1}`,
          requestId: request.id,
          eventType: 'request.created',
          actorType: 'agent',
          payload: { title: request.title },
          createdAt: request.createdAt,
        },
      ],
    },
  };
}

const detailPayloadById = {
  'req-1': createDetailPayload(0, '# Draft'),
  'req-2': createDetailPayload(1),
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

function LocationDisplay() {
  const location = useLocation();

  return <div data-testid="location-display">{location.pathname}</div>;
}

describe('web app', () => {
  let detailPayload = detailPayloadById['req-1'];

  beforeEach(() => {
    detailPayload = detailPayloadById['req-1'];
  });

  beforeEach(() => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/api/requests?')) {
        return new Response(JSON.stringify(listPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const detailMatch = url.match(/\/api\/requests\/(req-\d+)$/);
      if (detailMatch) {
        const payload =
          detailMatch[1] === 'req-1'
            ? detailPayload
            : detailPayloadById[detailMatch[1] as keyof typeof detailPayloadById];

        if (!payload) {
          throw new Error(`Unexpected request id: ${detailMatch[1]}`);
        }

        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.endsWith('/api/requests/req-1/content') && init?.method === 'PATCH') {
        const payload = JSON.parse(String(init.body ?? '{}'));

        return new Response(
          JSON.stringify({
            request: {
              ...detailPayload.request,
              editedContentMarkdown: payload.editedContentMarkdown,
              isEdited:
                payload.editedContentMarkdown !==
                detailPayload.request.originalContentMarkdown,
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders a deep-linked request and keeps that request selected', async () => {
    render(
      <MemoryRouter initialEntries={['/requests/req-2']}>
        <App />
        <LocationDisplay />
      </MemoryRouter>,
    );

    const detailPane = await screen.findByRole('main');
    expect(
      within(detailPane).getByRole('heading', { name: 'Review database migration' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Validate migration sequencing')).toBeInTheDocument();
    expect(
      await screen.findByRole('textbox', {
        name: /review markdown editor/i,
      }),
    ).toBeInTheDocument();
    expect(within(detailPane).getByText('CR-0002')).toBeInTheDocument();
    expect(await screen.findByText('Review')).toBeInTheDocument();
    expect(await screen.findByText('Activity')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /review database migration/i }),
    ).toHaveClass('selected');
    expect(
      screen.getByRole('button', { name: /review release draft/i }),
    ).not.toHaveClass('selected');
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      '/requests/req-2',
    );
  });

  it('updates the URL when selecting a different request', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
        <LocationDisplay />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Review release draft')).toBeInTheDocument();
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      '/requests/req-1',
    );

    fireEvent.click(screen.getByRole('button', { name: /review database migration/i }));

    expect(await screen.findByText('Validate migration sequencing')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /review database migration/i }),
    ).toHaveClass('selected');
    expect(
      screen.getByRole('button', { name: /review release draft/i }),
    ).not.toHaveClass('selected');
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      '/requests/req-2',
    );
  });

  it('renders markdown content as rich text inline', async () => {
    detailPayload = createDetailPayload(
      0,
      '# Draft\n\n- first item\n- second item\n\n`inline code`',
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Draft' })).toBeInTheDocument();
    expect(await screen.findByText('first item')).toBeInTheDocument();
    expect(await screen.findByText('second item')).toBeInTheDocument();
    expect(await screen.findByText('inline code')).toBeInTheDocument();
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

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

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
