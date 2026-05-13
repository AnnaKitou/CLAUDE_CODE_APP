# Code Review Report – NextNotes App

**Date:** 2026-05-13  
**Mode:** General (Thorough Review)

---

## Executive Summary

The project is a Next.js note-taking application using Bun, SQLite, TipTap, and better-auth. The architecture is sound, but there are **critical implementation gaps** and several **bugs** that prevent the app from functioning correctly. Key blockers include incomplete repository functions, missing API endpoints, and a placeholder public note page.

---

## Critical Issues

### 1. **Database Parameter Binding Error** – `lib/db.ts`

**Severity:** HIGH  
**Location:** `lib/db.ts` lines 38–48

The Bun SQLite API expects spread parameters, not an array:

```typescript
// WRONG: ❌
export function query<T>(sql: string, params: SQLQueryBindings[] = []): T[] {
  return getDb().query<T, SQLQueryBindings[]>(sql).all(...params);
}

// CORRECT: ✅
export function query<T>(sql: string, params: SQLQueryBindings[] = []): T[] {
  return getDb().query<T>(sql).all(...params);
}
```

**Impact:** All database queries will fail. `getDb().query<T, SQLQueryBindings[]>()` is incorrect syntax.

**Fix:** Remove the generic type parameter from `.query()`.

---

### 2. **Incomplete `lib/notes.ts`** – Missing Core Functions

**Severity:** CRITICAL  
**Location:** `lib/notes.ts` (86 lines, stops abruptly)

The following functions from SPEC.MD are **missing entirely:**
- `getNotesByUser(userId)` – required by GET /api/notes
- `setNotePublic(userId, noteId, isPublic)` – required by sharing feature
- `getNoteByPublicSlug(slug)` – required by /p/[slug]

**Impact:** 
- Dashboard cannot list notes (no GET /api/notes handler)
- Note sharing is impossible
- Public note pages cannot be rendered

**Fix:** Implement all three functions following the spec.

---

### 3. **Wrong Type Assertion** – `lib/notes.ts` line 48

**Severity:** MEDIUM  
**Location:** `lib/notes.ts:48`

```typescript
is_public: 0 | 1,  // ❌ Type union, not value
```

Should be:
```typescript
is_public: 0,  // ✅ Default value
```

**Impact:** Type confusion; all new notes created will have ambiguous `is_public` state.

---

### 4. **Placeholder Public Note Page** – `app/p/[slug]/page.tsx`

**Severity:** CRITICAL  
**Location:** `app/p/[slug]/page.tsx` (2 lines)

```typescript
export default function PublicNotePage() {
  return <p>Public note page</p>;
}
```

**Missing:**
- Query note by public_slug from database
- Check is_public = 1
- Render note title and TipTap content
- Handle 404 for unpublished/missing notes

**Impact:** Public sharing feature is non-functional.

---

### 5. **Missing Sharing API Endpoint** – `POST /api/notes/:id/share`

**Severity:** CRITICAL  
**Location:** N/A (not implemented)

The SPEC.MD requires a `POST /api/notes/:id/share` endpoint to toggle public sharing and generate slugs. This route handler is **completely missing**.

**Impact:** Users cannot share notes publicly; no way to toggle `is_public` or generate/clear `public_slug`.

---

### 6. **Incomplete Dashboard** – `app/dashboard/page.tsx`

**Severity:** HIGH  
**Location:** `app/dashboard/page.tsx` (23 lines)

The page only renders a header and greeting. **Missing:**
- Fetch and display user's notes list
- Call `GET /api/notes` (which itself is missing)
- Render note cards with title, last-updated, share status
- "Create note" button exists but no note list

**Impact:** Users see an empty dashboard with no way to view existing notes.

---

### 7. **Missing `GET /api/notes` Handler** – List Notes

**Severity:** CRITICAL  
**Location:** `app/api/notes/route.ts` (only has POST)

Only POST is implemented. The GET handler to list authenticated user's notes is missing. This is required by:
- Dashboard page
- SPEC.MD section 7.2

**Impact:** Dashboard cannot load note list; violates spec requirement.

---

## High-Priority Issues

