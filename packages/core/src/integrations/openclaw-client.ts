import WebSocket from 'ws';

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

export class OpenClawClient {
  public constructor(
    private readonly options: OpenClawClientOptions,
    _fetchFn?: typeof fetch,
  ) {}

  public async resumeSession(
    request: OpenClawResumeRequest,
  ): Promise<OpenClawResumeResponse> {
    const baseUrl = request.gatewayBaseUrl ?? this.options.baseUrl;
    const wsUrl = baseUrl.replace(/^http/, 'ws');

    return new Promise<OpenClawResumeResponse>((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      let connectId: string | null = null;
      let chatSendId: string | null = null;
      let connected = false;

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('OpenClaw WebSocket resume timed out after 30s'));
      }, 30_000);

      function sendReq(method: string, params: Record<string, unknown>): string {
        const id = `cr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const frame = JSON.stringify({ type: 'req', id, method, params });
        ws.send(frame);
        return id;
      }

      ws.on('open', () => {
        // Wait for challenge event before sending connect
      });

      ws.on('message', (data: WebSocket.Data) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(data.toString()) as Record<string, unknown>;
        } catch {
          return;
        }

        // Handle connect challenge
        if (
          msg.type === 'event' &&
          msg.event === 'connect.challenge'
        ) {
          connectId = sendReq('connect', {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: 'clawreview',
              version: '0.1.0',
              platform: 'linux',
              mode: 'operator',
            },
            role: 'operator',
            scopes: ['operator.read', 'operator.write'],
            caps: [],
            commands: [],
            permissions: {},
            auth: { token: this.options.gatewayToken },
            userAgent: 'clawreview/0.1.0',
          });
          return;
        }

        // Handle responses
        if (msg.type === 'res') {
          const resId = msg.id as string;

          if (resId === connectId) {
            if (msg.ok) {
              connected = true;
              // Now send chat.send to inject the message into the session
              chatSendId = sendReq('chat.send', {
                sessionKey: request.sessionKey,
                text: request.message,
              });
            } else {
              clearTimeout(timeout);
              ws.close();
              reject(
                new Error(
                  `OpenClaw connect failed: ${JSON.stringify(msg.payload ?? msg.error ?? msg)}`,
                ),
              );
            }
            return;
          }

          if (resId === chatSendId) {
            clearTimeout(timeout);
            ws.close();

            if (msg.ok) {
              const payload = msg.payload as Record<string, unknown> | undefined;
              resolve({
                responseId: payload?.runId as string | undefined,
                rawResponse: msg,
              });
            } else {
              reject(
                new Error(
                  `OpenClaw chat.send failed: ${JSON.stringify(msg.payload ?? msg.error ?? msg)}`,
                ),
              );
            }
            return;
          }
        }
      });

      ws.on('error', (err: Error) => {
        clearTimeout(timeout);
        reject(new Error(`OpenClaw WebSocket error: ${err.message}`));
      });

      ws.on('close', () => {
        clearTimeout(timeout);
        if (!connected) {
          reject(new Error('OpenClaw WebSocket closed before connect completed'));
        }
      });
    });
  }
}
