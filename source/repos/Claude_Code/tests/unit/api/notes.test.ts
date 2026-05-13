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
  getNotesByUser: vi.fn(),
  createNote: vi.fn(),
}))

import { GET, POST } from '@/app/api/notes/route'
import { auth } from '@/lib/auth'
import { getNotesByUser, createNote } from '@/lib/notes'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'test@example.com' },
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

describe('GET /api/notes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ error: 'Unauthorized' })
  })

  it('returns 200 with notes list (contentJson excluded)', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as any)
    vi.mocked(getNotesByUser).mockResolvedValue([MOCK_NOTE])

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].id).toBe('note-1')
    expect(body[0]).not.toHaveProperty('contentJson')
  })

  it('returns 200 with empty array when user has no notes', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as any)
    vi.mocked(getNotesByUser).mockResolvedValue([])

    const res = await GET()

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns 500 on unexpected error', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as any)
    vi.mocked(getNotesByUser).mockRejectedValue(new Error('DB error'))

    const res = await GET()

    expect(res.status).toBe(500)
  })
})

describe('POST /api/notes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const req = new Request('http://localhost/api/notes', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Note' }),
    })
    const res = await POST(req)

    expect(res.status).toBe(401)
  })

  it('creates a note and returns 201 with full note', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as any)
    vi.mocked(createNote).mockResolvedValue(MOCK_NOTE)

    const req = new Request('http://localhost/api/notes', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Note' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.id).toBe('note-1')
    expect(body.title).toBe('Test Note')
  })

  it('passes title and contentJson to createNote', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as any)
    vi.mocked(createNote).mockResolvedValue(MOCK_NOTE)
    const content = { type: 'doc', content: [] }

    const req = new Request('http://localhost/api/notes', {
      method: 'POST',
      body: JSON.stringify({ title: 'My Note', contentJson: content }),
    })
    await POST(req)

    expect(createNote).toHaveBeenCalledWith('user-1', 'My Note', content)
  })

  it('returns 500 on unexpected error', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(MOCK_SESSION as any)
    vi.mocked(createNote).mockRejectedValue(new Error('DB error'))

    const req = new Request('http://localhost/api/notes', {
      method: 'POST',
      body: JSON.stringify({ title: 'Note' }),
    })
    const res = await POST(req)

    expect(res.status).toBe(500)
  })
})