### 8. **Incomplete Auth Configuration** – `lib/auth.ts`

**Severity:** MEDIUM  
**Location:** `lib/auth.ts:7`

```typescript
secret: process.env.BETTER_AUTH_SECRET,
```

**Issues:**
- No validation that secret is 32+ characters (as required by better-auth)
- No fallback for development (should generate one if missing)
- No warning if secret is too short

**Fix:** Add validation:
```typescript
const secret = process.env.BETTER_AUTH_SECRET || '';
if (secret.length < 32) {
  throw new Error('BETTER_AUTH_SECRET must be 32+ characters');
}
```

---

### 9. **Type Mismatch: snake_case vs camelCase** – `lib/notes.ts`

**Severity:** MEDIUM  
**Location:** `lib/notes.ts:4–13`

SPEC.MD defines the Note type with camelCase (e.g., `userId`, `contentJson`, `isPublic`), but the implementation uses snake_case:

```typescript
export type Note = {
  id: string;
  user_id: string;        // ❌ Should be userId (camelCase)
  title: string;
  content_json: string;   // ❌ Should be contentJson
  is_public: number;      // ❌ Should be isPublic (boolean)
  public_slug: string | null;  // ❌ Should be publicSlug
  created_at: string;     // ❌ Should be createdAt
  updated_at: string;     // ❌ Should be updatedAt
};
```

**Impact:** 
- Inconsistency with spec
- API responses use snake_case, confusing clients expecting camelCase
- Mismatch between DB schema (snake_case) and TypeScript naming conventions (camelCase)

**Fix:** Either:
1. Standardize on camelCase for TypeScript types (add mapping layer in API responses), or
2. Update SPEC.MD to match implementation

Recommended: Use camelCase in types, map to/from DB snake_case.

---

### 10. **Unused Import** – `app/layout.tsx:7`

**Severity:** LOW  
**Location:** `app/layout.tsx:7`

```typescript
import { unstable_noStore } from "next/cache";
```

Imported but never used. Remove if not needed for caching strategy.

---

### 11. **Missing Input Validation** – Route Handlers

**Severity:** MEDIUM  
**Locations:** `app/api/notes/route.ts`, `app/api/notes/[id]/route.ts`

**Issues:**
- No validation of request body shape
- `createNote` accepts undefined title/contentJson without checking
- No max length limits on title or content
- No validation of note ID format

**Fix:** Add Zod schema validation (already in dependencies):

```typescript
import { z } from 'zod';

const CreateNoteSchema = z.object({
  title: z.string().max(255).optional(),
  contentJson: z.object({}).passthrough().optional(),
});

const body = CreateNoteSchema.parse(await request.json());
```

---

## Medium-Priority Issues

### 12. **Missing Error Handling for Database Errors**

**Severity:** MEDIUM  
**Locations:** Multiple route handlers

Database errors (unique constraint violations, foreign key errors) are caught generically:

```typescript
catch (error) {
  console.error("Error creating note:", error);
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
  });
}
```

**Impact:** Difficult to debug; users get generic error messages.

**Fix:** Parse specific error codes:
```typescript
if (error instanceof Error) {
  if (error.message.includes('UNIQUE constraint')) {
    return new Response(JSON.stringify({ error: "Note slug already in use" }), {
      status: 409,
    });
  }
}
```

---

### 13. **Missing Public Slug Generation Logic**

**Severity:** HIGH  
**Location:** Missing from `lib/notes.ts`

The `setNotePublic` function should:
- Generate a 16+ char nanoid slug if `isPublic = true` and slug is null
- Return the slug to the client
- Clear slug if `isPublic = false`

**Current state:** Not implemented; no way to generate or manage slugs.

---

### 14. **Insecure Query in `getNoteById`** – Potential N+1

**Severity:** LOW  
**Location:** `lib/notes.ts:55–61`

The function uses `??` to coerce undefined to null, which is safe but verbose:

```typescript
return note ?? null;
```

This is fine, but repeated `.get()` patterns could be optimized. Not critical for small apps.

---

### 15. **Missing NotFound Handling** – `app/notes/[id]/page.tsx`

