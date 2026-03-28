import clsx from 'clsx';

import type { RequestListItem } from '@clawreview/shared';

import { formatRelativeTime } from '../../lib/format.js';
import { Badge } from '../common/badge.js';

interface RequestListItemProps {
  request: RequestListItem;
  selected: boolean;
  onSelect: (requestId: string) => void;
}

function reviewTone(
  state: RequestListItem['reviewState'],
): 'warning' | 'success' | 'muted' | 'danger' {
  switch (state) {
    case 'pending':
      return 'warning';
    case 'approved':
      return 'success';
    case 'commented':
      return 'muted';
    case 'rejected':
      return 'danger';
  }
}

export function RequestListItemRow({
  request,
  selected,
  onSelect,
}: RequestListItemProps) {
  return (
    <button
      className={clsx('request-row', selected && 'selected')}
      onClick={() => onSelect(request.id)}
      type="button"
    >
      <div className="request-row__title-line">
        <span className="request-row__title">{request.title}</span>
        <Badge tone={reviewTone(request.reviewState)}>{request.reviewState}</Badge>
      </div>
      <div className="request-row__meta">
        <span>{request.sourceAgentLabel || request.sourceAgentId}</span>
        <span>{formatRelativeTime(request.updatedAt)}</span>
      </div>
    </button>
  );
}
