// ============================================================
// Personnel Service — Unit Tests
// ============================================================

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { setupTestDb, teardownTestDb, cleanAllTables, getTestDb } from '../helpers/test-db'

vi.mock('../../database/connection', async () => {
  const helpers = await import('../helpers/test-db')
  return {
    getDatabase: () => helpers.getTestDb(),
    initDatabase: vi.fn(),
    closeDatabase: vi.fn(),
    getDbPath: vi.fn(() => ':memory:')
  }
})

import {
  createPersonnel,
  listPersonnel,
  getPersonnel,
  updatePersonnel,
  deletePersonnel,
  getArchivedPersonnel,
  restorePersonnel,
  permanentDeletePersonnel,
  getCascadeCount
} from '../../services/personnel-service'

// Helper to create personnel with all required fields
function makePersonnel(overrides: Partial<Parameters<typeof createPersonnel>[0]> & { employee_id: string; email: string }) {
  return createPersonnel({
    first_name: 'Test',
    last_name: 'User',
    department: 'COLLEGE',
    ...overrides
  })
}

describe('Personnel Service', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  beforeEach(() => {
    cleanAllTables()
  })

  describe('createPersonnel', () => {
    it('should create personnel with required fields', () => {
      const person = makePersonnel({
        employee_id: 'EMP-001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@school.edu',
        department: 'COLLEGE'
      })

      expect(person).toBeDefined()
      expect(person.id).toBeDefined()
      expect(person.employee_id).toBe('EMP-001')
      expect(person.first_name).toBe('John')
      expect(person.department).toBe('COLLEGE')
    })

    it('should reject duplicate employee_id', () => {
      makePersonnel({ employee_id: 'DUP-01', email: 'a@test.edu' })
      expect(() => {
        makePersonnel({ employee_id: 'DUP-01', email: 'b@test.edu' })
      }).toThrow(/already/)
    })

    it('should reject duplicate email', () => {
      makePersonnel({ employee_id: 'E1', email: 'dup@test.edu' })
      expect(() => {
        makePersonnel({ employee_id: 'E2', email: 'dup@test.edu' })
      }).toThrow(/already/)
    })

    it('should create audit log entry', () => {
      const person = makePersonnel({ employee_id: 'AUD-01', email: 'audit@test.edu' })
      const db = getTestDb()
      const logs = db.prepare("SELECT * FROM audit_log WHERE entity_type = 'personnel' AND entity_id = ? AND action = 'CREATE'").all(person.id) as Array<{ action: string }>
      expect(logs.length).toBe(1)
    })
  })

  describe('listPersonnel', () => {
    beforeEach(() => {
      makePersonnel({ employee_id: 'L1', first_name: 'Alice', last_name: 'Smith', email: 'alice@test.edu', department: 'COLLEGE' })
      makePersonnel({ employee_id: 'L2', first_name: 'Bob', last_name: 'Jones', email: 'bob@test.edu', department: 'SHS' })
    })

    it('should list all active personnel', () => {
      expect(listPersonnel().length).toBe(2)
    })

    it('should filter by department', () => {
      const college = listPersonnel({ department: 'COLLEGE' })
      expect(college.length).toBe(1)
      expect(college[0].first_name).toBe('Alice')
    })

    it('should search by name', () => {
      const result = listPersonnel({ search: 'Bob' })
      expect(result.length).toBe(1)
    })
  })

  describe('getPersonnel', () => {
    it('should get by ID', () => {
      const created = makePersonnel({ employee_id: 'GET-01', email: 'get@test.edu' })
      const fetched = getPersonnel(created.id)
      expect(fetched.employee_id).toBe('GET-01')
    })

    it('should throw for non-existent ID', () => {
      expect(() => getPersonnel('fake-id')).toThrow(/not found/)
    })
  })

  describe('updatePersonnel', () => {
    it('should update fields', () => {
      const person = makePersonnel({ employee_id: 'UPD-01', first_name: 'Before', email: 'upd@test.edu' })
      const updated = updatePersonnel({ id: person.id, first_name: 'After' })
      expect(updated.first_name).toBe('After')
    })
  })

  describe('deletePersonnel', () => {
    it('should soft-delete', () => {
      const person = makePersonnel({ employee_id: 'DEL-01', email: 'del@test.edu' })
      deletePersonnel(person.id)
      expect(() => getPersonnel(person.id)).toThrow(/not found/)
      expect(getArchivedPersonnel().some((p) => p.id === person.id)).toBe(true)
    })
  })

  describe('restorePersonnel', () => {
    it('should restore archived personnel', () => {
      const person = makePersonnel({ employee_id: 'RES-01', email: 'res@test.edu' })
      deletePersonnel(person.id)
      const restored = restorePersonnel(person.id)
      expect(restored.archived_at).toBeNull()
    })
  })

  describe('permanentDeletePersonnel', () => {
    it('should permanently delete from trash', () => {
      const person = makePersonnel({ employee_id: 'PERM-01', email: 'perm@test.edu' })
      deletePersonnel(person.id)
      permanentDeletePersonnel(person.id)
      const db = getTestDb()
      const row = db.prepare('SELECT * FROM personnel WHERE id = ?').get(person.id)
      expect(row).toBeUndefined()
    })
  })

  describe('getCascadeCount', () => {
    it('should return zero when no schedule entries exist', () => {
      const person = makePersonnel({ employee_id: 'CAS-01', email: 'cas@test.edu' })
      const result = getCascadeCount(person.id)
      expect(result.schedule_entries).toBe(0)
    })
  })
})
