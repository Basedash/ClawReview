import { execFile } from 'node:child_process';

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
}

export interface OpenClawResumeResponse {
  responseId?: string;
  rawResponse: unknown;
}

/**
 * Detect the channel type from the session key pattern.
 * OpenClaw session keys follow patterns like:
 *   "channel:C0AQ1DVHGSC" (Slack)
 *   "+15555550123" (WhatsApp/Signal/SMS)
 *   "telegram:12345" (Telegram)
 *   "discord:12345" (Discord)
 */
function detectChannel(sessionKey: string): string | null {
  // Slack channel IDs start with C, D, or G followed by alphanumeric
  if (/^channel:[CDG][A-Z0-9]+$/.test(sessionKey)) return 'slack';
  if (sessionKey.startsWith('telegram:')) return 'telegram';
  if (sessionKey.startsWith('discord:')) return 'discord';
  if (sessionKey.startsWith('signal:')) return 'signal';
  if (/^\+\d+$/.test(sessionKey)) return 'whatsapp';
  return null;
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
      const channel = detectChannel(request.sessionKey);

      const args = [
        'agent',
        '--agent', request.agentId,
        '--session-id', request.sessionKey,
        '--message', request.message,
        '--deliver',
        '--json',
        '--timeout', '120',
      ];

      // Add channel routing so the reply goes back to the originating channel
      if (channel) {
        args.push('--channel', channel);
        args.push('--reply-channel', channel);
        args.push('--reply-to', request.sessionKey);
      }

      const openclawBin = process.env.OPENCLAW_BIN ?? '/home/openclaw/.npm-global/bin/openclaw';

      console.log('[openclaw-client] Resuming session via CLI:', {
        agentId: request.agentId,
        sessionKey: request.sessionKey,
        channel: channel ?? 'default',
        messageLength: request.message.length,
        binary: openclawBin,
        args: args.filter(a => a !== request.message),
      });

      execFile(openclawBin, args, {
        timeout: 130_000,
        env: { ...process.env },
      }, (error, stdout, stderr) => {
        if (stderr) {
          console.log('[openclaw-client] CLI stderr:', stderr.slice(0, 500));
        }

        if (error) {
          console.error('[openclaw-client] CLI error:', error.message);
          reject(new Error(`OpenClaw CLI resume failed: ${error.message}${stderr ? `\nstderr: ${stderr.slice(0, 500)}` : ''}`));
          return;
        }

        console.log('[openclaw-client] CLI stdout:', stdout.slice(0, 500));

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
            ? (parsed as Record<string, unknown>).id as string
            : undefined;

        resolve({
          responseId,
          rawResponse: parsed,
        });
      });
    });
  }
}
