// ============================================================
// Calendar Event Service — Unit Tests
// ============================================================

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { setupTestDb, teardownTestDb, cleanAllTables } from '../helpers/test-db'

// Mock the connection module — vi.mock is hoisted above imports automatically.
vi.mock('../../database/connection', async () => {
  const helpers = await import('../helpers/test-db')
  return {
    getDatabase: () => helpers.getTestDb(),
    initDatabase: vi.fn(),
    closeDatabase: vi.fn(),
    getDbPath: vi.fn(() => ':memory:')
  }
})

// Now import the services — they'll use the mocked getDatabase()
import {
  createCalendarEvent,
  listCalendarEvents,
  getCalendarEvent,
  deleteCalendarEvent,
  getBlockingEventsInRange,
  restoreCalendarEvent,
  permanentDeleteCalendarEvent
} from '../../services/calendar-event-service'

describe('Calendar Event Service', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  beforeEach(() => {
    cleanAllTables()
  })

  // ── createCalendarEvent ─────────────────────────────────────

  describe('createCalendarEvent', () => {
    it('should create a HOLIDAY event with required fields', () => {
      const event = createCalendarEvent({
        title: 'National Heroes Day',
        event_type: 'HOLIDAY',
        start_datetime: '2026-08-31T00:00:00',
        end_datetime: '2026-08-31T23:59:59'
      })

      expect(event).toBeDefined()
      expect(event.id).toBeDefined()
      expect(event.title).toBe('National Heroes Day')
      expect(event.event_type).toBe('HOLIDAY')
      expect(event.start_datetime).toBe('2026-08-31T00:00:00')
      expect(event.end_datetime).toBe('2026-08-31T23:59:59')
      expect(event.is_active).toBe(1)
      expect(event.archived_at).toBeNull()
    })

    it('should reject a title shorter than the minimum length', () => {
      expect(() =>
        createCalendarEvent({
          title: 'X',
          event_type: 'HOLIDAY',
          start_datetime: '2026-08-31T00:00:00',
          end_datetime: '2026-08-31T23:59:59'
        })
      ).toThrow(/Title must be at least/)
    })

    it('should reject when start_datetime is after end_datetime', () => {
      expect(() =>
        createCalendarEvent({
          title: 'Backwards Event',
          event_type: 'HOLIDAY',
          start_datetime: '2026-09-15T00:00:00',
          end_datetime: '2026-09-10T00:00:00'
        })
      ).toThrow(/Start date cannot be after end date/)
    })

    it('should reject BREAK event without description', () => {
      expect(() =>
        createCalendarEvent({
          title: 'Semester Break',
          event_type: 'BREAK',
          start_datetime: '2026-10-01T00:00:00',
          end_datetime: '2026-10-15T23:59:59'
        })
      ).toThrow(/requires an override reason/)
    })

    it('should auto-set is_blocking for HOLIDAY events', () => {
      const event = createCalendarEvent({
        title: 'Independence Day',
        event_type: 'HOLIDAY',
        is_blocking: false,
        start_datetime: '2026-06-12T00:00:00',
        end_datetime: '2026-06-12T23:59:59'
      })

      // HOLIDAY is auto-blocking regardless of what the caller passes
      expect(event.is_blocking).toBe(1)
    })

    it('should reject duplicate title with same dates', () => {
      createCalendarEvent({
        title: 'Christmas Break',
        event_type: 'HOLIDAY',
        start_datetime: '2026-12-25T00:00:00',
        end_datetime: '2026-12-25T23:59:59'
      })

      expect(() =>
        createCalendarEvent({
          title: 'Christmas Break',
          event_type: 'HOLIDAY',
          start_datetime: '2026-12-25T00:00:00',
          end_datetime: '2026-12-25T23:59:59'
        })
      ).toThrow(/same title and dates already exists/)
    })

    it('should reject EXAM_PERIOD event without exam_type', () => {
      expect(() =>
        createCalendarEvent({
          title: 'Midterm Exams',
          event_type: 'EXAM_PERIOD',
          start_datetime: '2026-10-15T00:00:00',
          end_datetime: '2026-10-20T23:59:59'
        })
      ).toThrow(/Exam type is required/)
    })

    it('should create EXAM_PERIOD event with valid exam_type', () => {
      const event = createCalendarEvent({
        title: 'Midterm Exams',
        event_type: 'EXAM_PERIOD',
        exam_type: 'MIDTERM',
        start_datetime: '2026-10-15T00:00:00',
        end_datetime: '2026-10-20T23:59:59'
      })

      expect(event.exam_type).toBe('MIDTERM')
      expect(event.event_type).toBe('EXAM_PERIOD')
      expect(event.is_blocking).toBe(1) // auto-blocking
    })
  })

  // ── listCalendarEvents ──────────────────────────────────────

  describe('listCalendarEvents', () => {
    it('should return all active non-archived events', () => {
      createCalendarEvent({
        title: 'Holiday One',
        event_type: 'HOLIDAY',
        start_datetime: '2026-01-01T00:00:00',
        end_datetime: '2026-01-01T23:59:59'
      })

      createCalendarEvent({
        title: 'Holiday Two',
        event_type: 'HOLIDAY',
        start_datetime: '2026-02-01T00:00:00',
        end_datetime: '2026-02-01T23:59:59'
      })

      const events = listCalendarEvents()
      expect(events).toHaveLength(2)
      expect(events[0].title).toBe('Holiday One')
      expect(events[1].title).toBe('Holiday Two')
    })

    it('should not return soft-deleted events', () => {
      const event = createCalendarEvent({
        title: 'To Be Deleted',
        event_type: 'HOLIDAY',
        start_datetime: '2026-03-01T00:00:00',
        end_datetime: '2026-03-01T23:59:59'
      })

      deleteCalendarEvent(event.id)

      const events = listCalendarEvents()
      expect(events).toHaveLength(0)
    })
  })

  // ── getCalendarEvent ────────────────────────────────────────

  describe('getCalendarEvent', () => {
    it('should return the event when it exists', () => {
      const created = createCalendarEvent({
        title: 'Rizal Day',
        event_type: 'HOLIDAY',
        start_datetime: '2026-12-30T00:00:00',
        end_datetime: '2026-12-30T23:59:59'
      })

      const fetched = getCalendarEvent(created.id)
      expect(fetched.id).toBe(created.id)
      expect(fetched.title).toBe('Rizal Day')
    })

    it('should throw NOT_FOUND for a non-existent id', () => {
      expect(() => getCalendarEvent('non-existent-id')).toThrow(/Calendar event not found/)
    })
  })

  // ── deleteCalendarEvent (soft delete) ───────────────────────

  describe('deleteCalendarEvent', () => {
    it('should soft-delete by setting archived_at and archived_by', () => {
      const event = createCalendarEvent({
        title: 'Foundation Day',
        event_type: 'INSTITUTIONAL_EVENT',
        description: 'Annual foundation celebration',
        start_datetime: '2026-07-15T08:00:00',
        end_datetime: '2026-07-15T17:00:00'
      })

      deleteCalendarEvent(event.id)

      // The event should no longer be returned by getCalendarEvent
      expect(() => getCalendarEvent(event.id)).toThrow(/Calendar event not found/)

      // But it's still in the DB — not permanently deleted
      // listCalendarEvents also shouldn't return it
      const events = listCalendarEvents()
      expect(events).toHaveLength(0)
    })
  })

  // ── getBlockingEventsInRange ────────────────────────────────

  describe('getBlockingEventsInRange', () => {
    it('should return blocking events that overlap the given range', () => {
      // A blocking HOLIDAY in October
      createCalendarEvent({
        title: 'All Saints Day',
        event_type: 'HOLIDAY',
        start_datetime: '2026-11-01T00:00:00',
        end_datetime: '2026-11-01T23:59:59'
      })

      // A non-blocking CUSTOM event in October (is_blocking defaults to 0 for CUSTOM)
      createCalendarEvent({
        title: 'School Fair',
        event_type: 'CUSTOM',
        description: 'Annual school fair event',
        start_datetime: '2026-11-05T08:00:00',
        end_datetime: '2026-11-05T17:00:00'
      })

      // Query range covers all of November
      const blocking = getBlockingEventsInRange('2026-10-31T00:00:00', '2026-11-30T23:59:59')

      expect(blocking).toHaveLength(1)
      expect(blocking[0].title).toBe('All Saints Day')
    })

    it('should not return events outside the date range', () => {
      createCalendarEvent({
        title: 'New Year',
        event_type: 'HOLIDAY',
        start_datetime: '2026-01-01T00:00:00',
        end_datetime: '2026-01-01T23:59:59'
      })

      // Query a range in March — shouldn't match the January event
      const blocking = getBlockingEventsInRange('2026-03-01T00:00:00', '2026-03-31T23:59:59')
      expect(blocking).toHaveLength(0)
    })

    it('should filter by department when provided', () => {
      // SHS-specific holiday
      createCalendarEvent({
        title: 'SHS Exam Week',
        event_type: 'EXAM_PERIOD',
        exam_type: 'Q1_EXAM',
        department: 'SHS',
        start_datetime: '2026-09-01T00:00:00',
        end_datetime: '2026-09-05T23:59:59'
      })

      // COLLEGE-specific holiday
      createCalendarEvent({
        title: 'College Prelims',
        event_type: 'EXAM_PERIOD',
        exam_type: 'PRELIM',
        department: 'COLLEGE',
        start_datetime: '2026-09-01T00:00:00',
        end_datetime: '2026-09-05T23:59:59'
      })

      const shsBlocking = getBlockingEventsInRange(
        '2026-08-31T00:00:00',
        '2026-09-06T23:59:59',
        'SHS'
      )

      // Should only include SHS (department match) and any with NULL department
      expect(shsBlocking).toHaveLength(1)
      expect(shsBlocking[0].title).toBe('SHS Exam Week')
    })
  })

  // ── restoreCalendarEvent ────────────────────────────────────

  describe('restoreCalendarEvent', () => {
    it('should restore a soft-deleted event', () => {
      const event = createCalendarEvent({
        title: 'Bonifacio Day',
        event_type: 'HOLIDAY',
        start_datetime: '2026-11-30T00:00:00',
        end_datetime: '2026-11-30T23:59:59'
      })

      deleteCalendarEvent(event.id)

      // Confirm it's gone from active listing
      expect(() => getCalendarEvent(event.id)).toThrow(/Calendar event not found/)

      // Restore it
      const restored = restoreCalendarEvent(event.id)

      expect(restored.id).toBe(event.id)
      expect(restored.title).toBe('Bonifacio Day')
      expect(restored.archived_at).toBeNull()
      expect(restored.archived_by).toBeNull()

      // Should be retrievable again
      const fetched = getCalendarEvent(event.id)
      expect(fetched.id).toBe(event.id)
    })

    it('should throw when trying to restore a non-archived event', () => {
      expect(() => restoreCalendarEvent('non-existent-id')).toThrow(
        /Archived calendar event not found/
      )
    })
  })

  // ── permanentDeleteCalendarEvent ────────────────────────────

  describe('permanentDeleteCalendarEvent', () => {
    it('should permanently remove an archived event from the database', () => {
      const event = createCalendarEvent({
        title: 'Temporary Event',
        event_type: 'HOLIDAY',
        start_datetime: '2026-04-09T00:00:00',
        end_datetime: '2026-04-09T23:59:59'
      })

      // Must soft-delete first — permanent delete only works on archived events
      deleteCalendarEvent(event.id)

      permanentDeleteCalendarEvent(event.id)

      // Cannot restore after permanent delete
      expect(() => restoreCalendarEvent(event.id)).toThrow(/Archived calendar event not found/)
    })

    it('should throw when trying to permanently delete a non-archived event', () => {
      const event = createCalendarEvent({
        title: 'Active Event',
        event_type: 'HOLIDAY',
        start_datetime: '2026-05-01T00:00:00',
        end_datetime: '2026-05-01T23:59:59'
      })

      // Attempting permanent delete without soft-deleting first should fail
      expect(() => permanentDeleteCalendarEvent(event.id)).toThrow(
        /Archived calendar event not found/
      )
    })
  })
})
