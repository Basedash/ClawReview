import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from '@tiptap/markdown';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useId, useMemo, useRef } from 'react';
function SaveIndicator({ state }) {
    if (state === 'idle')
        return null;
    const label = state === 'saving' ? 'Saving' : state === 'error' ? 'Save failed' : 'Saved';
    return (_jsxs("span", { className: `save-indicator${state === 'saving' ? ' save-indicator--saving' : ''}${state === 'error' ? ' save-indicator--error' : ''}`, children: [_jsx("span", { className: "save-indicator__dot" }), label] }));
}
export function ReviewEditor({ value, readOnly, saveState, onChange, onFocusReady, }) {
    const labelId = useId();
    const latestMarkdownRef = useRef(value);
    const onChangeRef = useRef(onChange);
    const extensions = useMemo(() => [
        StarterKit,
        Markdown.configure({
            markedOptions: {
                gfm: true,
            },
        }),
        Placeholder.configure({
            placeholder: 'Write with markdown shortcuts — #, -, **bold**, etc.',
        }),
    ], []);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);
    const editor = useEditor({
        immediatelyRender: false,
        extensions,
        content: value,
        contentType: 'markdown',
        editable: !readOnly,
        editorProps: {
            attributes: {
                class: 'editor-surface__content',
                role: 'textbox',
                'aria-multiline': 'true',
                'aria-label': 'Review markdown editor',
            },
        },
        onUpdate: ({ editor: currentEditor }) => {
            const nextMarkdown = currentEditor.getMarkdown();
            if (nextMarkdown === latestMarkdownRef.current) {
                return;
            }
            latestMarkdownRef.current = nextMarkdown;
            onChangeRef.current(nextMarkdown);
        },
    }, [extensions]);
    useEffect(() => {
        if (!editor) {
            return;
        }
        editor.setEditable(!readOnly);
    }, [editor, readOnly]);
    useEffect(() => {
        if (!editor) {
            return;
        }
        const currentMarkdown = editor.getMarkdown();
        if (currentMarkdown === value) {
            latestMarkdownRef.current = value;
            return;
        }
        latestMarkdownRef.current = value;
        editor.commands.setContent(value, { contentType: 'markdown' });
    }, [editor, value]);
    useEffect(() => {
        onFocusReady?.(editor
            ? () => {
                editor.chain().focus('end').run();
            }
            : null);
        return () => {
            onFocusReady?.(null);
        };
    }, [editor, onFocusReady]);
    return (_jsxs("div", { className: "card", children: [_jsxs("div", { className: "card__header", children: [_jsx("span", { id: labelId, className: "card__title", children: "Content" }), _jsx(SaveIndicator, { state: saveState })] }), _jsx("div", { className: "card__body", style: { padding: 0 }, children: _jsx("div", { className: `editor-surface${readOnly ? ' editor-surface--readonly' : ''}`, style: { border: 'none', borderRadius: 0 }, children: _jsx(EditorContent, { editor: editor }) }) })] }));
}
