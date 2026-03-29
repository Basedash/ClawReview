import type { RequestDetail } from '@clawreview/shared';

export function RequestSummary({ request }: { request: RequestDetail }) {
  if (!request.summary) {
    return null;
  }

  return (
    <div className="card">
      <div className="card__body">
        <p className="summary-text">{request.summary}</p>
      </div>
    </div>
  );
}
