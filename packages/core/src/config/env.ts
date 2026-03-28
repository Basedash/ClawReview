import { z } from 'zod';

const appConfigSchema = z.object({
  databaseUrl: z.string().trim().min(1),
  openclawBaseUrl: z.string().trim().min(1),
  openclawGatewayToken: z.string().trim().default(''),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
export type AppConfigInput = Partial<AppConfig> & {
  databaseUrl: string;
  openclawBaseUrl: string;
};

export function loadAppConfig(input: AppConfigInput): AppConfig {
  return appConfigSchema.parse({
    databaseUrl: input.databaseUrl,
    openclawBaseUrl: input.openclawBaseUrl,
    openclawGatewayToken: input.openclawGatewayToken ?? '',
  });
}

export function loadAppConfigFromEnv(
  input: NodeJS.ProcessEnv = process.env,
): AppConfig {
  return loadAppConfig({
    databaseUrl: input.DATABASE_URL ?? './data/clawreview.db',
    openclawBaseUrl: input.OPENCLAW_BASE_URL ?? 'http://127.0.0.1:3456',
    openclawGatewayToken: input.OPENCLAW_GATEWAY_TOKEN ?? '',
  });
}
