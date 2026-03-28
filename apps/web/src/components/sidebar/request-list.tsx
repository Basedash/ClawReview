import type { RequestListItem } from '@clawreview/shared';

import { EmptyState } from '../common/empty-state';
import { RequestListItemRow } from './request-list-item';

interface RequestListProps {
  requests: RequestListItem[];
  selectedId: string | null;
  onSelect: (requestId: string) => void;
  statusLabel: string;
}

export function RequestList({
  requests,
  selectedId,
  onSelect,
  statusLabel,
}: RequestListProps) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title={`No ${statusLabel.toLowerCase()} requests`}
        description="New human review requests will appear here."
      />
    );
  }

  return (
    <div className="request-list" role="listbox" aria-label="Review requests">
      {requests.map((request) => (
        <RequestListItemRow
          key={request.id}
          request={request}
          selected={request.id === selectedId}
          onSelect={() => onSelect(request.id)}
        />
      ))}
    </div>
  );
}
