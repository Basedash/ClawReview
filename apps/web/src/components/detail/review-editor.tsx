import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from '@tiptap/markdown';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useId, useMemo, useRef } from 'react';

interface ReviewEditorProps {
  value: string;
  readOnly: boolean;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  onChange: (value: string) => void;
  onFocusReady?: (focus: (() => void) | null) => void;
}

function SaveIndicator({ state }: { state: ReviewEditorProps['saveState'] }) {
  if (state === 'idle') return null;

  const label =
    state === 'saving' ? 'Saving' : state === 'error' ? 'Save failed' : 'Saved';

  return (
    <span
      className={`save-indicator${state === 'saving' ? ' save-indicator--saving' : ''}${state === 'error' ? ' save-indicator--error' : ''}`}
    >
      <span className="save-indicator__dot" />
      {label}
    </span>
  );
}

export function ReviewEditor({
  value,
  readOnly,
  saveState,
  onChange,
  onFocusReady,
}: ReviewEditorProps) {
  const labelId = useId();
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
        placeholder: 'Write with markdown shortcuts — #, -, **bold**, etc.',
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
    <div className="card">
      <div className="card__header">
        <span id={labelId} className="card__title">
          Content
        </span>
        <SaveIndicator state={saveState} />
      </div>
      <div className="card__body" style={{ padding: 0 }}>
        <div
          className={`editor-surface${readOnly ? ' editor-surface--readonly' : ''}`}
          style={{ border: 'none', borderRadius: 0 }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
