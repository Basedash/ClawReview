import type { RequestDetail } from '@clawreview/shared';

import { formatRelativeTime } from '../../lib/format.js';
import { Badge } from '../common/badge.js';

export interface ActivityLogProps {
  events: RequestDetail['events'];
}

export function ActivityLog({ events }: ActivityLogProps) {
  return (
    <section className="panel">
      <div className="section-header">
        <h3>Activity</h3>
      </div>
      <div className="activity-list">
        {events.map((event) => (
          <div key={event.id} className="activity-row">
            <div>
              <div className="activity-title">{event.eventType}</div>
              <div className="activity-subtitle">
                {event.actorType} · {formatRelativeTime(event.createdAt)}
              </div>
            </div>
            <Badge tone="neutral">{event.actorType}</Badge>
          </div>
        ))}
      </div>
    </section>
  );
}
