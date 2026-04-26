import { requireAuth } from "@/lib/require-auth";
import NoteForm from "@/components/NoteForm";

export default async function NewNotePage() {
  await requireAuth();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create a new note</h1>
        <p className="mt-2 text-gray-600">Start writing to capture your thoughts</p>
      </div>
      <NoteForm />
    </main>
  );
}
