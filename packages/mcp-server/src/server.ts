import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod/v4';

import { createCoreServices } from '../../core/src/index.js';
import {
  requestApprovalResultSchema,
  type RequestApprovalResult,
} from '../../shared/src/index.js';

export interface BuildMcpServerOptions {
  databaseUrl: string;
  openclawBaseUrl: string;
  openclawGatewayToken?: string;
  fetchFn?: typeof fetch;
}

export interface ApprovalToolInput {
  title: string;
  summary?: string;
  contentMarkdown: string;
  source?: {
    harness?: 'openclaw';
    agentLabel?: string;
    workflowLabel?: string;
  };
  continuation: {
    agentId: string;
    sessionKey: string;
    previousResponseId?: string;
    gatewayBaseUrl?: string;
    user?: string;
    metadata?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export function createApprovalServer(options: BuildMcpServerOptions) {
  const services = createCoreServices({
    databaseUrl: options.databaseUrl,
    openclawBaseUrl: options.openclawBaseUrl,
    openclawGatewayToken: options.openclawGatewayToken ?? '',
    fetchFn: options.fetchFn,
  });

  const server = new McpServer({
    name: 'clawreview-mcp',
    version: '0.1.0',
  });

  async function callRequestApproval(
    input: ApprovalToolInput,
  ): Promise<RequestApprovalResult> {
    const created = services.requestService.createRequest({
      title: input.title,
      summary: input.summary ?? '',
      contentMarkdown: input.contentMarkdown,
      continuation: input.continuation,
      source: input.source
        ? {
            harness: input.source.harness ?? 'openclaw',
            agentLabel: input.source.agentLabel,
            workflowLabel: input.source.workflowLabel,
          }
        : undefined,
      metadata: input.metadata,
      context: input.context,
    });

    return requestApprovalResultSchema.parse({
      status: 'pending_review',
      requestId: created.id,
      publicId: created.publicId,
      message: `Review request ${created.publicId} is pending human review.`,
    });
  }

  server.registerTool(
    'request_approval_from_user',
    {
      description:
        'Create a human review request and return a pending_review status.',
      inputSchema: {
        title: z.string().min(1).max(160),
        summary: z.string().optional(),
        contentMarkdown: z.string().min(1),
        source: z
          .object({
            harness: z.literal('openclaw').optional(),
            agentLabel: z.string().optional(),
            workflowLabel: z.string().optional(),
          })
          .optional(),
        continuation: z.object({
          agentId: z.string().min(1),
          sessionKey: z.string().min(1),
          previousResponseId: z.string().optional(),
          gatewayBaseUrl: z.string().optional(),
          user: z.string().optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        }),
        metadata: z.record(z.string(), z.unknown()).optional(),
        context: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async (input) => {
      const result = await callRequestApproval(input as ApprovalToolInput);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
        structuredContent: result,
      };
    },
  );

  return {
    server,
    services,
    callRequestApproval,
  };
}

export async function startMcpServer(
  options: BuildMcpServerOptions,
): Promise<void> {
  const { server } = createApprovalServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
