import type { RequestDetail } from '@clawreview/shared';

import { formatRelativeTime } from '../../lib/format.js';
import { Badge } from '../common/badge.js';

export interface ActivityLogProps {
  events: RequestDetail['events'];
}

function formatEventType(eventType: string): string {
  return eventType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ActivityLog({ events }: ActivityLogProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <div className="card__header">
        <span className="card__title">Activity</span>
        <span className="card__subtitle">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="activity-list">
        {events.map((event) => (
          <div key={event.id} className="activity-row">
            <div className="activity-info">
              <span className="activity-title">
                {formatEventType(event.eventType)}
              </span>
              <span className="activity-subtitle">
                {formatRelativeTime(event.createdAt)}
              </span>
            </div>
            <Badge tone="muted">{event.actorType}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
