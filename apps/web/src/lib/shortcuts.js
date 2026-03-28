export const shortcutDefinitions = [
    { keys: 'j / k', description: 'Move selection down or up' },
    { keys: 'Enter', description: 'Open selected request' },
    { keys: '/', description: 'Focus search' },
    { keys: 'e', description: 'Focus editor' },
    { keys: 'a', description: 'Select approve action' },
    { keys: 'c', description: 'Select comment action' },
    { keys: 'r', description: 'Select reject action' },
    { keys: 'Ctrl/Cmd + Enter', description: 'Submit review' },
    { keys: 'g o', description: 'Filter open requests' },
    { keys: 'g a', description: 'Filter all requests' },
    { keys: '[ / ]', description: 'Previous or next request' },
    { keys: '?', description: 'Toggle shortcut help' },
];
export function getShortcutEntries() {
    return shortcutDefinitions;
}
export function isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }
    const tagName = target.tagName.toLowerCase();
    return (target.isContentEditable ||
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select');
}
