import { buildServer } from './app.js';

async function start(): Promise<void> {
  const port = Number(process.env.PORT ?? 4310);
  const host = process.env.HOST ?? '127.0.0.1';
  const app = buildServer({
    databaseUrl: process.env.DATABASE_URL ?? './data/clawreview.db',
    openclawBaseUrl: process.env.OPENCLAW_BASE_URL ?? 'http://127.0.0.1:3456',
    openclawGatewayToken: process.env.OPENCLAW_GATEWAY_TOKEN ?? '',
  });

  await app.listen({
    host,
    port,
  });
}

void start();
