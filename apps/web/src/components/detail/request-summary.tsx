import type { RequestDetail } from '@clawreview/shared';

export function RequestSummary({ request }: { request: RequestDetail }) {
  return (
    <section className="panel">
      <h3 className="panel-title">Summary</h3>
      <p className="summary-text">
        {request.summary || 'No summary was provided for this review request.'}
      </p>
    </section>
  );
}
