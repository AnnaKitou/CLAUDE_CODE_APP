# Technical Specification – Note Taking Web App

## 1. Overview

A web application where authenticated users can create, view, edit, delete, and publicly share rich-text notes. Notes are created with TipTap, stored as JSON in a SQLite database, and rendered in the browser with formatting.

### Core Features

- User authentication (sign up, login, logout) via better-auth
- Authenticated note management (CRUD)
- Rich text editor using TipTap with:
  - Bold, Italic
  - Heading levels (H1–H3) + normal text
  - Inline code + code blocks
  - Bullet lists
  - Horizontal rules
- Public sharing of notes via a public URL (toggle on/off)

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) |
| Runtime | Bun |
| Language | TypeScript |
| Styling | TailwindCSS |
| Database | SQLite via Bun's native SQLite client (raw SQL) |
| Auth | better-auth |

---

## 2. Architecture

### 2.1 High-Level Architecture

- **Frontend & Backend:** Next.js (App Router)
  - Server components for data fetching
  - Client components for TipTap editor and interactive UI
  - Route Handlers (`app/api/.../route.ts`) for JSON APIs
- **Runtime:** Bun (for dev & production)
- **Database:** Single SQLite file (e.g. `data/app.db`) accessed via Bun's SQLite client
- **Auth:** better-auth integrated into Next.js (middleware + server helpers)

### 2.2 Application Layers

**Presentation layer**
- Next.js pages and components
- TailwindCSS for styling
- TipTap editor component

**API layer**
- REST-like JSON endpoints for notes CRUD & sharing

**Data access layer**
- Raw SQL queries executed via Bun's SQLite client
- A small helper module for DB access

---

## 3. Functional Requirements

### 3.1 Authentication

Users can:
- Register (email + password, minimum validation)
- Log in / log out

Authentication state is accessible on server (for SSR) and on client (for protected UI).

Unauthenticated users:
- Can access public shared note URLs (read-only)
- Cannot access dashboard or personal notes

### 3.2 Notes Management (Authenticated)

**Create a new note:**
- Default title: "Untitled note"
- Default empty TipTap document

**View a list of own notes:**
- Show title, last updated at, shared status

**View a single note:**
- Load editor with stored TipTap JSON document

**Update note:**
- Change title
- Change content (TipTap JSON)
- Auto-update `updated_at`

**Delete note:**
- Hard delete

### 3.3 Note Sharing

Users can toggle note "public sharing":

**When enabled:**
- Note gets a unique public slug (e.g. `abcdef1234`)
- Accessible via `/p/{slug}` for anonymous users

**When disabled:**
- Public URL returns 404 / "Note not found"

**Public page rendering:**
- Reads note from DB by `public_slug`
- Shows title and content in read-only mode
- No editing or owner information necessary

---

## 4. Non-Functional Requirements

| Concern | Requirement |
|---------|-------------|
| Performance | Notes list & note view should load under ~300 ms for typical DB sizes |
| Security | All note operations scoped to authenticated user's `user_id`; public notes are read-only |
| Reliability | Graceful handling of DB errors |
| Maintainability | Type-safe APIs and DB types; modularized DB and auth helpers |
| UX | Simple, minimal UI with keyboard-friendly editor |

---

## 5. Data Model & Database Schema (SQLite)

### 5.1 Tables

#### better-auth Core Tables

better-auth manages its own tables for authentication. These tables are created and maintained by better-auth — use the better-auth CLI (`npx auth@latest migrate`) to generate and apply them. Do **not** create these manually.

**`user`**

