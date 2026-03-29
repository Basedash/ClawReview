import type { RequestDetail } from '@clawreview/shared';
import { Badge } from '../common/badge.js';
import { Timestamp } from '../common/timestamp.js';

export function RequestHeader({ request }: { request: RequestDetail }) {
  return (
    <div className="detail-header">
      <div className="detail-header__top">
        <Badge tone={request.status === 'open' ? 'success' : 'muted'} dot>
          {request.status}
        </Badge>
        {request.isEdited ? <Badge tone="warning">edited</Badge> : null}
      </div>
      <h1>{request.title}</h1>
      <div className="detail-header__meta">
        <span>{request.publicId}</span>
        <span className="detail-header__meta-sep" />
        <span>
          <Timestamp value={request.createdAt} />
        </span>
        <span className="detail-header__meta-sep" />
        <span>
          Updated <Timestamp value={request.updatedAt} />
        </span>
        {request.resumeStatus !== 'not_requested' && (
          <>
            <span className="detail-header__meta-sep" />
            <Badge
              tone={
                request.resumeStatus === 'failed'
                  ? 'danger'
                  : request.resumeStatus === 'succeeded'
                    ? 'success'
                    : 'muted'
              }
            >
              resume: {request.resumeStatus.replace(/_/g, ' ')}
            </Badge>
          </>
        )}
      </div>
    </div>
  );
}
