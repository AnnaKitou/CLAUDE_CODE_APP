import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatRelativeTime } from '@/lib/format'

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "just now" for < 60 seconds ago', () => {
    expect(formatRelativeTime('2024-01-15T11:59:30.000Z')).toBe('just now')
  })

  it('returns "1 minute ago" (singular)', () => {
    expect(formatRelativeTime('2024-01-15T11:58:30.000Z')).toBe('1 minute ago')
  })

  it('returns plural minutes', () => {
    expect(formatRelativeTime('2024-01-15T11:30:00.000Z')).toBe('30 minutes ago')
  })

  it('returns "1 hour ago" (singular)', () => {
    expect(formatRelativeTime('2024-01-15T11:00:00.000Z')).toBe('1 hour ago')
  })

  it('returns plural hours', () => {
    expect(formatRelativeTime('2024-01-15T08:00:00.000Z')).toBe('4 hours ago')
  })

  it('returns "1 day ago" (singular)', () => {
    expect(formatRelativeTime('2024-01-14T12:00:00.000Z')).toBe('1 day ago')
  })

  it('returns plural days', () => {
    expect(formatRelativeTime('2024-01-12T12:00:00.000Z')).toBe('3 days ago')
  })

  it('returns formatted date string for dates older than 1 week', () => {
    expect(formatRelativeTime('2024-01-01T12:00:00.000Z')).toBe('Jan 1, 2024')
  })
})
