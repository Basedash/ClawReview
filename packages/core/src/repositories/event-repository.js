import { desc, eq } from 'drizzle-orm';
import { requestEvents } from '../db/schema.js';
export class EventRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    insert(input) {
        this.db.insert(requestEvents).values(input).run();
    }
    create(input) {
        this.insert(input);
    }
    listForRequest(requestId) {
        return this.db
            .select()
            .from(requestEvents)
            .where(eq(requestEvents.requestId, requestId))
            .orderBy(desc(requestEvents.createdAt))
            .all();
    }
}
