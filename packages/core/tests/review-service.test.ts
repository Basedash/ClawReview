import { describe, expect, it, vi } from 'vitest';

import { OpenClawHarnessAdapter } from '../src/adapters/openclaw-adapter.js';
import { createCoreServices } from '../src/index.js';

describe('review service', () => {
  it('submits a review immediately and records resume success asynchronously', async () => {
    const resumeReview = vi
      .spyOn(OpenClawHarnessAdapter.prototype, 'resumeReview')
      .mockResolvedValue({
        requestBody: {
          message: 'Decision: approve',
        },
        responseId: 'resp_123',
        rawResponse: { id: 'resp_123' },
      });

    const services = createCoreServices({
      databaseUrl: ':memory:',
      openclawBaseUrl: 'http://127.0.0.1:3456',
      openclawGatewayToken: 'token',
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

    expect(reviewed.status).toBe('closed');
    expect(reviewed.reviewState).toBe('approved');
    expect(reviewed.resumeStatus).toBe('pending');
    expect(reviewed.events.at(-1)?.eventType).toBe('resume.dispatched');
    expect(resumeReview).toHaveBeenCalledTimes(0);

    const latestReview = reviewed.reviews[0];
    expect(latestReview?.commentText).toBe('Looks good');
    expect(latestReview?.resumePayloadJson).toBeNull();

    await vi.waitFor(() => {
      expect(resumeReview).toHaveBeenCalledTimes(1);
    });

    const refreshed = services.requestService.getRequestById(created.id);
    expect(refreshed.resumeStatus).toBe('succeeded');
    expect(refreshed.lastResumeResponseId).toBe('resp_123');
    expect(refreshed.reviews[0]?.resumePayloadJson).toMatchObject({
      message: expect.stringContaining('Decision: approve'),
    });
    expect(refreshed.events.at(-1)?.eventType).toBe('resume.succeeded');
  });
});
