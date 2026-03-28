import { assertRequestIsOpen, determineEditedState } from '../domain/transitions.js';
import { DomainError } from '../errors.js';
import { EventRepository } from '../repositories/event-repository.js';
import { createEventId, createRequestId } from '../utils/ids.js';
import { nowIso } from '../utils/time.js';
function parseNullableRecord(value) {
    if (value === null) {
        return null;
    }
    return JSON.parse(value);
}
export function toRequestDetail(detail) {
    return {
        id: detail.id,
        publicId: detail.publicId,
        title: detail.title,
        summary: detail.summary,
        status: detail.status,
        reviewState: detail.reviewState,
        resumeStatus: detail.resumeStatus,
        isEdited: Boolean(detail.isEdited),
        sourceHarness: detail.sourceHarness,
        sourceAgentId: detail.sourceAgentId,
        sourceAgentLabel: detail.sourceAgentLabel,
        sourceWorkflowLabel: detail.sourceWorkflowLabel,
        updatedAt: detail.updatedAt,
        createdAt: detail.createdAt,
        closedAt: detail.closedAt,
        originalContentMarkdown: detail.originalContentMarkdown,
        editedContentMarkdown: detail.editedContentMarkdown,
        sourceSessionKey: detail.sourceSessionKey,
        sourcePreviousResponseId: detail.sourcePreviousResponseId,
        sourceGatewayBaseUrl: detail.sourceGatewayBaseUrl,
        sourceUser: detail.sourceUser,
        sourceMetadata: parseNullableRecord(detail.sourceMetadataJson),
        context: parseNullableRecord(detail.contextJson),
        resumeError: detail.resumeError,
        lastResumeAttemptAt: detail.lastResumeAttemptAt,
        lastResumeResponseId: detail.lastResumeResponseId,
        reviews: detail.reviews.map((review) => ({
            id: review.id,
            requestId: review.requestId,
            action: review.action,
            commentText: review.commentText,
            resumePayloadJson: parseNullableRecord(review.resumePayloadJson),
            submittedAt: review.submittedAt,
        })),
        events: detail.events.map((event) => ({
            id: event.id,
            requestId: event.requestId,
            eventType: event.eventType,
            actorType: event.actorType,
            payload: parseNullableRecord(event.payloadJson),
            createdAt: event.createdAt,
        })),
    };
}
export class RequestService {
    requestRepository;
    eventRepository;
    config;
    constructor(requestRepository, eventRepository, config) {
        this.requestRepository = requestRepository;
        this.eventRepository = eventRepository;
        this.config = config;
    }
    getConfigStatus() {
        return {
            databaseUrl: this.config.databaseUrl,
            openclawBaseUrl: this.config.openclawBaseUrl,
            hasGatewayToken: this.config.openclawGatewayToken.trim().length > 0,
            warnings: this.config.openclawGatewayToken.trim().length > 0
                ? []
                : ['OPENCLAW_GATEWAY_TOKEN is not configured.'],
        };
    }
    createRequest(input) {
        const timestamp = nowIso();
        const created = this.requestRepository.create({
            id: createRequestId(),
            input,
            createdAt: timestamp,
            updatedAt: timestamp,
        });
        this.eventRepository.create({
            id: createEventId(),
            requestId: created.id,
            eventType: 'request.created',
            actorType: 'agent',
            payloadJson: JSON.stringify({
                title: input.title,
                summary: input.summary,
            }),
            createdAt: timestamp,
        });
        return this.getRequestById(created.id);
    }
    listRequests(query) {
        return this.requestRepository.list(query).map((record) => ({
            id: record.id,
            publicId: record.publicId,
            title: record.title,
            summary: record.summary,
            status: record.status,
            reviewState: record.reviewState,
            resumeStatus: record.resumeStatus,
            isEdited: Boolean(record.isEdited),
            sourceHarness: record.sourceHarness,
            sourceAgentId: record.sourceAgentId,
            sourceAgentLabel: record.sourceAgentLabel,
            sourceWorkflowLabel: record.sourceWorkflowLabel,
            updatedAt: record.updatedAt,
            createdAt: record.createdAt,
            closedAt: record.closedAt,
        }));
    }
    getRequestById(id) {
        const detail = this.requestRepository.getDetailById(id);
        if (!detail) {
            throw new DomainError('NOT_FOUND', `Request ${id} was not found.`, 404);
        }
        return toRequestDetail(detail);
    }
    updateEditedContent(id, input) {
        const detail = this.getRequestById(id);
        assertRequestIsOpen(detail.status);
        const updatedAt = nowIso();
        this.requestRepository.updateEditedContent({
            id,
            editedContentMarkdown: input.editedContentMarkdown,
            isEdited: determineEditedState(detail.originalContentMarkdown, input.editedContentMarkdown),
            updatedAt,
        });
        this.eventRepository.create({
            id: createEventId(),
            requestId: id,
            eventType: 'request.content_edited',
            actorType: 'human',
            payloadJson: JSON.stringify({
                isEdited: determineEditedState(detail.originalContentMarkdown, input.editedContentMarkdown),
            }),
            createdAt: updatedAt,
        });
        return this.getRequestById(id);
    }
}
