import type { ShortcutDefinition } from '../../lib/shortcuts.js';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  shortcuts: ShortcutDefinition[];
  onClose: () => void;
}

export function KeyboardShortcutsDialog({
  open,
  shortcuts,
  onClose,
}: KeyboardShortcutsDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="modal">
        <div className="modal__header">
          <h2>Keyboard shortcuts</h2>
          <button
            className="modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="shortcut-list">
          {shortcuts.map((shortcut) => (
            <div className="shortcut-row" key={shortcut.keys}>
              <span>{shortcut.description}</span>
              <kbd>{shortcut.keys}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
