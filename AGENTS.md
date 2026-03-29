# AGENTS.md

## Cursor Cloud specific instructions

### Overview

ClawReview is a local-first human review platform for AI agent workflows. It is a pnpm monorepo with no Docker, no external databases, and no external services required for basic operation. See `README.md` for full documentation.

### Prerequisites

- Node.js 22+ and pnpm 10+ (already available in Cloud VM)
- `.env` must exist at the repo root; copy from `.env.example` if missing: `cp .env.example .env`

### Key commands

| Task | Command |
|---|---|
| Install deps | `pnpm install` |
| Build all | `pnpm build` |
| Lint | `pnpm lint` |
| Test | `pnpm test` |
| Dev (both servers) | `pnpm dev` |
| Dev API only | `pnpm dev:server` (port 4310) |
| Dev Web only | `pnpm dev:web` (port 4173) |

### Known test behavior

Two tests in `packages/core` (`openclaw-adapter.test.ts` and `review-service.test.ts`) fail when the `openclaw` CLI binary is not installed. These tests exercise the OpenClaw resume path which requires the external `openclaw` binary at `/home/openclaw/.npm-global/bin/openclaw` (or `OPENCLAW_BIN` env var). This is expected in environments without OpenClaw and does not indicate a code defect. The remaining 8 tests across `shared`, `core`, `web`, and `server` packages pass cleanly.

### Build order matters

Packages must be built in dependency order: `shared` -> `core` -> `server` / `mcp-server` / `web`. The root `pnpm build` script already handles this. If you modify `packages/shared` or `packages/core`, rebuild before running dependent packages.

### Dev server proxy

In dev mode, the Vite web server (port 4173) proxies `/api` requests to the Fastify backend (port 4310). Both servers must be running for the UI to function. Use `pnpm dev` to start both in parallel.

### SQLite database

The database is auto-created at `./data/clawreview.db` on first server start. No migrations or manual setup needed. Tests use in-memory SQLite (`:memory:`).

### Lint pre-existing issues

The `packages/shared` package has pre-existing Biome lint errors (unused imports, `useImportType` style violations in generated `.js` output files). These are not caused by agent changes.
