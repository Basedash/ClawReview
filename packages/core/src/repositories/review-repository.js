import { desc, eq } from 'drizzle-orm';
import { reviews } from '../db/schema.js';
export class ReviewRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    create(input) {
        this.db.insert(reviews).values(input).run();
        const row = this.findById(input.id);
        if (!row) {
            throw new Error('Failed to create review record.');
        }
        return row;
    }
    findById(id) {
        return (this.db.select().from(reviews).where(eq(reviews.id, id)).get() ?? null);
    }
    latestForRequest(requestId) {
        return (this.db
            .select()
            .from(reviews)
            .where(eq(reviews.requestId, requestId))
            .orderBy(desc(reviews.submittedAt))
            .limit(1)
            .get() ?? null);
    }
    listForRequest(requestId) {
        return this.db
            .select()
            .from(reviews)
            .where(eq(reviews.requestId, requestId))
            .orderBy(desc(reviews.submittedAt))
            .all();
    }
    attachResumePayload(reviewId, resumePayloadJson) {
        this.db
            .update(reviews)
            .set({ resumePayloadJson })
            .where(eq(reviews.id, reviewId))
            .run();
    }
}
