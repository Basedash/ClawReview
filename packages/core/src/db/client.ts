import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema.js';

export type ReviewDatabase = BetterSQLite3Database<typeof schema>;

export interface DatabaseClient {
  sqlite: Database.Database;
  db: ReviewDatabase;
}

function normalizeDatabasePath(databaseUrl: string): string {
  if (databaseUrl === ':memory:') {
    return databaseUrl;
  }

  if (databaseUrl.startsWith('file:')) {
    return databaseUrl.slice('file:'.length);
  }

  return databaseUrl;
}

function ensureSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS review_requests (
      id TEXT PRIMARY KEY NOT NULL,
      public_id TEXT NOT NULL UNIQUE,
      sequence_number INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      review_state TEXT NOT NULL DEFAULT 'pending',
      original_content_markdown TEXT NOT NULL,
      edited_content_markdown TEXT NOT NULL,
      is_edited INTEGER NOT NULL DEFAULT 0,
      source_harness TEXT NOT NULL DEFAULT 'openclaw',
      source_agent_id TEXT NOT NULL,
      source_agent_label TEXT NOT NULL DEFAULT '',
      source_workflow_label TEXT NOT NULL DEFAULT '',
      source_session_key TEXT NOT NULL,
      source_previous_response_id TEXT,
      source_gateway_base_url TEXT,
      source_user TEXT,
      source_metadata_json TEXT,
      continuation_metadata_json TEXT,
      context_json TEXT,
      resume_status TEXT NOT NULL DEFAULT 'not_requested',
      resume_error TEXT,
      last_resume_attempt_at TEXT,
      last_resume_response_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      closed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY NOT NULL,
      request_id TEXT NOT NULL REFERENCES review_requests(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      comment_text TEXT,
      resume_payload_json TEXT,
      submitted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS request_events (
      id TEXT PRIMARY KEY NOT NULL,
      request_id TEXT NOT NULL REFERENCES review_requests(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      actor_type TEXT NOT NULL,
      payload_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS review_requests_status_updated_at_idx
      ON review_requests(status, updated_at);
    CREATE INDEX IF NOT EXISTS review_requests_review_state_idx
      ON review_requests(review_state);
    CREATE INDEX IF NOT EXISTS reviews_request_id_idx
      ON reviews(request_id);
    CREATE INDEX IF NOT EXISTS request_events_request_id_created_at_idx
      ON request_events(request_id, created_at);
  `);
}

export function createDatabaseClient(databaseUrl: string): DatabaseClient {
  const filename = normalizeDatabasePath(databaseUrl);

  if (filename !== ':memory:') {
    const directory = path.dirname(filename);
    fs.mkdirSync(directory, { recursive: true });
  }

  const sqlite = new Database(filename);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  ensureSchema(sqlite);

  return {
    sqlite,
    db: drizzle(sqlite, { schema }),
  };
}
