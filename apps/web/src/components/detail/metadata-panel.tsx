import type { RequestDetail } from '@clawreview/shared';

type MetadataPanelProps = {
  request: RequestDetail;
};

function formatRecord(record: Record<string, unknown> | null): string {
  if (!record || Object.keys(record).length === 0) {
    return 'None';
  }

  return JSON.stringify(record, null, 2);
}

export function MetadataPanel({ request }: MetadataPanelProps) {
  return (
    <section className="panel stack-md">
      <div className="section-heading">
        <h2>Metadata</h2>
        <span>Source and context</span>
      </div>

      <div className="metadata-grid">
        <div>
          <dt>Harness</dt>
          <dd>{request.sourceHarness}</dd>
        </div>
        <div>
          <dt>Agent</dt>
          <dd>{request.sourceAgentLabel || request.sourceAgentId}</dd>
        </div>
        <div>
          <dt>Workflow</dt>
          <dd>{request.sourceWorkflowLabel || 'Not provided'}</dd>
        </div>
        <div>
          <dt>Session</dt>
          <dd>{request.sourceSessionKey}</dd>
        </div>
        <div>
          <dt>Previous response</dt>
          <dd>{request.sourcePreviousResponseId || 'None'}</dd>
        </div>
        <div>
          <dt>Gateway override</dt>
          <dd>{request.sourceGatewayBaseUrl || 'Default'}</dd>
        </div>
        <div>
          <dt>User key</dt>
          <dd>{request.sourceUser || 'None'}</dd>
        </div>
        <div>
          <dt>Edited</dt>
          <dd>{request.isEdited ? 'Yes' : 'No'}</dd>
        </div>
      </div>

      <div className="metadata-code-group">
        <div>
          <h3>Source metadata</h3>
          <pre>{formatRecord(request.sourceMetadata)}</pre>
        </div>
        <div>
          <h3>Context</h3>
          <pre>{formatRecord(request.context)}</pre>
        </div>
      </div>
    </section>
  );
}
