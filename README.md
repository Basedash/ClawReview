# ClawReview

ClawReview is an open-source, self-hostable human review platform for AI agent workflows.

It is designed for the moment when an agent wants a human decision before continuing. Instead of coupling approval to an arbitrary side-effecting tool, the agent creates a durable review request with a title, summary, editable markdown content, and continuation metadata. A human reviews that request in a local UI, optionally edits the content, and submits an approval, comment, or rejection. ClawReview then resumes the originating OpenClaw session with the human review result.

## Why it exists

AI agents often need:

- a clean way to ask for human approval
- a durable audit trail of what was reviewed
- an editable review surface for draft content
- a reliable continuation path back into the original workflow

ClawReview provides those pieces with a lightweight local-first stack:

- **Web UI** for reviewing and editing requests
- **Backend API** for persistence and OpenClaw resume dispatch
- **MCP server** exposing `request_approval_from_user`
- **SQLite** storage by default

## Current architecture

- `apps/web` — React + Vite review UI
- `apps/server` — Fastify API and static asset serving
- `packages/core` — request lifecycle, SQLite repositories, resume logic, OpenClaw adapter
- `packages/shared` — shared schemas and API contracts
- `packages/mcp-server` — stdio MCP server and approval tool

## Features implemented

- create human review requests through REST or MCP
- persist requests, reviews, and activity events in SQLite
- list, load, edit, and review requests
- approve / comment / reject review flow
- OpenClaw resume dispatch via `/v1/responses`
- retry failed resume dispatches
- keyboard-friendly review UI
- local-first install with no auth

## Requirements

- Node.js 22+
- pnpm 10+
- an OpenClaw Gateway if you want real workflow resumption

## Environment variables

Copy `.env.example` to `.env` and adjust as needed.

```bash
PORT=4310
WEB_PORT=4173
DATABASE_URL=./data/clawreview.db
OPENCLAW_BASE_URL=http://127.0.0.1:3456
OPENCLAW_GATEWAY_TOKEN=replace-me
```

### OpenClaw token

ClawReview expects the OpenClaw gateway token in `OPENCLAW_GATEWAY_TOKEN`.

If you already have OpenClaw configured locally, you can usually copy it from:

- `~/.openclaw/openclaw.json`
- the `gateway.auth.token` field

## Install

```bash
git clone <repo-url>
cd ClawReview
pnpm install
cp .env.example .env
```

## Run locally

### API server

```bash
pnpm dev:server
```

This starts the Fastify API on `http://127.0.0.1:4310` by default.

### Web UI

```bash
pnpm dev:web
```

This starts the Vite app on `http://127.0.0.1:4173` by default. In dev mode, `/api` requests are proxied to the backend.

### MCP server

```bash
pnpm dev:mcp
```

This starts the stdio MCP server for local process-spawned integrations.

## MCP tool

The MCP server exposes:

- `request_approval_from_user`

Expected input shape:

```json
{
  "title": "Review release draft",
  "summary": "Check release notes",
  "contentMarkdown": "# Draft\n\nPlease confirm the release narrative.",
  "source": {
    "harness": "openclaw",
    "agentLabel": "Planner",
    "workflowLabel": "release"
  },
  "continuation": {
    "agentId": "agent-1",
    "sessionKey": "main",
    "previousResponseId": "optional",
    "gatewayBaseUrl": "optional",
    "user": "optional",
    "metadata": {
      "branch": "cursor/human-review-platform-5c64"
    }
  },
  "metadata": {
    "branch": "cursor/human-review-platform-5c64"
  },
  "context": {
    "checklist": ["docs", "tests"]
  }
}
```

Example result:

```json
{
  "status": "pending_review",
  "requestId": "01ABC...",
  "publicId": "CR-0001",
  "message": "Review request CR-0001 is pending human review."
}
```

## OpenClaw integration notes

