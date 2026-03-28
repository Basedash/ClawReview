import { useMemo, useState } from 'react';

import type { ReviewAction } from '@clawreview/shared';

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
    return selected ? `${selected.label} request` : 'Submit review';
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
    <section className="panel stack-md">
      <div className="stack-xs">
        <div className="section-title">Review</div>
        <div className="muted">
          Approve to continue, comment to request another pass, or reject to
          stop this path.
        </div>
      </div>
      <div className="segmented" role="tablist" aria-label="Review actions">
        {actions.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`segmented__item ${
              draft.action === item.value ? 'segmented__item--active' : ''
            }`}
            aria-pressed={draft.action === item.value}
            onClick={() => onChange({ ...draft, action: item.value })}
            disabled={disabled || submitting}
          >
            {item.label}
          </button>
        ))}
      </div>
      <label className="field">
        <span className="field__label">Reviewer comment</span>
        <textarea
          className="textarea"
          rows={4}
          placeholder="Optional notes for the agent..."
          value={draft.comment}
          onChange={(event) =>
            onChange({ ...draft, comment: event.target.value })
          }
          disabled={disabled || submitting}
        />
      </label>
      <div className="actions-row">
        <button
          type="button"
          className="button button--primary"
          onClick={handleSubmit}
          disabled={disabled || submitting}
        >
          {submitting ? 'Submitting…' : submitLabel}
        </button>
      </div>
    </section>
  );
}
