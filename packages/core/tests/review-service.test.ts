import { describe, expect, it, vi } from 'vitest';

import { createCoreServices } from '../src/index.js';

describe('review service', () => {
  it('submits a review, closes the request, and records resume success', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: 'resp_123' }),
    })) as unknown as typeof fetch;

    const services = createCoreServices({
      databaseUrl: ':memory:',
      openclawBaseUrl: 'http://127.0.0.1:3456',
      openclawGatewayToken: 'token',
      fetchFn: fetcher,
    });

    const created = services.requestService.createRequest({
      title: 'Review release draft',
      summary: 'Check the release note',
      contentMarkdown: '# Draft',
      continuation: {
        agentId: 'agent-1',
        sessionKey: 'main',
      },
      source: {
        harness: 'openclaw',
        agentLabel: 'Planner',
      },
    });

    const reviewed = await services.reviewService.submitReview(created.id, {
      action: 'approve',
      comment: 'Looks good',
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(reviewed.status).toBe('closed');
    expect(reviewed.reviewState).toBe('approved');
    expect(reviewed.resumeStatus).toBe('succeeded');
    expect(reviewed.lastResumeResponseId).toBe('resp_123');

    const latestReview = reviewed.reviews[0];
    expect(latestReview?.commentText).toBe('Looks good');
    expect(latestReview?.resumePayloadJson).toMatchObject({
      message: expect.stringContaining('Decision: approve'),
    });
  });
});
