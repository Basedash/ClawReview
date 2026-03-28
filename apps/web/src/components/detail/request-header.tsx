import { Badge } from '../common/badge.js';
import { Timestamp } from '../common/timestamp.js';
import type { RequestDetail } from '@clawreview/shared';

export function RequestHeader({ request }: { request: RequestDetail }) {
  return (
    <div className="detail-header">
      <div>
        <div className="detail-header-topline">
          <Badge tone="muted">{request.publicId}</Badge>
          <Badge tone={request.status === 'open' ? 'success' : 'muted'}>
            {request.status}
          </Badge>
          <Badge
            tone={request.resumeStatus === 'failed' ? 'danger' : 'muted'}
          >
            resume {request.resumeStatus.replace(/_/g, ' ')}
          </Badge>
          {request.isEdited ? <Badge tone="warning">edited</Badge> : null}
        </div>
        <h1>{request.title}</h1>
      </div>
      <div className="detail-header-meta">
        <div>
          <span>Updated</span>
          <Timestamp value={request.updatedAt} />
        </div>
        <div>
          <span>Created</span>
          <Timestamp value={request.createdAt} />
        </div>
      </div>
    </div>
  );
}
