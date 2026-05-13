import Link from "next/link";
import { requireAuth } from "@/lib/require-auth";
import { getNotesByUser } from "@/lib/notes";
import { NoteCard } from "@/components/NoteCard";

export default async function DashboardPage() {
  const session = await requireAuth();
  const notes = await getNotesByUser(session.user.id);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
          <p className="mt-2 text-gray-600">Welcome, {session.user.email}</p>
        </div>
        <Link
          href="/notes/new"
          className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700 shrink-0"
        >
          New Note
        </Link>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No notes yet. Create your first note to get started.</p>
          <Link
            href="/notes/new"
            className="inline-block rounded-lg bg-gray-900 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700"
          >
            Create First Note
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </main>
  );
}
