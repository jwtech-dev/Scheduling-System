// ============================================================
// Room Service — Unit Tests
// ============================================================

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { setupTestDb, teardownTestDb, cleanAllTables, getTestDb } from '../helpers/test-db'

// Mock the connection module — vi.mock is hoisted above imports automatically.
// The factory returns a function reference to getTestDb(), which is called lazily
// at runtime (after setupTestDb populates the DB instance).
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
  createRoom,
  listRooms,
  getRoom,
  updateRoom,
  deleteRoom,
  restoreRoom,
  permanentDeleteRoom,
  getArchivedRooms,
  getCascadeCount
} from '../../services/room-service'

describe('Room Service', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  // Clean tables before each test for isolation
  beforeEach(() => {
    cleanAllTables()
  })

  // ── createRoom ──────────────────────────────────────────────

  describe('createRoom', () => {
    it('should create a room with all required fields', () => {
      const room = createRoom({
        room_code: 'R-101',
        room_name: 'Room 101',
        capacity: 40
      })

      expect(room).toBeDefined()
      expect(room.id).toBeDefined()
      expect(room.room_code).toBe('R-101')
      expect(room.room_name).toBe('Room 101')
      expect(room.capacity).toBe(40)
      expect(room.department_availability).toBe('SHARED')
      expect(room.is_active).toBe(1)
      expect(room.archived_at).toBeNull()
    })

    it('should create a room with all optional fields', () => {
      const room = createRoom({
        room_code: 'R-201',
        room_name: 'Lab Room 201',
        building: 'Science Building',
        floor: '2nd Floor',
        capacity: 30,
        room_type: 'LABORATORY',
        department_availability: 'COLLEGE_ONLY',
        notes: 'Has projector and whiteboard'
      })

      expect(room.building).toBe('Science Building')
      expect(room.floor).toBe('2nd Floor')
      expect(room.room_type).toBe('LABORATORY')
      expect(room.department_availability).toBe('COLLEGE_ONLY')
      expect(room.notes).toBe('Has projector and whiteboard')
    })

    it('should reject duplicate room codes', () => {
      createRoom({ room_code: 'DUP-100', room_name: 'Room A', capacity: 20 })

      expect(() => {
        createRoom({ room_code: 'DUP-100', room_name: 'Room B', capacity: 25 })
      }).toThrow(/already in use/)
    })

    it('should reject capacity less than 1', () => {
      expect(() => {
        createRoom({ room_code: 'R-CAP0', room_name: 'Tiny Room', capacity: 0 })
      }).toThrow(/at least 1/)
    })

    it('should reject capacity greater than 10,000', () => {
      expect(() => {
        createRoom({ room_code: 'R-HUGE', room_name: 'Huge Room', capacity: 10001 })
      }).toThrow(/exceed 10,000/)
    })

    it('should create an audit log entry', () => {
      const room = createRoom({ room_code: 'R-AUD', room_name: 'Audited Room', capacity: 15 })
      const db = getTestDb()
      const logs = db
        .prepare("SELECT * FROM audit_log WHERE entity_type = 'room' AND entity_id = ?")
        .all(room.id) as Array<{ action: string }>

      expect(logs.length).toBe(1)
      expect(logs[0].action).toBe('CREATE')
    })
  })

  // ── listRooms ───────────────────────────────────────────────

  describe('listRooms', () => {
    beforeEach(() => {
      createRoom({ room_code: 'A-101', room_name: 'Room A', capacity: 30, building: 'Bldg A', department_availability: 'SHARED' })
      createRoom({ room_code: 'B-201', room_name: 'Room B', capacity: 40, building: 'Bldg B', department_availability: 'SHS_ONLY' })
      createRoom({ room_code: 'C-301', room_name: 'Room C', capacity: 50, building: 'Bldg A', department_availability: 'COLLEGE_ONLY' })
    })

    it('should list all active rooms', () => {
      const rooms = listRooms()
      expect(rooms.length).toBe(3)
    })

    it('should filter by department SHS (includes SHARED + SHS_ONLY)', () => {
      const rooms = listRooms({ department: 'SHS' })
      expect(rooms.length).toBe(2)
      const codes = rooms.map((r) => r.room_code)
      expect(codes).toContain('A-101') // SHARED
      expect(codes).toContain('B-201') // SHS_ONLY
    })

    it('should filter by department COLLEGE (includes SHARED + COLLEGE_ONLY)', () => {
      const rooms = listRooms({ department: 'COLLEGE' })
      expect(rooms.length).toBe(2)
      const codes = rooms.map((r) => r.room_code)
      expect(codes).toContain('A-101') // SHARED
      expect(codes).toContain('C-301') // COLLEGE_ONLY
    })

    it('should filter by building', () => {
      const rooms = listRooms({ building: 'Bldg A' })
      expect(rooms.length).toBe(2)
    })

    it('should search by room code or name', () => {
      const rooms = listRooms({ search: 'B-201' })
      expect(rooms.length).toBe(1)
      expect(rooms[0].room_code).toBe('B-201')
    })

    it('should not include archived rooms', () => {
      const room = createRoom({ room_code: 'D-401', room_name: 'Room D', capacity: 20 })
      deleteRoom(room.id)
      const rooms = listRooms()
      expect(rooms.length).toBe(3) // Only original 3
    })
  })

  // ── getRoom ─────────────────────────────────────────────────

  describe('getRoom', () => {
    it('should get an existing room by ID', () => {
      const created = createRoom({ room_code: 'GET-1', room_name: 'Get Room', capacity: 25 })
      const fetched = getRoom(created.id)
      expect(fetched.id).toBe(created.id)
      expect(fetched.room_code).toBe('GET-1')
    })

    it('should throw NOT_FOUND for non-existent room', () => {
      expect(() => {
        getRoom('non-existent-id')
      }).toThrow(/not found/)
    })
  })

  // ── updateRoom ──────────────────────────────────────────────

  describe('updateRoom', () => {
    it('should update room fields', () => {
      const room = createRoom({ room_code: 'UPD-1', room_name: 'Before', capacity: 20 })
      const updated = updateRoom({
        id: room.id,
        room_name: 'After',
        capacity: 50,
        building: 'New Building'
      })

      expect(updated.room_name).toBe('After')
      expect(updated.capacity).toBe(50)
      expect(updated.building).toBe('New Building')
      expect(updated.room_code).toBe('UPD-1') // Unchanged
    })

    it('should reject duplicate room code on rename', () => {
      createRoom({ room_code: 'EXIST-1', room_name: 'Existing', capacity: 20 })
      const room2 = createRoom({ room_code: 'RENAME-1', room_name: 'To Rename', capacity: 30 })

      expect(() => {
        updateRoom({ id: room2.id, room_code: 'EXIST-1' })
      }).toThrow(/already in use/)
    })

    it('should allow same room code (no-op rename)', () => {
      const room = createRoom({ room_code: 'SAME-1', room_name: 'Same', capacity: 20 })
      const updated = updateRoom({ id: room.id, room_code: 'SAME-1', room_name: 'Updated Name' })
      expect(updated.room_name).toBe('Updated Name')
    })

    it('should reject capacity out of bounds on update', () => {
      const room = createRoom({ room_code: 'BOUNDS-1', room_name: 'Bounds', capacity: 20 })
      expect(() => {
        updateRoom({ id: room.id, capacity: 0 })
      }).toThrow(/between 1 and 10,000/)
    })

    it('should create an audit log entry', () => {
      const room = createRoom({ room_code: 'AUD-UPD', room_name: 'Audit', capacity: 20 })
      updateRoom({ id: room.id, room_name: 'Audited Update' })

      const db = getTestDb()
      const logs = db
        .prepare("SELECT * FROM audit_log WHERE entity_type = 'room' AND entity_id = ? AND action = 'UPDATE'")
        .all(room.id) as Array<{ action: string }>
      expect(logs.length).toBe(1)
    })
  })

  // ── deleteRoom (soft delete) ────────────────────────────────

  describe('deleteRoom', () => {
    it('should soft-delete a room', () => {
      const room = createRoom({ room_code: 'DEL-1', room_name: 'To Delete', capacity: 20 })
      deleteRoom(room.id)

      // Should not appear in active list
      expect(() => getRoom(room.id)).toThrow(/not found/)

      // Should appear in archived list
      const archived = getArchivedRooms()
      expect(archived.some((r) => r.id === room.id)).toBe(true)
    })

    it('should create an audit log entry', () => {
      const room = createRoom({ room_code: 'DEL-AUD', room_name: 'Delete Audit', capacity: 20 })
      deleteRoom(room.id)

      const db = getTestDb()
      const logs = db
        .prepare("SELECT * FROM audit_log WHERE entity_type = 'room' AND entity_id = ? AND action = 'DELETE'")
        .all(room.id) as Array<{ action: string }>
      expect(logs.length).toBe(1)
    })
  })

  // ── restoreRoom ─────────────────────────────────────────────

  describe('restoreRoom', () => {
    it('should restore an archived room', () => {
      const room = createRoom({ room_code: 'RES-1', room_name: 'Restore Me', capacity: 20 })
      deleteRoom(room.id)

      const restored = restoreRoom(room.id)
      expect(restored.archived_at).toBeNull()
      expect(restored.room_code).toBe('RES-1')

      // Should appear in active list again
      const active = getRoom(restored.id)
      expect(active).toBeDefined()
    })

    it('should throw for non-archived room', () => {
      expect(() => {
        restoreRoom('non-existent-id')
      }).toThrow(/not found/)
    })

    it('should create an audit log entry', () => {
      const room = createRoom({ room_code: 'RES-AUD', room_name: 'Restore Audit', capacity: 20 })
      deleteRoom(room.id)
      restoreRoom(room.id)

      const db = getTestDb()
      const logs = db
        .prepare("SELECT * FROM audit_log WHERE entity_type = 'room' AND entity_id = ? AND action = 'RESTORE'")
        .all(room.id) as Array<{ action: string }>
      expect(logs.length).toBe(1)
    })
  })

  // ── permanentDeleteRoom ─────────────────────────────────────

  describe('permanentDeleteRoom', () => {
    it('should permanently delete an archived room', () => {
      const room = createRoom({ room_code: 'PERM-1', room_name: 'Permanent Delete', capacity: 20 })
      deleteRoom(room.id)
      permanentDeleteRoom(room.id)

      // Should not appear anywhere
      const archived = getArchivedRooms()
      expect(archived.some((r) => r.id === room.id)).toBe(false)

      const db = getTestDb()
      const row = db.prepare('SELECT * FROM rooms WHERE id = ?').get(room.id)
      expect(row).toBeUndefined()
    })

    it('should throw for non-archived room', () => {
      const room = createRoom({ room_code: 'PERM-ERR', room_name: 'Not Archived', capacity: 20 })
      expect(() => {
        permanentDeleteRoom(room.id)
      }).toThrow(/not found/)
    })

    it('should create an audit log entry', () => {
      const room = createRoom({ room_code: 'PERM-AUD', room_name: 'Perm Audit', capacity: 20 })
      deleteRoom(room.id)
      permanentDeleteRoom(room.id)

      const db = getTestDb()
      const logs = db
        .prepare("SELECT * FROM audit_log WHERE entity_type = 'room' AND entity_id = ? AND action = 'PERMANENT_DELETE'")
        .all(room.id) as Array<{ action: string }>
      expect(logs.length).toBe(1)
    })
  })

  // ── getCascadeCount ─────────────────────────────────────────

  describe('getCascadeCount', () => {
    it('should return zero for room with no schedule entries', () => {
      const room = createRoom({ room_code: 'CASCADE-0', room_name: 'No Entries', capacity: 20 })
      const result = getCascadeCount(room.id)
      expect(result.schedule_entries).toBe(0)
    })
  })
})
