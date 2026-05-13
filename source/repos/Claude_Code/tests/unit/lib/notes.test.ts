import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
  query: vi.fn(() => []),
  get: vi.fn(),
  run: vi.fn(),
}))

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-id-1234567890'),
}))

import {
  createNote,
  getNoteById,
  updateNote,
  getNotesByUser,
  setNotePublic,
  getNoteByPublicSlug,
  deleteNote,
} from '@/lib/notes'
import { getDb, query, get, run } from '@/lib/db'
import { nanoid } from 'nanoid'

const MOCK_DB_NOTE = {
  id: 'note-1',
  user_id: 'user-1',
  title: 'Test Note',
  content_json: '{"type":"doc","content":[]}',
  is_public: 0,
  public_slug: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

const EXPECTED_NOTE = {
  id: 'note-1',
  userId: 'user-1',
  title: 'Test Note',
  contentJson: '{"type":"doc","content":[]}',
  isPublic: false,
  publicSlug: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

describe('createNote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a note with defaults when title and content are omitted', async () => {
    const dbRun = vi.fn()
    vi.mocked(getDb).mockReturnValue({ run: dbRun } as any)

    const note = await createNote('user-1')

    expect(dbRun).toHaveBeenCalledOnce()
    expect(note.userId).toBe('user-1')
    expect(note.title).toBe('Untitled note')
    expect(note.contentJson).toBe(JSON.stringify({ type: 'doc', content: [] }))
    expect(note.isPublic).toBe(false)
    expect(note.publicSlug).toBeNull()
  })

  it('creates a note with custom title and content', async () => {
    const dbRun = vi.fn()
    vi.mocked(getDb).mockReturnValue({ run: dbRun } as any)
    const content = { type: 'doc', content: [{ type: 'paragraph' }] }

    const note = await createNote('user-1', 'My Title', content)

    expect(note.title).toBe('My Title')
    expect(note.contentJson).toBe(JSON.stringify(content))
  })

  it('uses nanoid as the note id', async () => {
    vi.mocked(getDb).mockReturnValue({ run: vi.fn() } as any)
    vi.mocked(nanoid).mockReturnValue('custom-id-xyz' as any)

    const note = await createNote('user-1')

    expect(note.id).toBe('custom-id-xyz')
  })
})

describe('getNoteById', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns a mapped Note when found', async () => {
    vi.mocked(get).mockReturnValue(MOCK_DB_NOTE as any)

    const note = await getNoteById('user-1', 'note-1')

    expect(note).toEqual(EXPECTED_NOTE)
  })

  it('returns null when not found', async () => {
    vi.mocked(get).mockReturnValue(undefined)

    const note = await getNoteById('user-1', 'missing')

    expect(note).toBeNull()
  })
})

describe('getNotesByUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns array of mapped notes ordered by updated_at', async () => {
    vi.mocked(query).mockReturnValue([MOCK_DB_NOTE] as any)

    const notes = await getNotesByUser('user-1')

    expect(notes).toHaveLength(1)
    expect(notes[0]).toEqual(EXPECTED_NOTE)
  })

  it('returns empty array when user has no notes', async () => {
    vi.mocked(query).mockReturnValue([])

    const notes = await getNotesByUser('user-1')

    expect(notes).toEqual([])
  })
})

describe('updateNote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('runs an UPDATE query and returns the updated note', async () => {
    const updatedDb = { ...MOCK_DB_NOTE, title: 'Updated', updated_at: '2024-02-01T00:00:00.000Z' }
    vi.mocked(get).mockReturnValue(updatedDb as any)

    const note = await updateNote('user-1', 'note-1', 'Updated', { type: 'doc', content: [] })

    expect(vi.mocked(run)).toHaveBeenCalledOnce()
    expect(note?.title).toBe('Updated')
  })

  it('returns null when the note does not exist after update', async () => {
    vi.mocked(get).mockReturnValue(undefined)

    const note = await updateNote('user-1', 'missing', 'Title', {})

    expect(note).toBeNull()
  })
})

describe('setNotePublic', () => {
  beforeEach(() => vi.clearAllMocks())

  it('makes a note public and generates a slug', async () => {
    vi.mocked(nanoid).mockReturnValue('generated-slug-16chars' as any)
    const publicDb = { ...MOCK_DB_NOTE, is_public: 1, public_slug: 'generated-slug-16chars' }
    vi.mocked(get).mockReturnValue(publicDb as any)

    const note = await setNotePublic('user-1', 'note-1', true)

    expect(vi.mocked(run)).toHaveBeenCalledOnce()
    expect(note?.isPublic).toBe(true)
    expect(note?.publicSlug).toBe('generated-slug-16chars')
  })

  it('makes a note private and clears the slug', async () => {
    const privateDb = { ...MOCK_DB_NOTE, is_public: 0, public_slug: null }
    vi.mocked(get).mockReturnValue(privateDb as any)

    const note = await setNotePublic('user-1', 'note-1', false)

    expect(vi.mocked(run)).toHaveBeenCalledOnce()
    expect(note?.isPublic).toBe(false)
    expect(note?.publicSlug).toBeNull()
  })
})

describe('getNoteByPublicSlug', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns note when slug matches a public note', async () => {
    const publicDb = { ...MOCK_DB_NOTE, is_public: 1, public_slug: 'my-share-slug' }
    vi.mocked(get).mockReturnValue(publicDb as any)

    const note = await getNoteByPublicSlug('my-share-slug')

    expect(note?.isPublic).toBe(true)
    expect(note?.publicSlug).toBe('my-share-slug')
  })

  it('returns null when slug not found', async () => {
    vi.mocked(get).mockReturnValue(undefined)

    const note = await getNoteByPublicSlug('nonexistent')

    expect(note).toBeNull()
  })
})

describe('deleteNote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('runs a DELETE query and returns true', async () => {
    const result = await deleteNote('user-1', 'note-1')

    expect(vi.mocked(run)).toHaveBeenCalledOnce()
    expect(result).toBe(true)
  })
})
