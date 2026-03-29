import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';

import { buildServer } from '../src/app.js';

interface MockChildProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
}

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

const { spawn } = await import('node:child_process');
const spawnMock = spawn as unknown as Mock;

beforeEach(() => {
  spawnMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('server review APIs', () => {
  it('submits a review and closes the request', async () => {
    const child = new EventEmitter() as MockChildProcess;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    spawnMock.mockReturnValue(child as unknown as ChildProcessWithoutNullStreams);

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

    const reviewPromise = app.inject({
      method: 'POST',
      url: `/api/requests/${request.id}/review`,
      payload: {
        action: 'approve',
        comment: 'Looks good',
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    child.emit('spawn');
    await new Promise((resolve) => setTimeout(resolve, 1_050));

    const reviewResponse = await reviewPromise;

    expect(reviewResponse.statusCode).toBe(200);

    const reviewed = reviewResponse.json().request as {
      status: string;
      reviewState: string;
      resumeStatus: string;
    };

    expect(reviewed.status).toBe('closed');
    expect(reviewed.reviewState).toBe('approved');
    expect(reviewed.resumeStatus).toBe('succeeded');

    await app.close();
  });
});
