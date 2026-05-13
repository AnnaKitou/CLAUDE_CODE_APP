import { requireAuth } from "@/lib/require-auth";
import { getNoteById } from "@/lib/notes";
import { NoteEditor } from "@/components/NoteEditor";
import { notFound } from "next/navigation";

export default async function NoteEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;

  const note = await getNoteById(session.user.id, id);
  if (!note) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <NoteEditor initialNote={note} />
    </div>
  );
}
