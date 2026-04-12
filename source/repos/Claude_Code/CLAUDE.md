# CLAUDE.md

We're building the app described in @SPEC.MD. Read that file for general architectural tasks or to double-check the exact structure, tech stack or application architecture.

Keep your replies extremely consise and focus on conveying the key information. No unnecessary fluff, no long code snippets.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev        # Start development server (http://localhost:3000)
bun run build  # Production build
bun run lint   # Run ESLint
```

**Database initialization** (first-time setup):
```bash
bun run scripts/init-db.ts   # Create the notes table and indexes
npx auth@latest migrate      # Create better-auth tables (user, session, account, verification)
```

## Architecture

This is a Next.js App Router note-taking app. The full spec is in `SPEC.MD`.

**Runtime:** Bun (not Node). Use Bun's native SQLite client (`bun:sqlite`) — no ORM.

**Environment variables** (copy `.env.example` → `.env.local`):
- `BETTER_AUTH_SECRET` — must be 32+ chars
- `DB_PATH` — path to SQLite file (default: `data/app.db`)

### Planned structure (not yet implemented — scaffold only)

```
lib/db.ts          # Bun SQLite singleton + query/get/run helpers
lib/notes.ts       # Note repository functions (CRUD + sharing)
lib/auth.ts        # better-auth server instance

app/
  layout.tsx       # Global layout with header + auth controls
  page.tsx         # Landing page
  dashboard/       # Authenticated note list
  notes/[id]/      # Note editor (TipTap)
  p/[slug]/        # Public read-only note view
  (auth)/          # Login + register pages
  api/
    notes/         # REST handlers: GET, POST, PUT, DELETE, share toggle
    public-notes/  # Unauthenticated slug lookup

components/
  NoteList.tsx
  NoteEditor.tsx   # TipTap editor (client component)
  ShareToggle.tsx
  DeleteNoteButton.tsx
  PublicNoteViewer.tsx

scripts/
  init-db.ts       # Creates notes table + indexes
```

### Key patterns

- **Auth:** All `/dashboard` and `/notes/[id]` routes verify session server-side via `auth.api.getSession()`. Return 401 if unauthenticated.
- **Authorization:** Every note SQL query in an auth context must include `WHERE user_id = ?` to enforce ownership.
- **TipTap content:** Stored as `JSON.stringify(editor.getJSON())` in `content_json` (TEXT column). Load with `JSON.parse()`.
- **Public sharing:** Slugs generated with `nanoid()` at 16+ chars. `/p/[slug]` returns 404 when `is_public = 0`.
- **Server vs Client components:** Data fetching in server components; TipTap editor and interactive UI in client components.
