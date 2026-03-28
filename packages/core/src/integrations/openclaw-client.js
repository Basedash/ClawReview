export class OpenClawClient {
    options;
    fetchFn;
    constructor(options, fetchFn) {
        this.options = options;
        this.fetchFn = fetchFn ?? options.fetchFn ?? fetch;
    }
    async resumeSession(request) {
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
        let rawResponse = null;
        if (rawText) {
            try {
                rawResponse = JSON.parse(rawText);
            }
            catch {
                rawResponse = rawText;
            }
        }
        if (!response.ok) {
            throw new Error(`OpenClaw resume failed with ${response.status}: ${typeof rawResponse === 'string'
                ? rawResponse
                : JSON.stringify(rawResponse)}`);
        }
        const responseId = typeof rawResponse === 'object' &&
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
