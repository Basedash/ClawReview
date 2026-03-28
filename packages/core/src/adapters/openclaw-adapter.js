import { OpenClawClient } from '../integrations/openclaw-client.js';
export class OpenClawHarnessAdapter {
    config;
    harnessType = 'openclaw';
    client;
    constructor(config, fetchFn) {
        this.config = config;
        this.client = new OpenClawClient({
            baseUrl: config.baseUrl,
            gatewayToken: config.gatewayToken,
        }, fetchFn);
    }
    getConfigStatus() {
        const warnings = this.config.gatewayToken.trim().length > 0
            ? []
            : ['OPENCLAW_GATEWAY_TOKEN is not configured.'];
        return {
            databaseUrl: '',
            openclawBaseUrl: this.config.baseUrl,
            hasGatewayToken: this.config.gatewayToken.trim().length > 0,
            warnings,
        };
    }
    buildResumeMessage({ request, review, }) {
        return [
            `Human review result for request ${request.publicId}`,
            `Decision: ${review.action}`,
            'Reviewer comment:',
            review.commentText ?? '(none)',
            '',
            'Edited content:',
            request.editedContentMarkdown,
            '',
            'Original content:',
            request.originalContentMarkdown,
            '',
            'Summary:',
            request.summary || '(none)',
            '',
            'Please continue the workflow using this review result as authoritative human feedback.',
        ].join('\n');
    }
    buildResumePayload(request, review) {
        const message = this.buildResumeMessage({ request, review });
        return {
            requestId: request.id,
            publicId: request.publicId,
            title: request.title,
            summary: request.summary,
            sourceHarness: request.sourceHarness,
            action: review.action,
            commentText: review.commentText ?? '',
            editedContentMarkdown: request.editedContentMarkdown,
            originalContentMarkdown: request.originalContentMarkdown,
            agentId: request.sourceAgentId,
            sessionKey: request.sourceSessionKey,
            previousResponseId: request.sourcePreviousResponseId || undefined,
            gatewayBaseUrl: request.sourceGatewayBaseUrl || undefined,
            user: request.sourceUser || undefined,
            message,
        };
    }
    async resumeReview(request, review) {
        const payload = this.buildResumePayload(request, review);
        const requestBody = {
            agentId: payload.agentId,
            sessionKey: payload.sessionKey,
            previousResponseId: payload.previousResponseId,
            user: payload.user,
            gatewayBaseUrl: payload.gatewayBaseUrl,
            message: payload.message,
        };
        const response = await this.client.resumeSession(requestBody);
        return {
            requestBody: {
                ...requestBody,
            },
            responseId: response.responseId,
            rawResponse: response.rawResponse,
        };
    }
}
