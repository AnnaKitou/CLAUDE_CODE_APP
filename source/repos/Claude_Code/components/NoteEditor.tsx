'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import { EditorToolbar } from './EditorToolbar';

interface NoteType {
  id: string;
  title: string;
  contentJson: string;
  isPublic: boolean;
  publicSlug: string | null;
  updatedAt: string;
}

interface NoteEditorProps {
  initialNote: NoteType;
}

export function NoteEditor({ initialNote }: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialNote.title);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingShare, setIsTogglingShare] = useState(false);
  const [isPublic, setIsPublic] = useState(initialNote.isPublic);
  const [publicSlug, setPublicSlug] = useState<string | null>(initialNote.publicSlug);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Code,
      CodeBlock,
    ],
    content: JSON.parse(initialNote.contentJson),
    immediatelyRender: false,
  });

  async function handleSave() {
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

      router.refresh();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving note');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleSharing() {
    setIsTogglingShare(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${initialNote.id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isPublic: !isPublic }),
      });

      if (!response.ok) throw new Error('Failed to update sharing');

      const updated = await response.json();
      setIsPublic(updated.isPublic);
      setPublicSlug(updated.publicSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating sharing');
    } finally {
      setIsTogglingShare(false);
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
    <div className="flex flex-col gap-6">
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

      <div className="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 text-sm">Public sharing</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {isPublic ? 'Anyone with the link can view this note.' : 'Only you can see this note.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            aria-label="Public sharing"
            onClick={handleToggleSharing}
            disabled={isTogglingShare}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isPublic ? 'bg-gray-900' : 'bg-gray-200'}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${isPublic ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
        {isPublic && publicSlug && (
          <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
            <span className="text-xs text-gray-600 truncate flex-1">
              {typeof window !== 'undefined' ? `${window.location.origin}/p/${publicSlug}` : `/p/${publicSlug}`}
            </span>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`${window.location.origin}/p/${publicSlug}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  setError('Could not copy link — please copy it manually.');
                }
              }}
              className="text-xs font-medium text-gray-700 hover:text-gray-900 flex-shrink-0"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
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
    </div>
  );
}
