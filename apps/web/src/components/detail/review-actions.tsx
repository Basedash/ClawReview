import type { ReviewAction } from '@clawreview/shared';
import { useMemo, useState } from 'react';

export interface ReviewDraftState {
  action: ReviewAction;
  comment: string;
}

interface ReviewActionsProps {
  disabled?: boolean;
  draft: ReviewDraftState;
  onChange: (draft: ReviewDraftState) => void;
  onSubmit: (draft: ReviewDraftState) => Promise<void> | void;
}

const actions: Array<{ value: ReviewAction; label: string }> = [
  { value: 'approve', label: 'Approve' },
  { value: 'comment', label: 'Comment' },
  { value: 'reject', label: 'Reject' },
];

export function ReviewActions({
  disabled = false,
  draft,
  onChange,
  onSubmit,
}: ReviewActionsProps) {
  const [submitting, setSubmitting] = useState(false);

  const submitLabel = useMemo(() => {
    const selected = actions.find((item) => item.value === draft.action);
    return selected ? selected.label : 'Submit';
  }, [draft.action]);

  async function handleSubmit() {
    if (disabled || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(draft);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="card__header">
        <span className="card__title">Review</span>
      </div>
      <div className="card__body">
        <div className="review-section">
          <div className="segmented" role="tablist" aria-label="Review action">
            {actions.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`segmented__item${draft.action === item.value ? ' segmented__item--active' : ''}`}
                aria-pressed={draft.action === item.value}
                onClick={() => onChange({ ...draft, action: item.value })}
                disabled={disabled || submitting}
              >
                {item.label}
              </button>
            ))}
          </div>

          <textarea
            className="textarea"
            rows={3}
            placeholder="Optional comment for the agent..."
            value={draft.comment}
            onChange={(event) =>
              onChange({ ...draft, comment: event.target.value })
            }
            disabled={disabled || submitting}
          />

          <div className="actions-row">
            <button
              type="button"
              className={`button ${draft.action === 'reject' ? 'button--danger' : 'button--primary'}`}
              onClick={handleSubmit}
              disabled={disabled || submitting}
            >
              {submitting ? 'Submitting…' : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
