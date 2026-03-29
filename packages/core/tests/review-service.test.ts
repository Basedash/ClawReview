import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';

import { createCoreServices } from '../src/index.js';

interface MockChildProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
}

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

const { spawn: spawnMock } = await import('node:child_process');

describe('review service', () => {
  afterEach(() => {
    vi.useRealTimers();
    spawnMock.mockReset();
  });

  it('submits a review, closes the request, and records resume success', async () => {
    vi.useFakeTimers();

    const child = new EventEmitter() as MockChildProcess;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    spawnMock.mockReturnValue(child as unknown as ChildProcessWithoutNullStreams);

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

    const reviewPromise = services.reviewService.submitReview(created.id, {
      action: 'approve',
      comment: 'Looks good',
    });

    child.emit('spawn');
    await vi.advanceTimersByTimeAsync(1_000);

    const reviewed = await reviewPromise;

    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(reviewed.status).toBe('closed');
    expect(reviewed.reviewState).toBe('approved');
    expect(reviewed.resumeStatus).toBe('succeeded');
    expect(reviewed.lastResumeResponseId).toBeNull();

    const latestReview = reviewed.reviews[0];
    expect(latestReview?.commentText).toBe('Looks good');
    expect(latestReview?.resumePayloadJson).toMatchObject({
      message: expect.stringContaining('Decision: approve'),
    });
    expect(
      reviewed.events.some((event) => event.eventType === 'resume.succeeded'),
    ).toBe(true);
  });
});
