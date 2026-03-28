import { z } from 'zod';
const appConfigSchema = z.object({
    databaseUrl: z.string().trim().min(1),
    openclawBaseUrl: z.string().trim().min(1),
    openclawGatewayToken: z.string().trim().default(''),
});
export function loadAppConfig(input) {
    return appConfigSchema.parse({
        databaseUrl: input.databaseUrl,
        openclawBaseUrl: input.openclawBaseUrl,
        openclawGatewayToken: input.openclawGatewayToken ?? '',
    });
}
export function loadAppConfigFromEnv(input = process.env) {
    return loadAppConfig({
        databaseUrl: input.DATABASE_URL ?? './data/clawreview.db',
        openclawBaseUrl: input.OPENCLAW_BASE_URL ?? 'http://127.0.0.1:3456',
        openclawGatewayToken: input.OPENCLAW_GATEWAY_TOKEN ?? '',
    });
}
