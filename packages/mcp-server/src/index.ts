import { loadAppConfigFromEnv } from '../../core/src/index.js';
import { startMcpServer } from './server.js';

async function main(): Promise<void> {
  const config = loadAppConfigFromEnv();

  await startMcpServer({
    databaseUrl: config.databaseUrl,
    openclawBaseUrl: config.openclawBaseUrl,
    openclawGatewayToken: config.openclawGatewayToken,
  });
}

main().catch((error) => {
  console.error('MCP server failed to start:', error);
  process.exit(1);
});
