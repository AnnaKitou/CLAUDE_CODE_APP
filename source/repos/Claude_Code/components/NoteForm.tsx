"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";
import { EditorToolbar } from "./EditorToolbar";

export default function NoteForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Code,
      CodeBlock,
    ],
    content: "<p></p>",
    immediatelyRender: false,
  });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editor) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title || undefined,
          contentJson: editor.getJSON(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create note");
      }

      const { id } = await response.json();
      router.push(`/notes/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating note");
    } finally {
      setIsSubmitting(false);
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
          placeholder="Untitled note"
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
            className="prose prose-sm max-w-none px-4 py-3 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Creating..." : "Create Note"}
      </button>
    </form>
  );
}