**Severity:** LOW  
**Location:** `app/notes/[id]/page.tsx:15`

Uses `notFound()` correctly, but doesn't catch potential database errors. The `getNoteById` function might throw.

---

## Low-Priority Issues

### 16. **No Pagination/Limits on List Endpoints**

**Severity:** LOW  
**Location:** `lib/notes.ts` (when `getNotesByUser` is implemented)

Large accounts (1000+ notes) would load all notes at once. Add LIMIT/OFFSET:

```typescript
export async function getNotesByUser(
  userId: string,
  limit = 50,
  offset = 0
): Promise<Note[]> {
  return query<Note>(
    `SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
}
```

---

### 17. **No Loading States on Dashboard**

**Severity:** LOW  
**Location:** `app/dashboard/page.tsx`

When the page is loading, users see a blank screen. Consider adding a Suspense boundary:

```tsx
<Suspense fallback={<NoteListSkeleton />}>
  <NoteList />
</Suspense>
```

---

### 18. **TipTap Content Rendering Safety**

**Severity:** LOW  
**Location:** `components/NoteEditor.tsx:36`, public note viewer

TipTap's `useEditor` with `editable: false` and proper extension configuration is safe, but verify:
- No custom extensions that bypass XSS protection
- All user content flows through TipTap's renderer (not direct innerHTML)

Current implementation looks safe ✓

---

### 19. **Session Not Re-Validated on Each Request** 

**Severity:** LOW  
**Location:** All route handlers

Each handler calls `auth.api.getSession()` which is good, but consider:
- Add a middleware or wrapper to DRY this up
- Consider storing session in a context/hook to avoid repeated calls

---

### 20. **Missing Environment Variable Documentation**

**Severity:** LOW  
**Location:** `.env.example`

`.env.example` exists but should document all required variables:
- `BETTER_AUTH_SECRET` (32+ chars)
- `DB_PATH` (optional, defaults to `data/app.db`)
- `BETTER_AUTH_URL` (optional, defaults to `http://localhost:3000`)

---

## Summary by Category

| Category | Count | Severity |
|----------|-------|----------|
| **Critical** | 5 | Blocks core functionality |
| **High** | 4 | Breaks features |
| **Medium** | 6 | Quality/security concerns |
| **Low** | 5 | Polish/optimization |
| **Total** | 20 | — |

---

## Blocking Work Items

**Before the app can function, these must be fixed:**

1. ✗ Fix database parameter binding in `lib/db.ts`
2. ✗ Implement `getNotesByUser`, `setNotePublic`, `getNoteByPublicSlug` in `lib/notes.ts`
3. ✗ Implement public note page (`app/p/[slug]/page.tsx`)
4. ✗ Implement sharing endpoint (`POST /api/notes/:id/share`)
5. ✗ Implement GET handler in `/api/notes` (list notes)
6. ✗ Complete dashboard to display note list
7. ✗ Fix `is_public` type assertion on line 48
8. ✗ Standardize types (camelCase vs snake_case)

---

## Code Quality Observations

### Positive Aspects ✓
- Clean component structure and separation of concerns
- Proper use of TypeScript strict mode
- Good accessibility attributes (aria-busy, role="alert")
- Proper auth scoping (WHERE user_id = ?)
- Consistent styling with Tailwind
- Good error messaging in UI

### Areas for Improvement
- No API request/response validation (use Zod)
- Limited error categorization
- No rate limiting
- No loading skeletons
- No optimistic updates

---

## Recommendations

1. **Immediate:** Fix critical bugs (database binding, missing functions, incomplete pages)
2. **Short-term:** Add request validation and error handling
3. **Medium-term:** Implement pagination, loading states, and polish UX
4. **Long-term:** Add tests, monitoring, and rate limiting

---

## Testing Notes

The following should be tested once implementation is complete:
- [ ] User can create, read, update, delete notes
- [ ] User cannot access other users' notes
- [ ] Public slug generation and access
- [ ] Note sharing toggle correctly updates database
- [ ] Public note page shows correct title/content
- [ ] TipTap editor preserves formatting
- [ ] Error messages display correctly
- [ ] Auth redirects work properly
