// ============================================================
// Trash Service — Unit Tests
// ============================================================

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { setupTestDb, teardownTestDb, cleanAllTables, getTestDb } from '../helpers/test-db'

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

// Now import services — they'll use the mocked getDatabase()
import {
  getArchivedItems,
  restoreItem,
  permanentDelete,
  getArchivedCounts
} from '../../services/trash-service'
import { createRoom, deleteRoom } from '../../services/room-service'

/** Helper: create a room and soft-delete it, returning its id */
function createAndArchiveRoom(code: string, name: string): string {
  const room = createRoom({ room_code: code, room_name: name, capacity: 30 })
  deleteRoom(room.id)
  return room.id
}

describe('Trash Service', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  beforeEach(() => {
    cleanAllTables()
  })

  // ── getArchivedItems ─────────────────────────────────────────

  describe('getArchivedItems', () => {
    it('returns archived rooms', () => {
      const id1 = createAndArchiveRoom('RM-101', 'Room 101')
      const id2 = createAndArchiveRoom('RM-102', 'Room 102')

      const archived = getArchivedItems('room') as Array<{ id: string; room_code: string }>

      expect(archived).toHaveLength(2)
      const ids = archived.map((r) => r.id)
      expect(ids).toContain(id1)
      expect(ids).toContain(id2)
      // Every returned row must have archived_at set
      for (const item of archived) {
        expect(item).toHaveProperty('archived_at')
        expect((item as Record<string, unknown>).archived_at).not.toBeNull()
      }
    })

    it('returns empty array when no items are archived', () => {
      // Create a room but don't delete it — it stays active
      createRoom({ room_code: 'RM-200', room_name: 'Active Room', capacity: 25 })

      const archived = getArchivedItems('room')

      expect(archived).toEqual([])
    })

    it('throws for invalid entity type', () => {
      expect(() => getArchivedItems('nonexistent_type')).toThrow(/Invalid entity type/)
      expect(() => getArchivedItems('nonexistent_type')).toThrow(
        expect.objectContaining({ code: 'INVALID_ENTITY_TYPE' })
      )
    })
  })

  // ── restoreItem ──────────────────────────────────────────────

  describe('restoreItem', () => {
    it('restores an archived room so it becomes active again', () => {
      const id = createAndArchiveRoom('RM-301', 'Room 301')

      // Confirm it's archived before restore
      const beforeRestore = getArchivedItems('room') as Array<{ id: string }>
      expect(beforeRestore.some((r) => r.id === id)).toBe(true)

      restoreItem('room', id)

      // After restore: no longer in archived list
      const afterRestore = getArchivedItems('room') as Array<{ id: string }>
      expect(afterRestore.some((r) => r.id === id)).toBe(false)

      // Verify the row's archived_at is NULL via direct DB query
      const db = getTestDb()
      const row = db.prepare('SELECT archived_at, archived_by FROM rooms WHERE id = ?').get(id) as {
        archived_at: string | null
        archived_by: string | null
      }
      expect(row.archived_at).toBeNull()
      expect(row.archived_by).toBeNull()
    })
  })

  // ── permanentDelete ──────────────────────────────────────────

  describe('permanentDelete', () => {
    it('permanently removes an archived room from the database', () => {
      const id = createAndArchiveRoom('RM-401', 'Room 401')

      // Confirm it exists in the DB before permanent delete
      const db = getTestDb()
      const beforeDelete = db.prepare('SELECT id FROM rooms WHERE id = ?').get(id)
      expect(beforeDelete).toBeDefined()

      permanentDelete('room', id)

      // Row must be completely gone — not soft-deleted, truly removed
      const afterDelete = db.prepare('SELECT id FROM rooms WHERE id = ?').get(id)
      expect(afterDelete).toBeUndefined()
    })

    it('does not guard against deleting active (non-archived) items', () => {
      // NOTE: The current permanentDelete implementation does NOT check
      // archived_at — it deletes any item found by ID. This test documents
      // that behavior. If a guard is added later, this test should be
      // updated to expect a thrown error instead.
      const room = createRoom({ room_code: 'RM-402', room_name: 'Active Room', capacity: 20 })

      // The room is active (archived_at IS NULL)
      const db = getTestDb()
      const row = db.prepare('SELECT archived_at FROM rooms WHERE id = ?').get(room.id) as {
        archived_at: string | null
      }
      expect(row.archived_at).toBeNull()

      // permanentDelete succeeds even on a non-archived item
      permanentDelete('room', room.id)

      const afterDelete = db.prepare('SELECT id FROM rooms WHERE id = ?').get(room.id)
      expect(afterDelete).toBeUndefined()
    })
  })

  // ── getArchivedCounts ────────────────────────────────────────

  describe('getArchivedCounts', () => {
    it('returns counts per entity type', () => {
      // Archive two rooms
      createAndArchiveRoom('RM-501', 'Room 501')
      createAndArchiveRoom('RM-502', 'Room 502')

      // Leave one room active (should NOT be counted)
      createRoom({ room_code: 'RM-503', room_name: 'Active Room', capacity: 30 })

      const counts = getArchivedCounts()

      // rooms should be 2
      expect(counts.room).toBe(2)

      // All other entity types should be 0 (we only archived rooms)
      expect(counts.schedule_entry).toBe(0)
      expect(counts.calendar_event).toBe(0)
      expect(counts.section).toBe(0)
      expect(counts.semester).toBe(0)
      expect(counts.academic_year).toBe(0)
      expect(counts.personnel).toBe(0)
      expect(counts.subject_bank).toBe(0)
    })
  })
})
