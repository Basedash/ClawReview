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
    >
      <div className="modal">
        <div className="modal-header">
          <h2>Keyboard shortcuts</h2>
          <button className="ghost-button" type="button" onClick={onClose}>
            Close
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
