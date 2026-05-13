import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/require-auth";
import { getNoteById } from "@/lib/notes";
import { RenderTiptapContent } from "@/components/RenderTiptapContent";
import { formatRelativeTime } from "@/lib/format";

export default async function NoteViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAuth();
  const note = await getNoteById(session.user.id, id);

  if (!note) {
    notFound();
  }

  const contentJson = typeof note.contentJson === "string" ? JSON.parse(note.contentJson) : note.contentJson;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
        ← Back to Dashboard
      </Link>

      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-4xl font-bold text-gray-900">{note.title}</h1>
          <Link
            href={`/notes/${note.id}`}
            className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700"
          >
            Edit
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Updated {formatRelativeTime(note.updatedAt)}</span>
          {note.isPublic && (
            <>
              <span>•</span>
              <span className="inline-block bg-green-100 text-green-800 font-semibold px-2.5 py-0.5 rounded">Public</span>
            </>
          )}
        </div>
      </div>

      <div className="prose prose-sm max-w-none">
        <RenderTiptapContent content={contentJson} />
      </div>
    </main>
  );
}
