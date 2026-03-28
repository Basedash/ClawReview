import { desc, eq } from 'drizzle-orm';

import type { ReviewDatabase } from '../db/client.js';
import { reviews, type NewReviewRow, type ReviewRow } from '../db/schema.js';

export class ReviewRepository {
  public constructor(private readonly db: ReviewDatabase) {}

  public create(input: NewReviewRow): ReviewRow {
    this.db.insert(reviews).values(input).run();
    const row = this.findById(input.id);
    if (!row) {
      throw new Error('Failed to create review record.');
    }
    return row;
  }

  public findById(id: string): ReviewRow | null {
    return (
      this.db.select().from(reviews).where(eq(reviews.id, id)).get() ?? null
    );
  }

  public latestForRequest(requestId: string): ReviewRow | null {
    return (
      this.db
        .select()
        .from(reviews)
        .where(eq(reviews.requestId, requestId))
        .orderBy(desc(reviews.submittedAt))
        .limit(1)
        .get() ?? null
    );
  }

  public listForRequest(requestId: string): ReviewRow[] {
    return this.db
      .select()
      .from(reviews)
      .where(eq(reviews.requestId, requestId))
      .orderBy(desc(reviews.submittedAt))
      .all();
  }

  public attachResumePayload(reviewId: string, resumePayloadJson: string): void {
    this.db
      .update(reviews)
      .set({ resumePayloadJson })
      .where(eq(reviews.id, reviewId))
      .run();
  }
}
