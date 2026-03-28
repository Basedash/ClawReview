interface ReviewEditorProps {
  value: string;
  readOnly: boolean;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  onChange: (value: string) => void;
  onFocusReady?: (focus: (() => void) | null) => void;
}

export function ReviewEditor({
  value,
  readOnly,
  saveState,
  onChange,
  onFocusReady,
}: ReviewEditorProps) {
  return (
    <section className="panel stack-md">
      <div className="section-heading">
        <h2>Review content</h2>
        <span>
          {saveState === 'saving'
            ? 'Saving…'
            : saveState === 'error'
              ? 'Save failed'
              : 'Saved'}
        </span>
      </div>
      <label className="field">
        <span className="field__label">Review markdown editor</span>
        <textarea
          className="textarea editor-textarea"
          rows={14}
          aria-label="Review markdown editor"
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange(event.target.value)}
          ref={(element) => {
            onFocusReady?.(
              element
                ? () => {
                    element.focus();
                    element.setSelectionRange(
                      element.value.length,
                      element.value.length,
                    );
                  }
                : null,
            );
          }}
        />
      </label>
    </section>
  );
}
