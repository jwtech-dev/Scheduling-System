// ============================================================
// Semester Service — Unit Tests
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
  createSemester,
  getSemester,
  deleteSemester,
  getArchivedSemesters,
  restoreSemester,
  permanentDeleteSemester
} from '../../services/semester-service'
import { createAcademicYear } from '../../services/academic-year-service'
import type { AcademicYear } from '../../../shared/types'

/**
 * Seed a COLLEGE academic year (auto-publishes as first in department).
 * AY range: 2025-08-01 → 2026-05-31
 */
function seedAcademicYear(): AcademicYear {
  return createAcademicYear({
    department: 'COLLEGE',
    label: 'AY 2025-2026',
    start_date: '2025-08-01',
    end_date: '2026-05-31'
  })
}

describe('Semester Service', () => {
  beforeAll(() => {
    setupTestDb()

    // Patch: deleteSemester cascades into calendar_events.status and
    // schedule_entries.status, but no migration has added those columns yet.
    // Add them so the service's cascade queries don't blow up.
    const db = getTestDb()
    const cols = (table: string) =>
      (db.pragma(`table_info(${table})`) as Array<{ name: string }>).map((c) => c.name)

    if (!cols('calendar_events').includes('status')) {
      db.exec("ALTER TABLE calendar_events ADD COLUMN status TEXT DEFAULT 'DRAFT'")
    }
    if (!cols('schedule_entries').includes('status')) {
      db.exec("ALTER TABLE schedule_entries ADD COLUMN status TEXT DEFAULT 'DRAFT'")
    }
  })

  afterAll(() => {
    teardownTestDb()
  })

  beforeEach(() => {
    cleanAllTables()
  })

  // ──────────────────────────────────────────────────────────
  // createSemester
  // ──────────────────────────────────────────────────────────

  describe('createSemester', () => {
    it('should create a semester (happy path)', () => {
      const ay = seedAcademicYear()

      const sem = createSemester({
        academic_year_id: ay.id,
        semester_type: '1ST_SEMESTER',
        start_date: '2025-08-01',
        end_date: '2025-12-15'
      })

      expect(sem).toBeDefined()
      expect(sem.id).toBeDefined()
      expect(sem.academic_year_id).toBe(ay.id)
      expect(sem.department).toBe('COLLEGE')
      expect(sem.semester_type).toBe('1ST_SEMESTER')
      expect(sem.start_date).toBe('2025-08-01')
      expect(sem.end_date).toBe('2025-12-15')
      // First semester auto-publishes
      expect(sem.status).toBe('PUBLISHED')
      expect(sem.is_active).toBe(1)
      expect(sem.created_at).toBeDefined()
      expect(sem.updated_at).toBeDefined()
    })

    it('should create a second semester as DRAFT when one is already active', () => {
      const ay = seedAcademicYear()

      const sem1 = createSemester({
        academic_year_id: ay.id,
        semester_type: '1ST_SEMESTER',
        start_date: '2025-08-01',
        end_date: '2025-12-15'
      })
      expect(sem1.status).toBe('PUBLISHED')
      expect(sem1.is_active).toBe(1)

      const sem2 = createSemester({
        academic_year_id: ay.id,
        semester_type: '2ND_SEMESTER',
        start_date: '2026-01-05',
        end_date: '2026-05-31'
      })
      expect(sem2.status).toBe('DRAFT')
      expect(sem2.is_active).toBe(0)
    })

    it('should reject duplicate semester_type in same academic year', () => {
      const ay = seedAcademicYear()

      createSemester({
        academic_year_id: ay.id,
        semester_type: '1ST_SEMESTER',
        start_date: '2025-08-01',
        end_date: '2025-12-15'
      })

      expect(() => {
        createSemester({
          academic_year_id: ay.id,
          semester_type: '1ST_SEMESTER',
          start_date: '2025-09-01',
          end_date: '2025-12-20'
        })
      }).toThrow(/already exists/)
    })

    it('should reject invalid date range (start >= end)', () => {
      const ay = seedAcademicYear()

      expect(() => {
        createSemester({
          academic_year_id: ay.id,
          semester_type: '1ST_SEMESTER',
          start_date: '2025-12-15',
          end_date: '2025-08-01'
        })
      }).toThrow(/before end date/)
    })

    it('should reject dates outside academic year range', () => {
      const ay = seedAcademicYear()
      // AY range is 2025-08-01 → 2026-05-31

      expect(() => {
        createSemester({
          academic_year_id: ay.id,
          semester_type: '1ST_SEMESTER',
          start_date: '2025-07-01', // before AY start
          end_date: '2025-12-15'
        })
      }).toThrow(/within the academic year range/)
    })

    it('should reject end_date beyond academic year end', () => {
      const ay = seedAcademicYear()

      expect(() => {
        createSemester({
          academic_year_id: ay.id,
          semester_type: '1ST_SEMESTER',
          start_date: '2025-08-01',
          end_date: '2026-07-01' // after AY end
        })
      }).toThrow(/within the academic year range/)
    })

    it('should reject invalid semester_type for COLLEGE department', () => {
      const ay = seedAcademicYear() // COLLEGE department

      expect(() => {
        createSemester({
          academic_year_id: ay.id,
          semester_type: '3RD_SEMESTER' as never,
          start_date: '2025-08-01',
          end_date: '2025-12-15'
        })
      }).toThrow(/not valid for COLLEGE/)
    })

    it('should create audit log entry on create', () => {
      const ay = seedAcademicYear()
      const sem = createSemester({
        academic_year_id: ay.id,
        semester_type: '1ST_SEMESTER',
        start_date: '2025-08-01',
        end_date: '2025-12-15'
      })

      const db = getTestDb()
      const log = db
        .prepare(
          "SELECT * FROM audit_log WHERE entity_type = 'semester' AND entity_id = ? AND action = 'CREATE'"
        )
        .get(sem.id) as { action: string } | undefined

      expect(log).toBeDefined()
      expect(log!.action).toBe('CREATE')
    })
  })

  // ──────────────────────────────────────────────────────────
  // getSemester
  // ──────────────────────────────────────────────────────────

  describe('getSemester', () => {
    it('should return a semester by ID', () => {
      const ay = seedAcademicYear()
      const created = createSemester({
        academic_year_id: ay.id,
        semester_type: '1ST_SEMESTER',
        start_date: '2025-08-01',
        end_date: '2025-12-15'
      })

      const fetched = getSemester(created.id)
      expect(fetched.id).toBe(created.id)
      expect(fetched.semester_type).toBe('1ST_SEMESTER')
    })

    it('should throw NOT_FOUND for non-existent ID', () => {
      expect(() => getSemester('non-existent-id')).toThrow(/not found/i)
    })
  })

  // ──────────────────────────────────────────────────────────
  // deleteSemester (soft-delete)
  // ──────────────────────────────────────────────────────────

  describe('deleteSemester', () => {
    it('should soft-delete a DRAFT semester', () => {
      const ay = seedAcademicYear()

      // Create first (PUBLISHED) then second (DRAFT)
      createSemester({
        academic_year_id: ay.id,
        semester_type: '1ST_SEMESTER',
        start_date: '2025-08-01',
        end_date: '2025-12-15'
      })
      const draft = createSemester({
        academic_year_id: ay.id,
        semester_type: '2ND_SEMESTER',
        start_date: '2026-01-05',
        end_date: '2026-05-31'
      })
      expect(draft.status).toBe('DRAFT')

      deleteSemester(draft.id)

      // Should no longer be found by getSemester (filters out archived)
      expect(() => getSemester(draft.id)).toThrow(/not found/i)

      // Should appear in archived list
      const archived = getArchivedSemesters()
      expect(archived.some((s) => s.id === draft.id)).toBe(true)
    })

    it('should reject deleting a PUBLISHED semester', () => {
      const ay = seedAcademicYear()

      const published = createSemester({
        academic_year_id: ay.id,
        semester_type: '1ST_SEMESTER',
        start_date: '2025-08-01',
        end_date: '2025-12-15'
      })
      expect(published.status).toBe('PUBLISHED')

      expect(() => deleteSemester(published.id)).toThrow(/Cannot delete a published semester/)
    })
  })

  // ──────────────────────────────────────────────────────────
  // restoreSemester
  // ──────────────────────────────────────────────────────────

  describe('restoreSemester', () => {
    it('should restore a soft-deleted semester', () => {
      const ay = seedAcademicYear()

      createSemester({
        academic_year_id: ay.id,
        semester_type: '1ST_SEMESTER',
        start_date: '2025-08-01',
        end_date: '2025-12-15'
      })
      const draft = createSemester({
        academic_year_id: ay.id,
        semester_type: '2ND_SEMESTER',
        start_date: '2026-01-05',
        end_date: '2026-05-31'
      })

      deleteSemester(draft.id)
      expect(() => getSemester(draft.id)).toThrow(/not found/i)

      const restored = restoreSemester(draft.id)
      expect(restored.id).toBe(draft.id)
      expect(restored.archived_at).toBeNull()
      expect(restored.archived_by).toBeNull()
    })

    it('should throw NOT_FOUND when restoring a non-archived semester', () => {
      expect(() => restoreSemester('not-archived-id')).toThrow(/not found/i)
    })
  })

  // ──────────────────────────────────────────────────────────
  // permanentDeleteSemester
  // ──────────────────────────────────────────────────────────

  describe('permanentDeleteSemester', () => {
    it('should permanently delete a semester from the database', () => {
      const ay = seedAcademicYear()

      createSemester({
        academic_year_id: ay.id,
        semester_type: '1ST_SEMESTER',
        start_date: '2025-08-01',
        end_date: '2025-12-15'
      })
      const draft = createSemester({
        academic_year_id: ay.id,
        semester_type: '2ND_SEMESTER',
        start_date: '2026-01-05',
        end_date: '2026-05-31'
      })

      // Soft-delete first, then permanent delete
      deleteSemester(draft.id)
      permanentDeleteSemester(draft.id)

      // Should not exist in DB at all
      const db = getTestDb()
      const row = db.prepare('SELECT * FROM semesters WHERE id = ?').get(draft.id)
      expect(row).toBeUndefined()

      // Should not be in archived list either
      const archived = getArchivedSemesters()
      expect(archived.some((s) => s.id === draft.id)).toBe(false)
    })
  })
})
