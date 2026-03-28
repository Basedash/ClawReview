export interface OpenClawClientOptions {
  baseUrl: string;
  gatewayToken: string;
  fetchFn?: typeof fetch;
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
  private readonly fetchFn: typeof fetch;

  public constructor(
    private readonly options: OpenClawClientOptions,
    fetchFn?: typeof fetch,
  ) {
    this.fetchFn = fetchFn ?? options.fetchFn ?? fetch;
  }

  public async resumeSession(
    request: OpenClawResumeRequest,
  ): Promise<OpenClawResumeResponse> {
    const baseUrl = request.gatewayBaseUrl ?? this.options.baseUrl;
    const response = await this.fetchFn(new URL('/v1/responses', baseUrl).toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.options.gatewayToken}`,
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': request.agentId,
        'x-openclaw-session-key': request.sessionKey,
      },
      body: JSON.stringify({
        previous_response_id: request.previousResponseId,
        user: request.user,
        input: [
          {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: request.message,
              },
            ],
          },
        ],
      }),
    });

    const rawText = await response.text();
    let rawResponse: unknown = null;

    if (rawText) {
      try {
        rawResponse = JSON.parse(rawText) as unknown;
      } catch {
        rawResponse = rawText;
      }
    }

    if (!response.ok) {
      throw new Error(
        `OpenClaw resume failed with ${response.status}: ${
          typeof rawResponse === 'string'
            ? rawResponse
            : JSON.stringify(rawResponse)
        }`,
      );
    }

    const responseId =
      typeof rawResponse === 'object' &&
      rawResponse !== null &&
      'id' in rawResponse &&
      typeof rawResponse.id === 'string'
        ? rawResponse.id
        : undefined;

    return {
      responseId,
      rawResponse,
    };
  }
}
