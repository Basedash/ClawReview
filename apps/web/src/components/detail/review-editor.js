import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef } from 'react';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from '@tiptap/markdown';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
export function ReviewEditor({ value, readOnly, saveState, onChange, onFocusReady, }) {
    const labelId = useId();
    const hintId = useId();
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
            placeholder: 'Write inline with markdown shortcuts like #, -, or **bold**.',
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
                'aria-labelledby': labelId,
                'aria-describedby': hintId,
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
    return (_jsxs("section", { className: "panel stack-md", children: [_jsxs("div", { className: "section-heading", children: [_jsx("h2", { children: "Review content" }), _jsx("span", { children: saveState === 'saving'
                            ? 'Saving…'
                            : saveState === 'error'
                                ? 'Save failed'
                                : 'Saved' })] }), _jsxs("label", { className: "field", children: [_jsx("span", { id: labelId, className: "field__label", children: "Review markdown editor" }), _jsx("div", { id: hintId, className: "editor-hint", children: "No toolbar. Use markdown syntax and keyboard shortcuts inline." }), _jsx("div", { className: `editor-surface${readOnly ? ' editor-surface--readonly' : ''}`, children: _jsx(EditorContent, { editor: editor }) })] })] }));
}