```sql
CREATE TABLE user (
  id          TEXT    PRIMARY KEY,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image       TEXT,
  createdAt   TEXT    NOT NULL DEFAULT (datetime('now')),
  updatedAt   TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

| Field | Type | Notes |
|-------|------|-------|
| `id` | TEXT | Primary key |
| `name` | TEXT | Display name |
| `email` | TEXT | Unique; used for login |
| `emailVerified` | INTEGER | `0` or `1` (SQLite boolean) |
| `image` | TEXT | Avatar URL (optional) |
| `createdAt` | TEXT | ISO timestamp |
| `updatedAt` | TEXT | ISO timestamp |

**`session`**

```sql
CREATE TABLE session (
  id          TEXT PRIMARY KEY,
  userId      TEXT NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  expiresAt   TEXT NOT NULL,
  ipAddress   TEXT,
  userAgent   TEXT,
  createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES user(id)
);
```

| Field | Type | Notes |
|-------|------|-------|
| `id` | TEXT | Primary key |
| `userId` | TEXT | FK → `user.id` |
| `token` | TEXT | Unique session token |
| `expiresAt` | TEXT | ISO timestamp |
| `ipAddress` | TEXT | Optional |
| `userAgent` | TEXT | Optional |
| `createdAt` | TEXT | ISO timestamp |
| `updatedAt` | TEXT | ISO timestamp |

**`account`**

```sql
CREATE TABLE account (
  id                     TEXT PRIMARY KEY,
  userId                 TEXT NOT NULL,
  accountId              TEXT NOT NULL,
  providerId             TEXT NOT NULL,
  accessToken            TEXT,
  refreshToken           TEXT,
  accessTokenExpiresAt   TEXT,
  refreshTokenExpiresAt  TEXT,
  scope                  TEXT,
  idToken                TEXT,
  password               TEXT,
  createdAt              TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt              TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES user(id)
);
```

| Field | Type | Notes |
|-------|------|-------|
| `id` | TEXT | Primary key |
| `userId` | TEXT | FK → `user.id` |
| `accountId` | TEXT | Provider's ID for this account; equals `userId` for credential accounts |
| `providerId` | TEXT | e.g. `"credential"`, `"google"`, `"github"` |
| `accessToken` | TEXT | Optional |
| `refreshToken` | TEXT | Optional |
| `accessTokenExpiresAt` | TEXT | Optional |
| `refreshTokenExpiresAt` | TEXT | Optional |
| `scope` | TEXT | Optional |
| `idToken` | TEXT | Optional |
| `password` | TEXT | Hashed password for email/password auth (optional) |
| `createdAt` | TEXT | ISO timestamp |
| `updatedAt` | TEXT | ISO timestamp |

**`verification`**

```sql
CREATE TABLE verification (
  id          TEXT PRIMARY KEY,
  identifier  TEXT NOT NULL,
  value       TEXT NOT NULL,
  expiresAt   TEXT NOT NULL,
  createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
);
```

| Field | Type | Notes |
|-------|------|-------|
| `id` | TEXT | Primary key |
| `identifier` | TEXT | Identifies what is being verified |
| `value` | TEXT | The value to verify |
| `expiresAt` | TEXT | ISO timestamp |
| `createdAt` | TEXT | ISO timestamp |
| `updatedAt` | TEXT | ISO timestamp |

#### `notes`

Application-managed table. Created via `scripts/init-db.ts`.

```sql
CREATE TABLE notes (
  id           TEXT    PRIMARY KEY,
  user_id      TEXT    NOT NULL,
  title        TEXT    NOT NULL,
  content_json TEXT    NOT NULL,
  is_public    INTEGER NOT NULL DEFAULT 0,
  public_slug  TEXT    UNIQUE,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES user(id)
);
```

| Field | Type | Notes |
|-------|------|-------|
| `id` | TEXT | Primary key |
| `user_id` | TEXT | FK → `user.id` |
| `title` | TEXT | Note title |
| `content_json` | TEXT | Stringified TipTap JSON document |
| `is_public` | INTEGER | `0` or `1` |
| `public_slug` | TEXT | Unique slug for public URL (nullable) |
| `created_at` | TEXT | ISO timestamp |
| `updated_at` | TEXT | ISO timestamp |

### 5.2 Indexes

```sql
CREATE INDEX idx_notes_user_id    ON notes(user_id);
CREATE INDEX idx_notes_public_slug ON notes(public_slug);
CREATE INDEX idx_notes_is_public  ON notes(is_public);
```

---

## 6. Backend: DB & API Layer

### 6.1 Database Access Module

**File:** `lib/db.ts`

- Initialize Bun SQLite client with DB file (`app.db`)
- Export helper functions:
  - `getDb()` – returns singleton DB connection
  - `query<T>(sql, params?): T[]`
  - `get<T>(sql, params?): T | undefined`
  - `run(sql, params?)`

### 6.2 Note Repository

**File:** `lib/notes.ts`

**TypeScript type:**

```typescript
export type Note = {
  id: string;
  userId: string;
  title: string;
  contentJson: string; // stringified TipTap JSON
  isPublic: boolean;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
};
```

**Repository functions:**

| Function | Description |
|----------|-------------|
| `createNote(userId, data)` | Create note with optional title/content defaults |
| `getNoteById(userId, noteId)` | Get single note scoped to user |
| `getNotesByUser(userId)` | List all notes for user |
| `updateNote(userId, noteId, data)` | Update title and/or content |
| `deleteNote(userId, noteId)` | Hard delete |
| `setNotePublic(userId, noteId, isPublic)` | Toggle sharing; generate/clear slug |
| `getNoteByPublicSlug(slug)` | Read public note (no user scope) |

All functions that operate on owned notes enforce `user_id = ?` in SQL to prevent cross-user access.

---

## 7. API Design (Next.js Route Handlers)

Base path: `/api/notes`

### 7.1 Authentication

All `/api/notes` handlers must:
- Verify the session via better-auth's server helper (e.g. `auth.api.getSession()`)
- Return `401` if unauthenticated

### 7.2 Endpoints

#### `GET /api/notes`

List notes for the current user. Omits `contentJson` for performance.

**Response `200`:**
```json
[
  {
    "id": "note-id",
    "title": "My Note",
    "isPublic": true,
    "updatedAt": "2025-01-01T12:00:00Z"
  }
]
```

#### `POST /api/notes`

Create a new note.

**Request body:**
```json
{
  "title": "Optional title",
  "contentJson": { "type": "doc", "content": [] }
}
```

Defaults: title → `"Untitled note"`, content → empty TipTap document.

**Response `201`:** created `Note`

#### `GET /api/notes/:id`

Get single note owned by current user.

- `200` with full note including `contentJson`
- `404` if not found or not owned

#### `PUT /api/notes/:id`

Update note title and/or content.

**Request body:**
```json
{
  "title": "New title",
  "contentJson": { "type": "doc", "content": [] }
}
```

- `200` with updated note
- `404` if not found

#### `DELETE /api/notes/:id`

Delete note.

- `204` on success
- `404` if not found

#### `POST /api/notes/:id/share`

Toggle public sharing.

**Request body:**
```json
{ "isPublic": true }
```

**Behavior:**
- `isPublic: true` + no existing slug → generate slug via `nanoid()` (16+ chars)
- `isPublic: false` → set `is_public = 0`, `public_slug = NULL`

**Response `200`:**
```json
{
  "id": "note-id",
  "isPublic": true,
  "publicSlug": "abcdef1234567890"
}
```

### 7.3 Public Note Endpoint

#### `GET /api/public-notes/:slug`

Read-only; no authentication required.

**Response `200`:**
```json
{
  "title": "Public note",
  "contentJson": { "type": "doc", "content": [] }
}
```

- `404` if slug not found or `is_public = 0`

> Alternatively, resolve the note directly in the `/p/[slug]` server component and skip this endpoint.

---

## 8. Frontend – Pages & Components

### 8.1 Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with login/sign-up CTA |
| `/dashboard` | Authenticated note list + "Create note" button |
| `/notes/[id]` | Note editor (TipTap, title, share toggle, delete) |
| `/p/[slug]` | Public read-only note view |

### 8.2 Layout & Navigation

- `app/layout.tsx` – global layout with header (app name, auth controls, theme toggle)
- `app/(auth)/login` and `app/(auth)/register` – auth pages (if better-auth doesn't provide its own UI)

### 8.3 Components

| Component | Props / Role |
|-----------|-------------|
| `NoteList.tsx` | `notes: { id, title, updatedAt, isPublic }[]`; renders links to `/notes/[id]` |
| `NoteEditor.tsx` | TipTap editor; calls `onChange` with updated JSON |
| `ShareToggle.tsx` | Switch for `isPublic`; shows public URL when enabled |
| `DeleteNoteButton.tsx` | Confirms and calls `DELETE /api/notes/:id` |
| `PublicNoteViewer.tsx` | Renders TipTap content with `editable: false` |

---

## 9. TipTap Integration

### 9.1 Extensions

```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';

