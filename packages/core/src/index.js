import { OpenClawHarnessAdapter } from './adapters/openclaw-adapter.js';
import { loadAppConfig, } from './config/env.js';
import { createDatabaseClient } from './db/client.js';
import { EventRepository } from './repositories/event-repository.js';
import { RequestRepository } from './repositories/request-repository.js';
import { ReviewRepository } from './repositories/review-repository.js';
import { RequestService } from './services/request-service.js';
import { ReviewService } from './services/review-service.js';
export * from './adapters/harness-adapter.js';
export * from './adapters/openclaw-adapter.js';
export * from './config/env.js';
export * from './db/client.js';
export * from './db/schema.js';
export * from './domain/transitions.js';
export * from './errors.js';
export * from './integrations/openclaw-client.js';
export * from './repositories/event-repository.js';
export * from './repositories/request-repository.js';
export * from './repositories/review-repository.js';
export * from './services/request-service.js';
export * from './services/review-service.js';
export * from './utils/ids.js';
export * from './utils/time.js';
export function createCoreServices(input) {
    const config = loadAppConfig(input);
    const database = createDatabaseClient(config.databaseUrl);
    const requestRepository = new RequestRepository(database.db);
    const reviewRepository = new ReviewRepository(database.db);
    const eventRepository = new EventRepository(database.db);
    const openClawAdapter = new OpenClawHarnessAdapter({
        baseUrl: config.openclawBaseUrl,
        gatewayToken: config.openclawGatewayToken,
    }, input.fetchFn);
    const requestService = new RequestService(requestRepository, eventRepository, config);
    const reviewService = new ReviewService(requestRepository, reviewRepository, eventRepository, openClawAdapter);
    return {
        config,
        database,
        requestRepository,
        reviewRepository,
        eventRepository,
        openClawAdapter,
        requestService,
        reviewService,
    };
}
