import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';

import {
  createCoreServices,
  DomainError,
  loadAppConfig,
  type CreateCoreServicesInput,
} from '../../../packages/core/src/index.js';
import {
  configStatusSchema,
  createReviewRequestSchema,
  getRequestResponseSchema,
  healthStatusSchema,
  listRequestsQuerySchema,
  listRequestsResponseSchema,
  retryResumeResponseSchema,
  submitReviewResponseSchema,
  submitReviewSchema,
  updateRequestContentInputSchema,
  updateRequestContentResponseSchema,
} from '../../../packages/shared/src/index.js';

import { presentRequestDetail, presentRequestListItem } from './presenters/request-presenter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDistDir = path.resolve(__dirname, '../../web/dist');

export interface BuildServerOptions extends CreateCoreServicesInput {}

export function buildServer(options: BuildServerOptions): FastifyInstance {
  const config = loadAppConfig(options);
  const services = createCoreServices({
    ...config,
    fetchFn: options.fetchFn,
  });

  const app = Fastify({
    logger: false,
  });

  void app.register(sensible);
  void app.register(cors, {
    origin: true,
  });

  void app.register(fastifyStatic, {
    root: webDistDir,
    prefix: '/',
    wildcard: false,
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof DomainError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unexpected server error.',
      },
    });
  });

  app.get('/api/health', async () =>
    healthStatusSchema.parse({
      ok: true,
      now: new Date().toISOString(),
    }),
  );

  app.get('/api/config-status', async () =>
    configStatusSchema.parse(services.requestService.getConfigStatus()),
  );

  app.get('/api/requests', async (request) => {
    const query = listRequestsQuerySchema.parse(request.query);
    const requests = services.requestService
      .listRequests(query)
      .map(presentRequestListItem);

    return listRequestsResponseSchema.parse({
      requests,
    });
  });

  app.post('/api/requests', async (request, reply) => {
    const input = createReviewRequestSchema.parse(request.body);
    const created = services.requestService.createRequest(input);
    return reply.status(201).send(
      getRequestResponseSchema.parse({
        request: presentRequestDetail(created),
      }),
    );
  });

  app.get('/api/requests/:id', async (request) => {
    const { id } = request.params as { id: string };
    const detail = services.requestService.getRequestById(id);
    return getRequestResponseSchema.parse({
      request: presentRequestDetail(detail),
    });
  });

  app.patch('/api/requests/:id/content', async (request) => {
    const { id } = request.params as { id: string };
    const input = updateRequestContentInputSchema.parse(request.body);
    const updated = services.requestService.updateEditedContent(id, input);

    return updateRequestContentResponseSchema.parse({
      request: presentRequestDetail(updated),
    });
  });

  app.post('/api/requests/:id/review', async (request) => {
    const { id } = request.params as { id: string };
    const input = submitReviewSchema.parse(request.body);
    const reviewed = await services.reviewService.submitReview(id, input);

    return submitReviewResponseSchema.parse({
      request: presentRequestDetail(reviewed),
    });
  });

  app.post('/api/requests/:id/retry-resume', async (request) => {
    const { id } = request.params as { id: string };
    const reviewed = await services.reviewService.retryResume(id);

    return retryResumeResponseSchema.parse({
      requestId: reviewed.id,
      publicId: reviewed.publicId,
      resumeStatus: reviewed.resumeStatus,
    });
  });

  app.get('*', async (_request, reply) => {
    try {
      return reply.sendFile('index.html');
    } catch {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Web build not found. Build the web app first.',
        },
      });
    }
  });

  return app;
}
