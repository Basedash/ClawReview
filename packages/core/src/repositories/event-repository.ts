import { desc, eq } from 'drizzle-orm';

import type { ReviewDatabase } from '../db/client.js';
import { requestEvents, type NewRequestEventRow } from '../db/schema.js';

export class EventRepository {
  public constructor(private readonly db: ReviewDatabase) {}

  public insert(input: NewRequestEventRow): void {
    this.db.insert(requestEvents).values(input).run();
  }

  public create(input: NewRequestEventRow): void {
    this.insert(input);
  }

  public listForRequest(requestId: string) {
    return this.db
      .select()
      .from(requestEvents)
      .where(eq(requestEvents.requestId, requestId))
      .orderBy(desc(requestEvents.createdAt))
      .all();
  }
}