const editor = useEditor({
  extensions: [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    Code,
    CodeBlock,
  ],
  content: initialContentJson,
  onUpdate: ({ editor }) => onChange(editor.getJSON()),
});
```

Content is stored as `JSON.stringify(json)` and loaded with `JSON.parse(contentJson)`.

### 9.2 Toolbar

Each button calls the corresponding TipTap chain (e.g. `editor.chain().focus().toggleBold().run()`).

| Button | Action |
|--------|--------|
| Bold | `toggleBold` |
| Italic | `toggleItalic` |
| H1 / H2 / H3 | `toggleHeading({ level })` |
| Paragraph | `setParagraph` |
| Bullet list | `toggleBulletList` |
| Inline code | `toggleCode` |
| Code block | `toggleCodeBlock` |
| Horizontal rule | `setHorizontalRule` |

---

## 10. Styling (TailwindCSS)

- Configure Tailwind in `tailwind.config.ts`
- Minimal design: neutral background, card-like note container, utility classes throughout
- Use `@tailwindcss/typography` (`prose` classes) for read-only note rendering

---

## 11. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Auth enforcement | All `/dashboard` and `/notes/[id]` routes verify session server-side |
| Authorization | Every note query in auth context filters by `user_id` |
| Public slugs | Generated with `nanoid()` at 16+ characters to prevent enumeration |
| XSS | Primary data is TipTap JSON, not raw HTML; rendered only through TipTap's own renderer |
| Rate limiting | Optional enhancement: per-IP or per-user limits on API routes |

---

## 12. Development Workflow

1. Initialize Next.js app with Bun & TypeScript
2. Set up TailwindCSS and `@tailwindcss/typography`
3. Integrate better-auth and run `npx auth@latest migrate` to create auth tables
4. Implement SQLite DB initialization for the `notes` table (`scripts/init-db.ts`)
5. Build DB helpers (`lib/db.ts`) and note repository (`lib/notes.ts`)
6. Implement `/api/notes` and sharing API routes
7. Build dashboard and note editor pages
8. Integrate TipTap editor and toolbar
9. Implement public note pages (`/p/[slug]`)
10. Add polish: loading states, toast messages, error handling
