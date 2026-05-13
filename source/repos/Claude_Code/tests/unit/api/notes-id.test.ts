import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Note } from '@/lib/notes'

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock('@/lib/notes', () => ({
  getNoteById: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  setNotePublic: vi.fn(),
}))

import { GET, PUT, DELETE, POST } from '@/app/api/notes/[id]/route'
import { auth } from '@/lib/auth'
import { getNoteById, updateNote, deleteNote, setNotePublic } from '@/lib/notes'

const MOCK_SESSION = {
  user: { id: 'user-1' },
  session: { id: 'session-1' },
}

const MOCK_NOTE: Note = {
  id: 'note-1',
  userId: 'user-1',
  title: 'Test Note',
  contentJson: '{"type":"doc","content":[]}',
  isPublic: false,
  publicSlug: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const params = (id: string) => ({ params: Promise.resolve({ id }) })

describe('GET /api/notes/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const res = await GET(new Request('http://localhost/api/notes/note-1'), params('note-1'))

    expect(res.status).toBe(401)
  })

  it('returns 200 with note when found', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as any)
    vi.mocked(getNoteById).mockResolvedValue(MOCK_NOTE)

    const res = await GET(new Request('http://localhost/api/notes/note-1'), params('note-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.id).toBe('note-1')
    expect(body.contentJson).toBeDefined()
  })

  it('returns 404 when note not found', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as any)
    vi.mocked(getNoteById).mockResolvedValue(null)

    const res = await GET(new Request('http://localhost/api/notes/missing'), params('missing'))

    expect(res.status).toBe(404)
  })
})

describe('PUT /api/notes/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const req = new Request('http://localhost/api/notes/note-1', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated', contentJson: {} }),
    })
    const res = await PUT(req, params('note-1'))

    expect(res.status).toBe(401)
  })

  it('returns 200 with the updated note', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as any)
    vi.mocked(updateNote).mockResolvedValue({ ...MOCK_NOTE, title: 'Updated Title' })

    const req = new Request('http://localhost/api/notes/note-1', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated Title', contentJson: { type: 'doc', content: [] } }),
    })
    const res = await PUT(req, params('note-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.title).toBe('Updated Title')
  })

  it('returns 404 when note not found', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as any)
    vi.mocked(updateNote).mockResolvedValue(null)

    const req = new Request('http://localhost/api/notes/missing', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Title', contentJson: {} }),
    })
    const res = await PUT(req, params('missing'))

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/notes/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const res = await DELETE(new Request('http://localhost/api/notes/note-1'), params('note-1'))

    expect(res.status).toBe(401)
  })

  it('returns 204 when note is deleted', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as any)
    vi.mocked(getNoteById).mockResolvedValue(MOCK_NOTE)
    vi.mocked(deleteNote).mockResolvedValue(true)

    const res = await DELETE(new Request('http://localhost/api/notes/note-1'), params('note-1'))

    expect(res.status).toBe(204)
  })

  it('returns 404 when note not found', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as any)
    vi.mocked(getNoteById).mockResolvedValue(null)

    const res = await DELETE(new Request('http://localhost/api/notes/missing'), params('missing'))

    expect(res.status).toBe(404)
  })
})

describe('POST /api/notes/[id] (share toggle)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const req = new Request('http://localhost/api/notes/note-1', {
      method: 'POST',
      body: JSON.stringify({ isPublic: true }),
    })
    const res = await POST(req, params('note-1'))

    expect(res.status).toBe(401)
  })

  it('makes note public and returns updated note with slug', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as any)
    vi.mocked(getNoteById).mockResolvedValue(MOCK_NOTE)
    const publicNote = { ...MOCK_NOTE, isPublic: true, publicSlug: 'abc123slug45678' }
    vi.mocked(setNotePublic).mockResolvedValue(publicNote)

    const req = new Request('http://localhost/api/notes/note-1', {
      method: 'POST',
      body: JSON.stringify({ isPublic: true }),
    })
    const res = await POST(req, params('note-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.isPublic).toBe(true)
    expect(body.publicSlug).toBe('abc123slug45678')
  })

  it('makes note private and clears the slug', async () => {
    const sharedNote = { ...MOCK_NOTE, isPublic: true, publicSlug: 'abc123slug45678' }
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as any)
    vi.mocked(getNoteById).mockResolvedValue(sharedNote)
    vi.mocked(setNotePublic).mockResolvedValue({ ...MOCK_NOTE, isPublic: false, publicSlug: null })

    const req = new Request('http://localhost/api/notes/note-1', {
      method: 'POST',
      body: JSON.stringify({ isPublic: false }),
    })
    const res = await POST(req, params('note-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.isPublic).toBe(false)
    expect(body.publicSlug).toBeNull()
  })

  it('returns 404 when note not found', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as any)
    vi.mocked(getNoteById).mockResolvedValue(null)

    const req = new Request('http://localhost/api/notes/missing', {
      method: 'POST',
      body: JSON.stringify({ isPublic: true }),
    })
    const res = await POST(req, params('missing'))

    expect(res.status).toBe(404)
  })
})
