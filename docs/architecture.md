# Architecture

ClawReview is a local-first human review platform for agent workflows.

## Components

### 1. Web UI (`apps/web`)

- React + Vite single-page app
- Linear-inspired split layout
- Open request list in the sidebar
- Detail pane with editable markdown textarea, review controls, metadata, and activity log
- Keyboard shortcut help overlay

### 2. Backend API (`apps/server`)

- Fastify API
- Serves request lifecycle endpoints:
  - `GET /api/health`
  - `GET /api/config-status`
  - `GET /api/requests`
  - `POST /api/requests`
  - `GET /api/requests/:id`
  - `PATCH /api/requests/:id/content`
  - `POST /api/requests/:id/review`
  - `POST /api/requests/:id/retry-resume`
- Serves built web assets in production

### 3. Core domain (`packages/core`)

- SQLite schema and initialization
- Request, review, and activity repositories
- Request/edit/review lifecycle services
- Harness adapter abstraction
- OpenClaw resume adapter and client

### 4. MCP server (`packages/mcp-server`)

- Stdio MCP server using the official TypeScript SDK
- Exposes `request_approval_from_user`
- Creates durable review requests and returns `pending_review`

### 5. Shared contracts (`packages/shared`)

- Zod schemas
- Request/review enums
- Shared payload types for API and MCP boundaries

## Request lifecycle

1. An agent calls `request_approval_from_user`.
2. The MCP tool validates the payload and creates a review request in SQLite.
3. The UI lists the request as open and pending.
4. A human edits the markdown content and submits approve/comment/reject.
5. The backend stores the review, closes the request, records events, and sends a continuation message to OpenClaw.
6. Resume success or failure is persisted and shown in the UI.
7. Failed resumes can be retried manually.

## OpenClaw continuation model

The platform does not pause an in-memory run. Instead it:

- stores continuation metadata durably with the request
- later sends a new `/v1/responses` request back into OpenClaw

Persisted continuation data includes:

- `agentId`
- `sessionKey`
- optional `previousResponseId`
- optional `gatewayBaseUrl`
- optional `user`

## Storage

- Default database: SQLite
- Default path: `./data/clawreview.db`
- No external services required for v1

## Trust model

This v1 implementation is designed for:

- local development
- self-hosted single-user setups
- trusted local networks

There is no auth layer in v1. Anyone who can access the service can review requests and trigger OpenClaw resumes, so deploy it only in trusted environments.
