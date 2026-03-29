import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface OpenClawClientOptions {
  baseUrl: string;
  gatewayToken: string;
}

export interface OpenClawResumeRequest {
  agentId: string;
  sessionKey: string;
  previousResponseId?: string;
  user?: string;
  gatewayBaseUrl?: string;
  message: string;
  /** Explicit delivery channel (slack, telegram, etc.). Overrides auto-detection. */
  deliveryChannel?: string;
  /** Explicit delivery target (e.g. channel:C0AQ1DVHGSC). Overrides auto-detection. */
  deliveryTarget?: string;
}

export interface OpenClawResumeResponse {
  responseId?: string;
  rawResponse: unknown;
}

const DISPATCH_ACCEPTED_GRACE_MS = 1_000;
const OUTPUT_LOG_LIMIT = 500;
const OUTPUT_CAPTURE_LIMIT = 16_000;

function appendOutput(target: string, chunk: string): string {
  if (target.length >= OUTPUT_CAPTURE_LIMIT) {
    return target;
  }

  const remaining = OUTPUT_CAPTURE_LIMIT - target.length;
  return target + chunk.slice(0, remaining);
}

function parseCliOutput(stdout: string): OpenClawResumeResponse {
  let parsed: unknown = null;

  try {
    parsed = JSON.parse(stdout) as unknown;
  } catch {
    parsed = stdout;
  }

  const responseId =
    typeof parsed === 'object' &&
    parsed !== null &&
    'id' in parsed &&
    typeof (parsed as Record<string, unknown>).id === 'string'
      ? ((parsed as Record<string, unknown>).id as string)
      : undefined;

  return {
    responseId,
    rawResponse: parsed,
  };
}

/**
 * Detect the delivery channel from a target identifier.
 */
function detectChannel(target: string): string | null {
  if (/^channel:[CDG][A-Z0-9]+$/i.test(target)) return 'slack';
  if (target.startsWith('telegram:')) return 'telegram';
  if (target.startsWith('discord:')) return 'discord';
  if (target.startsWith('signal:')) return 'signal';
  if (/^\+\d+$/.test(target)) return 'whatsapp';
  return null;
}

/**
 * Check if a string looks like a UUID.
 */
function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Build the canonical OpenClaw session store key from a delivery target and agent ID.
 * e.g. "channel:C0AQ1DVHGSC" + "main" → "agent:main:slack:channel:c0aq1dvhgsc"
 */
function buildCanonicalSessionKey(deliveryTarget: string, agentId: string): string | null {
  const channel = detectChannel(deliveryTarget);
  if (!channel) return null;
  // OpenClaw canonical format: agent:<agentId>:<channel>:<peerKind>:<peerId>
  // For Slack channels: channel:C0AQ1DVHGSC → slack:channel:c0aq1dvhgsc
  const normalized = deliveryTarget.toLowerCase();
  return `agent:${agentId.toLowerCase()}:${channel}:${normalized}`;
}

/**
 * Look up the current session UUID for a canonical session key from the session store.
 * Returns the UUID if found, null otherwise.
 */
function lookupSessionUuid(canonicalKey: string, agentId: string): string | null {
  try {
    const home = process.env.HOME ?? '/home/openclaw';
    const storePath = join(home, '.openclaw', 'agents', agentId, 'sessions', 'sessions.json');
    const raw = readFileSync(storePath, 'utf-8');
    const store = JSON.parse(raw) as Record<string, { sessionId?: string }>;

    // Try exact match first
    const entry = store[canonicalKey];
    if (entry?.sessionId) return entry.sessionId;

    // Try case-insensitive match
    const lowerKey = canonicalKey.toLowerCase();
    for (const [key, val] of Object.entries(store)) {
      if (key.toLowerCase() === lowerKey && val?.sessionId) return val.sessionId;
    }
    return null;
  } catch {
    return null;
  }
}

export class OpenClawClient {
  public constructor(
    _options: OpenClawClientOptions,
    _fetchFn?: typeof fetch,
  ) {}

