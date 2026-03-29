import type { RequestDetail } from '@clawreview/shared';

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

  const variant =
    request.resumeStatus === 'failed'
      ? 'danger'
      : request.resumeStatus === 'succeeded'
        ? 'success'
        : 'warning';

  const label =
    request.resumeStatus === 'succeeded'
      ? 'Resume dispatched successfully'
      : request.resumeStatus === 'failed'
        ? 'Resume failed'
        : `Resume ${request.resumeStatus.replace(/_/g, ' ')}`;

  return (
    <div className={`resume-banner resume-banner--${variant}`}>
      <div className="resume-banner__text">
        <span className="resume-banner__label">{label}</span>
        {request.resumeError ? (
          <span className="resume-banner__detail">{request.resumeError}</span>
        ) : null}
      </div>
      {request.resumeStatus === 'failed' && onRetry ? (
        <button
          type="button"
          className="button button--sm button--ghost"
          onClick={onRetry}
          disabled={retrying}
        >
          {retrying ? 'Retrying…' : 'Retry'}
        </button>
      ) : null}
    </div>
  );
}
