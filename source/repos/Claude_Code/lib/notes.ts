import { nanoid } from "nanoid";
import { getDb, get, run, query } from "./db";

type DbNote = {
  id: string;
  user_id: string;
  title: string;
  content_json: string;
  is_public: number;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  userId: string;
  title: string;
  contentJson: string;
  isPublic: boolean;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

function dbNoteToNote(dbNote: DbNote): Note {
  return {
    id: dbNote.id,
    userId: dbNote.user_id,
    title: dbNote.title,
    contentJson: dbNote.content_json,
    isPublic: dbNote.is_public === 1,
    publicSlug: dbNote.public_slug,
    createdAt: dbNote.created_at,
    updatedAt: dbNote.updated_at,
  };
}

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
    userId,
    title: finalTitle,
    contentJson: JSON.stringify(finalContent),
    isPublic: false,
    publicSlug: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getNoteById(userId: string, noteId: string): Promise<Note | null> {
  const dbNote = get<DbNote>(
    `SELECT * FROM notes WHERE id = ? AND user_id = ?`,
    [noteId, userId]
  );
  return dbNote ? dbNoteToNote(dbNote) : null;
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

export async function getNotesByUser(userId: string): Promise<Note[]> {
  const dbNotes = query<DbNote>(
    `SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC`,
    [userId]
  );
  return dbNotes.map(dbNoteToNote);
}

export async function setNotePublic(
  userId: string,
  noteId: string,
  isPublic: boolean
): Promise<Note | null> {
  if (isPublic) {
    const slug = nanoid(16);
    const now = new Date().toISOString();
    run(
      `UPDATE notes SET is_public = ?, public_slug = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
      [1, slug, now, noteId, userId]
    );
  } else {
    const now = new Date().toISOString();
    run(
      `UPDATE notes SET is_public = ?, public_slug = NULL, updated_at = ? WHERE id = ? AND user_id = ?`,
      [0, now, noteId, userId]
    );
  }
  return getNoteById(userId, noteId);
}

export async function getNoteByPublicSlug(slug: string): Promise<Note | null> {
  const dbNote = get<DbNote>(
    `SELECT * FROM notes WHERE public_slug = ? AND is_public = 1`,
    [slug]
  );
  return dbNote ? dbNoteToNote(dbNote) : null;
}

export async function deleteNote(userId: string, noteId: string): Promise<boolean> {
  run(
    `DELETE FROM notes WHERE id = ? AND user_id = ?`,
    [noteId, userId]
  );
  return true;
}
