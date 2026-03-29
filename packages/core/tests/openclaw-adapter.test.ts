import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';

import type { RequestDetail, ReviewRecord } from '@clawreview/shared';

import { OpenClawHarnessAdapter } from '../src/adapters/openclaw-adapter.js';

interface MockChildProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
}

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

const { spawn } = await import('node:child_process');
const spawnMock = spawn as unknown as Mock;

function createRequest(): RequestDetail {
  const now = new Date().toISOString();

  return {
    id: 'req_1',
    publicId: 'CR-0001',
    title: 'Review draft',
    summary: 'Review summary',
    status: 'open',
    reviewState: 'pending',
    resumeStatus: 'not_requested',
    isEdited: false,
    sourceHarness: 'openclaw',
    sourceAgentId: 'agent-1',
    sourceAgentLabel: 'Planner',
    sourceWorkflowLabel: 'release',
    updatedAt: now,
    createdAt: now,
    closedAt: null,
    originalContentMarkdown: '# Original',
    editedContentMarkdown: '# Edited',
    sourceSessionKey: 'main',
    sourcePreviousResponseId: null,
    sourceGatewayBaseUrl: null,
    sourceUser: null,
    sourceMetadata: null,
    context: null,
    resumeError: null,
    lastResumeAttemptAt: null,
    lastResumeResponseId: null,
    reviews: [],
    events: [],
  };
}

function createReview(): ReviewRecord {
  return {
    id: 'rev_1',
    requestId: 'req_1',
    action: 'comment',
    commentText: 'Please revise',
    resumePayloadJson: null,
    submittedAt: new Date().toISOString(),
  };
}

describe('OpenClawHarnessAdapter', () => {
  beforeEach(() => {
    spawnMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds a deterministic continuation message', () => {
    const adapter = new OpenClawHarnessAdapter({
      baseUrl: 'http://127.0.0.1:3456',
      gatewayToken: 'token',
    });

    const message = adapter.buildResumeMessage({
      request: createRequest(),
      review: {
        action: 'approve',
        commentText: 'Looks good',
      } as ReviewRecord,
    });

    expect(message).toContain('Human review result for request CR-0001');
    expect(message).toContain('Decision: approve');
    expect(message).toContain('# Edited');
    expect(message).toContain('# Original');
  });

  it('marks resume as accepted once the CLI stays alive long enough to dispatch', async () => {
    vi.useFakeTimers();

    const child = new EventEmitter() as MockChildProcess;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    spawnMock.mockReturnValue(child as unknown as ChildProcessWithoutNullStreams);

    const adapter = new OpenClawHarnessAdapter(
      {
        baseUrl: 'http://127.0.0.1:3456',
        gatewayToken: 'token',
      },
    );

    const resumePromise = adapter.resumeReview(createRequest(), createReview());

    child.emit('spawn');
    await vi.advanceTimersByTimeAsync(1_000);

    const result = await resumePromise;

    expect(spawnMock).toHaveBeenCalledTimes(1);
    const [binary, args, options] = spawnMock.mock.calls[0] as [
      string,
      string[],
      { timeout: number; env: NodeJS.ProcessEnv },
    ];
    expect(binary).toBe('/home/openclaw/.npm-global/bin/openclaw');
    expect(args).toMatchObject([
      'agent',
      '--message',
      expect.stringContaining('Decision: comment'),
      '--deliver',
      '--json',
      '--timeout',
      '120',
      '--agent',
      'agent-1',
      '--reply-to',
      'main',
    ]);
    expect(options.timeout).toBe(130_000);
    expect(result.rawResponse).toEqual({
      status: 'accepted',
    });
    expect(result.responseId).toBeUndefined();
  });

  it('propagates CLI failures that happen before dispatch acceptance', async () => {
    vi.useFakeTimers();

    const child = new EventEmitter() as MockChildProcess;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    spawnMock.mockReturnValue(child as unknown as ChildProcessWithoutNullStreams);

    const adapter = new OpenClawHarnessAdapter({
      baseUrl: 'http://127.0.0.1:3456',
      gatewayToken: 'token',
    });

    const resumePromise = adapter.resumeReview(createRequest(), createReview());

    child.stderr.emit('data', 'missing binary');
    child.emit('error', new Error('spawn ENOENT'));

    await expect(resumePromise).rejects.toThrow(
      'OpenClaw CLI resume failed: spawn ENOENT',
    );
  });
});
