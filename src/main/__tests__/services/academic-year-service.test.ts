// ============================================================
// Academic Year Service — Unit Tests
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
  createAcademicYear,
  listAcademicYears,
  getAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  publishAcademicYear,
  getArchivedAcademicYears,
  restoreAcademicYear,
  permanentDeleteAcademicYear
} from '../../services/academic-year-service'

describe('Academic Year Service', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  beforeEach(() => {
    cleanAllTables()
  })

  describe('createAcademicYear', () => {
    it('should create an academic year', () => {
      const ay = createAcademicYear({
        department: 'COLLEGE',
        label: 'AY 2025-2026',
        start_date: '2025-08-01',
        end_date: '2026-05-31'
      })

      expect(ay).toBeDefined()
      expect(ay.id).toBeDefined()
      expect(ay.label).toBe('AY 2025-2026')
      expect(ay.department).toBe('COLLEGE')
      // First AY in department auto-publishes
      expect(ay.status).toBe('PUBLISHED')
      expect(ay.is_active).toBe(1)
    })

    it('should create a second AY as DRAFT when one is active', () => {
      createAcademicYear({
        department: 'COLLEGE',
        label: 'AY 2024-2025',
        start_date: '2024-08-01',
        end_date: '2025-05-31'
      })

      const ay2 = createAcademicYear({
        department: 'COLLEGE',
        label: 'AY 2025-2026',
        start_date: '2025-08-01',
        end_date: '2026-05-31'
      })

      expect(ay2.status).toBe('DRAFT')
      expect(ay2.is_active).toBe(0)
    })

    it('should reject duplicate labels in same department', () => {
      createAcademicYear({ department: 'COLLEGE', label: 'AY 2025', start_date: '2025-08-01', end_date: '2026-05-31' })
      expect(() => {
        createAcademicYear({ department: 'COLLEGE', label: 'AY 2025', start_date: '2025-09-01', end_date: '2026-06-30' })
      }).toThrow(/already exists/)
    })

    it('should reject invalid date range (start >= end)', () => {
      expect(() => {
        createAcademicYear({ department: 'COLLEGE', label: 'Bad Dates', start_date: '2026-05-31', end_date: '2025-08-01' })
      }).toThrow(/before end date/)
    })

    it('should allow same label in different departments', () => {
      createAcademicYear({ department: 'COLLEGE', label: 'AY 2025', start_date: '2025-08-01', end_date: '2026-05-31' })
      const shsAy = createAcademicYear({ department: 'SHS', label: 'AY 2025', start_date: '2025-08-01', end_date: '2026-05-31' })
      expect(shsAy.department).toBe('SHS')
    })

    it('should create audit log entry', () => {
      const ay = createAcademicYear({ department: 'COLLEGE', label: 'Audited', start_date: '2025-08-01', end_date: '2026-05-31' })
      const db = getTestDb()
      const log = db.prepare("SELECT * FROM audit_log WHERE entity_type = 'academic_year' AND entity_id = ? AND action = 'CREATE'").get(ay.id) as { action: string }
      expect(log).toBeDefined()
    })
  })

  describe('listAcademicYears', () => {
    it('should list by department', () => {
      createAcademicYear({ department: 'COLLEGE', label: 'AY 2025', start_date: '2025-08-01', end_date: '2026-05-31' })
      createAcademicYear({ department: 'SHS', label: 'AY 2025 SHS', start_date: '2025-08-01', end_date: '2026-05-31' })

      expect(listAcademicYears('COLLEGE').length).toBe(1)
      expect(listAcademicYears('SHS').length).toBe(1)
    })
  })

  describe('publishAcademicYear', () => {
    it('should reject publishing already-published AY', () => {
      const ay = createAcademicYear({ department: 'COLLEGE', label: 'Published', start_date: '2025-08-01', end_date: '2026-05-31' })
      expect(ay.status).toBe('PUBLISHED')
      expect(() => publishAcademicYear(ay.id)).toThrow(/already published/)
    })

    it('should publish a DRAFT AY when no active AY blocks it', () => {
      const ay1 = createAcademicYear({ department: 'COLLEGE', label: 'AY 2024', start_date: '2024-01-01', end_date: '2024-06-30' })
      // Set the first AY's end_date to the past so it doesn't block
      const db = getTestDb()
      db.prepare("UPDATE academic_years SET end_date = '2020-01-01', updated_at = datetime('now') WHERE id = ?").run(ay1.id)

      const ay2 = createAcademicYear({ department: 'COLLEGE', label: 'AY 2025', start_date: '2025-08-01', end_date: '2026-05-31' })
      expect(ay2.status).toBe('DRAFT')

      const published = publishAcademicYear(ay2.id)
      expect(published.status).toBe('PUBLISHED')
      expect(published.is_active).toBe(1)
    })
  })

  describe('deleteAcademicYear', () => {
    it('should soft-delete a DRAFT academic year', () => {
      const ay1 = createAcademicYear({ department: 'COLLEGE', label: 'Active', start_date: '2024-08-01', end_date: '2025-05-31' })
      const ay2 = createAcademicYear({ department: 'COLLEGE', label: 'Draft', start_date: '2025-08-01', end_date: '2026-05-31' })

      deleteAcademicYear(ay2.id)
      expect(getArchivedAcademicYears().some((a) => a.id === ay2.id)).toBe(true)
    })
  })

  describe('restoreAcademicYear', () => {
    it('should restore from archive', () => {
      const ay1 = createAcademicYear({ department: 'COLLEGE', label: 'Active', start_date: '2024-08-01', end_date: '2025-05-31' })
      const ay2 = createAcademicYear({ department: 'COLLEGE', label: 'ToRestore', start_date: '2025-08-01', end_date: '2026-05-31' })
      deleteAcademicYear(ay2.id)
      const restored = restoreAcademicYear(ay2.id)
      expect(restored.archived_at).toBeNull()
    })
  })

  describe('permanentDeleteAcademicYear', () => {
    it('should permanently delete from archive', () => {
      const ay1 = createAcademicYear({ department: 'COLLEGE', label: 'Active', start_date: '2024-08-01', end_date: '2025-05-31' })
      const ay2 = createAcademicYear({ department: 'COLLEGE', label: 'ToPermDelete', start_date: '2025-08-01', end_date: '2026-05-31' })
      deleteAcademicYear(ay2.id)
      permanentDeleteAcademicYear(ay2.id)

      const db = getTestDb()
      const row = db.prepare('SELECT * FROM academic_years WHERE id = ?').get(ay2.id)
      expect(row).toBeUndefined()
    })
  })
})
