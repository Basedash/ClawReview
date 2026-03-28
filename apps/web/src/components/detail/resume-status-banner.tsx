import type { RequestDetail } from '@clawreview/shared';

import { Badge } from '../common/badge.js';

interface ResumeStatusBannerProps {
  request: RequestDetail;
  onRetry?: () => void;
  retrying?: boolean;
}

export function ResumeStatusBanner({
  request,
  onRetry,
  retrying = false,
}: ResumeStatusBannerProps) {
  if (request.resumeStatus === 'not_requested') {
    return null;
  }

  const tone =
    request.resumeStatus === 'failed'
      ? 'danger'
      : request.resumeStatus === 'succeeded'
        ? 'success'
        : 'warning';

  const label = request.resumeStatus.replace(/_/g, ' ');

  return (
    <div className={`resume-banner tone-${tone}`}>
      <div className="resume-banner__header">
        <Badge tone={tone}>{label}</Badge>
        {request.resumeStatus === 'failed' && onRetry ? (
          <button
            type="button"
            className="button button--ghost"
            onClick={onRetry}
            disabled={retrying}
          >
            {retrying ? 'Retrying…' : 'Retry resume'}
          </button>
        ) : null}
      </div>
      {request.resumeStatus === 'succeeded' ? (
        <p className="resume-banner__success">
          Resume dispatched successfully.
        </p>
      ) : null}
      {request.resumeError ? (
        <p className="resume-banner__error">{request.resumeError}</p>
      ) : null}
    </div>
  );
}