ClawReview is **OpenClaw-first** today, but the continuation logic is adapter-shaped.

For reliable resumption, the approval tool input explicitly accepts continuation metadata because MCP stdio calls do not reliably expose the calling OpenClaw session identity automatically.

At minimum, pass:

- `continuation.agentId`
- `continuation.sessionKey`

Optional:

- `continuation.previousResponseId`
- `continuation.gatewayBaseUrl`
- `continuation.user`

On review submission, the backend sends a new turn to OpenClaw via `POST /v1/responses` with:

- bearer auth from `OPENCLAW_GATEWAY_TOKEN`
- `x-openclaw-agent-id`
- `x-openclaw-session-key`
- a deterministic human-review continuation message

## Suggested MCP config

Create or adapt a local MCP config so OpenClaw can launch the stdio server:

```json
{
  "mcpServers": {
    "clawreview": {
      "command": "pnpm",
      "args": ["--filter", "@clawreview/mcp-server", "dev"],
      "cwd": "/absolute/path/to/ClawReview",
      "env": {
        "DATABASE_URL": "./data/clawreview.db",
        "OPENCLAW_BASE_URL": "http://127.0.0.1:3456",
        "OPENCLAW_GATEWAY_TOKEN": "replace-me"
      }
    }
  }
}
```

## Suggested OpenClaw skill snippet

Use a skill or prompt block like this:

> When you need human approval or feedback before continuing, call `request_approval_from_user`.
> Provide a concise human-readable title, a short summary, and the markdown content to review.
> Always include continuation metadata with at least `agentId` and `sessionKey`.
> After the tool returns `pending_review`, stop immediately and do not continue planning or calling more tools in that turn.
> When the session resumes, treat the human review result and edited content as authoritative feedback and continue accordingly.

## Manual end-to-end flow

1. Start the API server.
2. Start the web UI.
3. Start the MCP server.
4. Create a request through the MCP tool or POST to `/api/requests`.
5. Open the web UI and confirm the request appears in the sidebar.
6. Edit the markdown content.
7. Submit approve / comment / reject.
8. Verify the request closes and the resume status updates.
9. If OpenClaw is unavailable, verify the request shows a failed resume state and retry works after the dependency is restored.

## Testing

Run everything:

```bash
pnpm test
pnpm build
```

The repository currently includes:

- shared schema tests
- core lifecycle tests
- server API tests
- MCP tool test
- web UI rendering and interaction test

## Verified local evidence

Validated during implementation:

- `pnpm test` passes across the workspace
- `pnpm build` passes across the workspace
- backend health endpoint responds successfully
- a demo request can be created through the API
- the Vite dev UI shows the open request, summary, and editable content area

A fresh validation screenshot was captured at:

- `/opt/cursor/artifacts/screenshots/clawreview-validation-20260328T083112Z-3013.png`

## Trust and security model

This is a **trusted local software** tool for v1.

- no auth
- no RBAC
- intended for a single user or trusted local network
- holds the ability to resume local OpenClaw sessions if configured with a valid gateway token

Treat the machine and token as sensitive operator resources.

## Troubleshooting

### The web UI loads but shows no requests

In dev mode, make sure the Vite server is proxying `/api` to the backend and that the backend is running.

### Resume status is failed

Check:

- `OPENCLAW_GATEWAY_TOKEN`
- `OPENCLAW_BASE_URL`
- that OpenClaw Gateway is reachable
- that `/v1/responses` is enabled on the gateway

### MCP tool creates nothing

Confirm:

- the MCP server process is running
- the MCP config points at the correct repo path
- the same `DATABASE_URL` is being used by the API and MCP server if you expect the UI to see those requests

## Status

This is a coherent v1 foundation with:

- durable review persistence
- OpenClaw session resumption
- a functional UI
- local installation path

Future iterations can add:

- richer editor behavior
- deeper activity detail
- additional harness adapters
- improved visual polish
