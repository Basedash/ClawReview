import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildServer } from '../src/app.js';
import { OpenClawHarnessAdapter } from '../../../packages/core/src/adapters/openclaw-adapter.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('server review APIs', () => {
  it('submits a review and closes the request before resume completes', async () => {
    const resumeReviewMock = vi
      .spyOn(OpenClawHarnessAdapter.prototype, 'resumeReview')
      .mockResolvedValue({
        responseId: 'resp_123',
        rawResponse: { id: 'resp_123' },
        requestBody: { message: 'resume request' },
      });

    const app = buildServer({
      databaseUrl: ':memory:',
      openclawBaseUrl: 'http://127.0.0.1:3456',
      openclawGatewayToken: 'token',
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
      id: string;
      status: string;
      reviewState: string;
      resumeStatus: string;
    };

    expect(reviewed.status).toBe('closed');
    expect(reviewed.reviewState).toBe('approved');
    expect(reviewed.resumeStatus).toBe('pending');
    expect(resumeReviewMock).toHaveBeenCalledTimes(0);

    await vi.waitFor(async () => {
      expect(resumeReviewMock).toHaveBeenCalledTimes(1);

      const detailResponse = await app.inject({
        method: 'GET',
        url: `/api/requests/${reviewed.id}`,
      });

      expect(detailResponse.statusCode).toBe(200);
      expect(detailResponse.json().request.resumeStatus).toBe('succeeded');
    });

    await app.close();
  });
});
