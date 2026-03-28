import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildServer } from '../src/app.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('server review APIs', () => {
  it('submits a review and closes the request', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: 'resp_123' }),
    })) as unknown as typeof fetch;

    const app = buildServer({
      databaseUrl: ':memory:',
      openclawBaseUrl: 'http://127.0.0.1:3456',
      openclawGatewayToken: 'token',
      fetchFn: fetcher,
    });

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/requests',
      payload: {
        title: 'Review release note',
        summary: 'Please verify',
        contentMarkdown: '# Draft',
        continuation: {
          agentId: 'agent-1',
          sessionKey: 'main',
        },
        source: {
          harness: 'openclaw',
          agentLabel: 'Planner',
        },
      },
    });

    const request = createResponse.json().request as { id: string };

    const reviewResponse = await app.inject({
      method: 'POST',
      url: `/api/requests/${request.id}/review`,
      payload: {
        action: 'approve',
        comment: 'Looks good',
      },
    });

    expect(reviewResponse.statusCode).toBe(200);

    const reviewed = reviewResponse.json().request as {
      status: string;
      reviewState: string;
      resumeStatus: string;
    };

    expect(reviewed.status).toBe('closed');
    expect(reviewed.reviewState).toBe('approved');
    expect(reviewed.resumeStatus).toBe('succeeded');
    expect(fetcher).toHaveBeenCalledTimes(1);

    await app.close();
  });
});
