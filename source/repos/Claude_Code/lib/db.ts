import { Database, type SQLQueryBindings } from "bun:sqlite";
import { mkdirSync } from "fs";
import { dirname } from "path";

const DB_PATH = process.env.DB_PATH ?? "data/app.db";

let _db: Database | null = null;

export function getDb(): Database {
  if (!_db) {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    _db = new Database(DB_PATH, { create: true });
    _db.run("PRAGMA journal_mode = WAL;");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id           TEXT    PRIMARY KEY,
      user_id      TEXT    NOT NULL,
      title        TEXT    NOT NULL,
      content_json TEXT    NOT NULL,
      is_public    INTEGER NOT NULL DEFAULT 0,
      public_slug  TEXT    UNIQUE,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES user(id)
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_notes_user_id     ON notes(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_notes_public_slug ON notes(public_slug)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_notes_is_public   ON notes(is_public)`);
}

export function query<T>(sql: string, params: SQLQueryBindings[] = []): T[] {
  return getDb().query<T, SQLQueryBindings[]>(sql).all(...params);
}

export function get<T>(sql: string, params: SQLQueryBindings[] = []): T | undefined {
  return getDb().query<T, SQLQueryBindings[]>(sql).get(...params) ?? undefined;
}

export function run(sql: string, params: SQLQueryBindings[] = []): void {
  getDb().query(sql).run(...params);
}
