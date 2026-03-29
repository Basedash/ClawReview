import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
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

function makeDetailPayload(index: number) {
  const request = listPayload.requests[index];

  return {
    request: {
      ...request,
      originalContentMarkdown: `# ${request.title}`,
      editedContentMarkdown: `# ${request.title}`,
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
  'req-1': makeDetailPayload(0),
  'req-2': makeDetailPayload(1),
};

function LocationDisplay() {
  const location = useLocation();

  return <div data-testid="location-display">{location.pathname}</div>;
}

describe('web app', () => {
  beforeEach(() => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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
          detailPayloadById[detailMatch[1] as keyof typeof detailPayloadById];

        if (!payload) {
          throw new Error(`Unexpected request id: ${detailMatch[1]}`);
        }

        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
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
    expect(await screen.findByText('Summary')).toBeInTheDocument();
    expect(await screen.findByText('Activity')).toBeInTheDocument();
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
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      '/requests/req-2',
    );
  });
});
