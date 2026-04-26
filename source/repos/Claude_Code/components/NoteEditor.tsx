'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import { EditorToolbar } from './EditorToolbar';

interface Note {
  id: string;
  title: string;
  contentJson: string;
  isPublic: boolean;
  updatedAt: string;
}

interface NoteEditorProps {
  initialNote: Note;
}

export function NoteEditor({ initialNote }: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialNote.title);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Code,
      CodeBlock,
    ],
    content: JSON.parse(initialNote.contentJson),
    immediatelyRender: false,
  });

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editor) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${initialNote.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title,
          contentJson: editor.getJSON(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving note');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this note? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/${initialNote.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting note');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 transition-colors focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900">
          <EditorToolbar editor={editor} />
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none px-4 py-3 focus:outline-none min-h-96"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Note saved successfully
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </form>
  );
}