  public async resumeSession(
    request: OpenClawResumeRequest,
  ): Promise<OpenClawResumeResponse> {
    return new Promise<OpenClawResumeResponse>((resolve, reject) => {
      const sessionIsUuid = isUuid(request.sessionKey);

      // Resolve delivery channel and target from explicit overrides or sessionKey
      const deliveryTarget = request.deliveryTarget
        ?? (sessionIsUuid ? null : request.sessionKey);
      const deliveryChannel = request.deliveryChannel
        ?? (deliveryTarget ? detectChannel(deliveryTarget) : null);

      // Resolve the session UUID for --session-id:
      // 1. If sessionKey is already a UUID, use it directly
      // 2. If we have a delivery target, build the canonical key and look up the current UUID
      let sessionUuid: string | null = null;
      if (sessionIsUuid) {
        sessionUuid = request.sessionKey;
      } else if (deliveryTarget) {
        const canonical = buildCanonicalSessionKey(deliveryTarget, request.agentId);
        if (canonical) {
          sessionUuid = lookupSessionUuid(canonical, request.agentId);
          console.log('[openclaw-client] Session UUID lookup:', {
            deliveryTarget,
            canonicalKey: canonical,
            resolvedUuid: sessionUuid ?? 'NOT_FOUND',
          });
        }
      }

      const args = [
        'agent',
        '--message', request.message,
        '--deliver',
        '--json',
        '--timeout', '120',
      ];

      // Session routing: pass --session-id for UUID-based routing.
      // IMPORTANT: Do NOT pass --agent together with --session-id.
      // When --agent is provided, OpenClaw resolves to that agent's main session key,
      // which blocks UUID lookup entirely (the !explicitSessionKey guard).
      // Without --agent, --session-id scans the store and finds the correct session key.
      if (sessionUuid) {
        args.push('--session-id', sessionUuid);
      } else {
        // Fall back to --agent only when we don't have a UUID for routing
        args.push('--agent', request.agentId);
      }

      // Always set delivery routing when we know the channel.
      // --channel and --reply-to control WHERE the reply is delivered.
      if (deliveryChannel) {
        args.push('--channel', deliveryChannel);
        args.push('--reply-channel', deliveryChannel);
      }
      if (deliveryTarget) {
        args.push('--reply-to', deliveryTarget);
      }

      const openclawBin = process.env.OPENCLAW_BIN ?? '/home/openclaw/.npm-global/bin/openclaw';

      console.log('[openclaw-client] Resuming session via CLI:', {
        agentId: request.agentId,
        sessionKey: request.sessionKey,
        sessionUuid: sessionUuid ?? 'NONE',
        deliveryChannel: deliveryChannel ?? 'auto',
        deliveryTarget: deliveryTarget ?? 'auto',
        messageLength: request.message.length,
        binary: openclawBin,
        args,
      });

      const child = spawn(openclawBin, args, {
        timeout: 130_000,
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';
      let settled = false;
      let dispatchAccepted = false;
      let acceptanceTimer: NodeJS.Timeout | null = null;

      function clearAcceptanceTimer(): void {
        if (acceptanceTimer) {
          clearTimeout(acceptanceTimer);
          acceptanceTimer = null;
        }
      }

      function rejectBeforeAcceptance(message: string): void {
        if (settled) {
          console.error('[openclaw-client] CLI error after dispatch acceptance:', message);
          return;
        }

        settled = true;
        clearAcceptanceTimer();
        reject(new Error(message));
      }

      function resolveSuccess(payload: OpenClawResumeResponse): void {
        if (settled) {
          return;
        }

        settled = true;
        clearAcceptanceTimer();
        resolve(payload);
      }

      child.stdout.on('data', (chunk: Buffer | string) => {
        stdout = appendOutput(stdout, chunk.toString());
      });

      child.stderr.on('data', (chunk: Buffer | string) => {
        stderr = appendOutput(stderr, chunk.toString());
      });

      child.once('error', (error) => {
        const suffix = stderr ? `\nstderr: ${stderr.slice(0, OUTPUT_LOG_LIMIT)}` : '';
        rejectBeforeAcceptance(`OpenClaw CLI resume failed: ${error.message}${suffix}`);
      });

      child.once('spawn', () => {
        acceptanceTimer = setTimeout(() => {
          dispatchAccepted = true;

          if (stdout) {
            console.log('[openclaw-client] CLI stdout before acceptance:', stdout.slice(0, OUTPUT_LOG_LIMIT));
          }
          if (stderr) {
            console.log('[openclaw-client] CLI stderr before acceptance:', stderr.slice(0, OUTPUT_LOG_LIMIT));
          }

          console.log('[openclaw-client] CLI dispatch accepted; tracking completion in background.');
          resolveSuccess({
            responseId: undefined,
            rawResponse: {
              status: 'accepted',
            },
          });
        }, DISPATCH_ACCEPTED_GRACE_MS);
      });

      child.once('close', (code, signal) => {
        const stdoutPreview = stdout.slice(0, OUTPUT_LOG_LIMIT);
        const stderrPreview = stderr.slice(0, OUTPUT_LOG_LIMIT);

        if (stderrPreview) {
          console.log('[openclaw-client] CLI stderr:', stderrPreview);
        }

        if (code === 0) {
          const parsed = parseCliOutput(stdout);

          if (!dispatchAccepted) {
            if (stdoutPreview) {
              console.log('[openclaw-client] CLI stdout:', stdoutPreview);
            }
            resolveSuccess(parsed);
            return;
          }

          console.log('[openclaw-client] CLI completed after dispatch acceptance:', {
            responseId: parsed.responseId ?? null,
            signal: signal ?? null,
          });
          return;
        }

        const message =
          `OpenClaw CLI resume failed: exited with code ${code ?? 'null'}`
          + `${signal ? ` (signal: ${signal})` : ''}`
          + `${stderrPreview ? `\nstderr: ${stderrPreview}` : ''}`
          + `${stdoutPreview ? `\nstdout: ${stdoutPreview}` : ''}`;

        if (!dispatchAccepted) {
          rejectBeforeAcceptance(message);
          return;
        }

        console.warn('[openclaw-client] CLI exited after dispatch acceptance:', {
          code,
          signal: signal ?? null,
          stderr: stderrPreview || null,
          stdout: stdoutPreview || null,
        });
      });
    });
  }
}
