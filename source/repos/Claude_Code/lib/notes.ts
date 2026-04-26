import { nanoid } from "nanoid";
import { getDb, get, run } from "./db";

export type Note = {
  id: string;
  user_id: string;
  title: string;
  content_json: string;
  is_public: number;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
};

const EMPTY_TIPTAP_DOC = { type: "doc", content: [] };
const DEFAULT_TITLE = "Untitled note";

export async function createNote(
  userId: string,
  title?: string,
  contentJson?: Record<string, unknown>
): Promise<Note> {
  const db = getDb();
  const id = nanoid();
  const now = new Date().toISOString();
  const finalTitle = title || DEFAULT_TITLE;
  const finalContent = contentJson || EMPTY_TIPTAP_DOC;

  db.run(
    `INSERT INTO notes (id, user_id, title, content_json, is_public, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      finalTitle,
      JSON.stringify(finalContent),
      0,
      now,
      now,
    ]
  );

  return {
    id,
    user_id: userId,
    title: finalTitle,
    content_json: JSON.stringify(finalContent),
    is_public: 0,
    public_slug: null,
    created_at: now,
    updated_at: now,
  };
}

export async function getNoteById(userId: string, noteId: string): Promise<Note | null> {
  const note = get<Note>(
    `SELECT * FROM notes WHERE id = ? AND user_id = ?`,
    [noteId, userId]
  );
  return note ?? null;
}

export async function updateNote(
  userId: string,
  noteId: string,
  title: string,
  contentJson: Record<string, unknown>
): Promise<Note | null> {
  const now = new Date().toISOString();

  run(
    `UPDATE notes SET title = ?, content_json = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
    [title, JSON.stringify(contentJson), now, noteId, userId]
  );

  return getNoteById(userId, noteId);
}

export async function deleteNote(userId: string, noteId: string): Promise<boolean> {
  run(
    `DELETE FROM notes WHERE id = ? AND user_id = ?`,
    [noteId, userId]
  );
  return true;
}
