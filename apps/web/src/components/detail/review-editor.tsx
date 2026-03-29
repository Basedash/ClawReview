import { useEffect, useId, useMemo, useRef } from 'react';

import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from '@tiptap/markdown';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

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
  const labelId = useId();
  const hintId = useId();
  const latestMarkdownRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const extensions = useMemo(
    () => [
      StarterKit,
      Markdown.configure({
        markedOptions: {
          gfm: true,
        },
      }),
      Placeholder.configure({
        placeholder:
          'Write inline with markdown shortcuts like #, -, or **bold**.',
      }),
    ],
    [],
  );

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor(
    {
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
    },
    [extensions],
  );

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
    onFocusReady?.(
      editor
        ? () => {
            editor.chain().focus('end').run();
          }
        : null,
    );

    return () => {
      onFocusReady?.(null);
    };
  }, [editor, onFocusReady]);

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
        <span id={labelId} className="field__label">
          Review markdown editor
        </span>
        <div id={hintId} className="editor-hint">
          No toolbar. Use markdown syntax and keyboard shortcuts inline.
        </div>
        <div
          className={`editor-surface${readOnly ? ' editor-surface--readonly' : ''}`}
        >
          <EditorContent editor={editor} />
        </div>
      </label>
    </section>
  );
}
