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

  const dbNote = await getNoteById(session.user.id, id);
  if (!dbNote) {
    notFound();
  }

  const note = {
    id: dbNote.id,
    title: dbNote.title,
    contentJson: dbNote.content_json,
    isPublic: dbNote.is_public === 1,
    updatedAt: dbNote.updated_at,
  };

  return (
    <div className="max-w-3xl">
      <NoteEditor initialNote={note} />
    </div>
  );
}
