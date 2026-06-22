// ============================================================
// Section Service — Unit Tests
// ============================================================

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { randomUUID } from 'crypto'
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

// Now import the services — they'll use the mocked getDatabase()
import {
  createSection,
  listSections,
  getSection,
  updateSection,
  deleteSection,
  restoreSection,
  permanentDeleteSection,
  getArchivedSections,
  getCascadeCount
} from '../../services/section-service'

// ── Helpers ─────────────────────────────────────────────────

/**
 * Seed the prerequisite academic_year + semester rows that sections FK into.
 * Returns the IDs for use in test data.
 */
function seedPrerequisites(dept: 'COLLEGE' | 'SHS' = 'COLLEGE') {
  const db = getTestDb()
  const ayId = randomUUID()
  const semId = randomUUID()

  db.prepare(
    `INSERT INTO academic_years (id, department, label, start_date, end_date, is_active, status, created_at, updated_at)
     VALUES (?, ?, 'AY 2025-2026', '2025-08-01', '2026-05-31', 1, 'PUBLISHED', datetime('now'), datetime('now'))`
  ).run(ayId, dept)

  db.prepare(
    `INSERT INTO semesters (id, academic_year_id, department, semester_type, start_date, end_date, is_active, status, created_at, updated_at)
     VALUES (?, ?, ?, '1ST_SEMESTER', '2025-08-01', '2025-12-15', 1, 'PUBLISHED', datetime('now'), datetime('now'))`
  ).run(semId, ayId, dept)

  return { ayId, semId }
}

describe('Section Service', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  beforeEach(() => {
    cleanAllTables()
  })

  // ── createSection ─────────────────────────────────────────

  describe('createSection', () => {
    it('should create a section with required fields', () => {
      const { ayId, semId } = seedPrerequisites()

      const section = createSection({
        department: 'COLLEGE',
        section_code: 'BSCS-1A',
        student_count: 40,
        academic_year_id: ayId,
        semester_id: semId
      })

      expect(section).toBeDefined()
      expect(section.id).toBeDefined()
      expect(section.department).toBe('COLLEGE')
      expect(section.section_code).toBe('BSCS-1A')
      expect(section.student_count).toBe(40)
      expect(section.academic_year_id).toBe(ayId)
      expect(section.semester_id).toBe(semId)
      expect(section.status).toBe('ACTIVE')
      expect(section.is_active).toBe(1)
      expect(section.archived_at).toBeNull()
    })

    it('should reject duplicate section_code in the same AY + semester', () => {
      const { ayId, semId } = seedPrerequisites()

      createSection({
        department: 'COLLEGE',
        section_code: 'DUP-1A',
        student_count: 30,
        academic_year_id: ayId,
        semester_id: semId
      })

      expect(() => {
        createSection({
          department: 'COLLEGE',
          section_code: 'DUP-1A',
          student_count: 25,
          academic_year_id: ayId,
          semester_id: semId
        })
      }).toThrow(/already exists/)
    })

    it('should reject student_count less than 1', () => {
      const { ayId, semId } = seedPrerequisites()

      expect(() => {
        createSection({
          department: 'COLLEGE',
          section_code: 'LOW-1A',
          student_count: 0,
          academic_year_id: ayId,
          semester_id: semId
        })
      }).toThrow(/Student count must be between 1 and 5,000/)
    })

    it('should reject student_count greater than 5000', () => {
      const { ayId, semId } = seedPrerequisites()

      expect(() => {
        createSection({
          department: 'COLLEGE',
          section_code: 'HIGH-1A',
          student_count: 5001,
          academic_year_id: ayId,
          semester_id: semId
        })
      }).toThrow(/Student count must be between 1 and 5,000/)
    })

    it('should create an audit log entry', () => {
      const { ayId, semId } = seedPrerequisites()

      const section = createSection({
        department: 'COLLEGE',
        section_code: 'AUD-1A',
        student_count: 35,
        academic_year_id: ayId,
        semester_id: semId
      })

      const db = getTestDb()
      const logs = db
        .prepare("SELECT * FROM audit_log WHERE entity_type = 'section' AND entity_id = ?")
        .all(section.id) as Array<{ action: string }>

      expect(logs.length).toBe(1)
      expect(logs[0].action).toBe('CREATE')
    })
  })

  // ── listSections ──────────────────────────────────────────

  describe('listSections', () => {
    it('should filter by department', () => {
      const college = seedPrerequisites('COLLEGE')
      const shs = seedPrerequisites('SHS')

      createSection({
        department: 'COLLEGE',
        section_code: 'COL-1A',
        student_count: 40,
        academic_year_id: college.ayId,
        semester_id: college.semId
      })

      createSection({
        department: 'SHS',
        section_code: 'SHS-1A',
        student_count: 35,
        academic_year_id: shs.ayId,
        semester_id: shs.semId
      })

      const collegeSections = listSections({ department: 'COLLEGE' })
      expect(collegeSections.length).toBe(1)
      expect(collegeSections[0].section_code).toBe('COL-1A')

      const shsSections = listSections({ department: 'SHS' })
      expect(shsSections.length).toBe(1)
      expect(shsSections[0].section_code).toBe('SHS-1A')
    })

    it('should return all active sections when no filters given', () => {
      const { ayId, semId } = seedPrerequisites()

      createSection({ department: 'COLLEGE', section_code: 'A-1', student_count: 10, academic_year_id: ayId, semester_id: semId })
      createSection({ department: 'COLLEGE', section_code: 'B-1', student_count: 20, academic_year_id: ayId, semester_id: semId })

      const sections = listSections()
      expect(sections.length).toBe(2)
    })

    it('should not include archived sections', () => {
      const { ayId, semId } = seedPrerequisites()

      const section = createSection({ department: 'COLLEGE', section_code: 'ARC-1', student_count: 15, academic_year_id: ayId, semester_id: semId })
      deleteSection(section.id)

      const sections = listSections()
      expect(sections.length).toBe(0)
    })
  })

  // ── getSection ────────────────────────────────────────────

  describe('getSection', () => {
    it('should return an existing section by ID', () => {
      const { ayId, semId } = seedPrerequisites()

      const created = createSection({
        department: 'COLLEGE',
        section_code: 'GET-1A',
        section_name: 'Get Test Section',
        student_count: 30,
        academic_year_id: ayId,
        semester_id: semId
      })

      const fetched = getSection(created.id)
      expect(fetched.id).toBe(created.id)
      expect(fetched.section_code).toBe('GET-1A')
      expect(fetched.section_name).toBe('Get Test Section')
    })

    it('should throw NOT_FOUND for non-existent section', () => {
      expect(() => {
        getSection('non-existent-id')
      }).toThrow(/not found/)
    })
  })

  // ── updateSection ─────────────────────────────────────────

  describe('updateSection', () => {
    it('should update section fields', () => {
      const { ayId, semId } = seedPrerequisites()

      const section = createSection({
        department: 'COLLEGE',
        section_code: 'UPD-1A',
        section_name: 'Before Update',
        student_count: 30,
        academic_year_id: ayId,
        semester_id: semId
      })

      const updated = updateSection({
        id: section.id,
        section_name: 'After Update',
        student_count: 45,
        course_program: 'BSCS'
      })

      expect(updated.section_name).toBe('After Update')
      expect(updated.student_count).toBe(45)
      expect(updated.course_program).toBe('BSCS')
      expect(updated.section_code).toBe('UPD-1A') // unchanged
    })

    it('should reject student_count out of bounds on update', () => {
      const { ayId, semId } = seedPrerequisites()

      const section = createSection({
        department: 'COLLEGE',
        section_code: 'BOUNDS-1A',
        student_count: 30,
        academic_year_id: ayId,
        semester_id: semId
      })

      expect(() => {
        updateSection({ id: section.id, student_count: 0 })
      }).toThrow(/Student count must be between 1 and 5,000/)
    })

    it('should create an audit log entry', () => {
      const { ayId, semId } = seedPrerequisites()

      const section = createSection({
        department: 'COLLEGE',
        section_code: 'AUD-UPD',
        student_count: 20,
        academic_year_id: ayId,
        semester_id: semId
      })

      updateSection({ id: section.id, section_name: 'Audited Update' })

      const db = getTestDb()
      const logs = db
        .prepare("SELECT * FROM audit_log WHERE entity_type = 'section' AND entity_id = ? AND action = 'UPDATE'")
        .all(section.id) as Array<{ action: string }>
      expect(logs.length).toBe(1)
    })
  })

  // ── deleteSection (soft delete) ───────────────────────────

  describe('deleteSection', () => {
    it('should soft-delete a section', () => {
      const { ayId, semId } = seedPrerequisites()

      const section = createSection({
        department: 'COLLEGE',
        section_code: 'DEL-1A',
        student_count: 25,
        academic_year_id: ayId,
        semester_id: semId
      })

      deleteSection(section.id)

      // Should not appear in active queries
      expect(() => getSection(section.id)).toThrow(/not found/)

      // Should appear in archived list
      const archived = getArchivedSections()
      expect(archived.some((s) => s.id === section.id)).toBe(true)
    })

    it('should create an audit log entry', () => {
      const { ayId, semId } = seedPrerequisites()

      const section = createSection({
        department: 'COLLEGE',
        section_code: 'DEL-AUD',
        student_count: 20,
        academic_year_id: ayId,
        semester_id: semId
      })

      deleteSection(section.id)

      const db = getTestDb()
      const logs = db
        .prepare("SELECT * FROM audit_log WHERE entity_type = 'section' AND entity_id = ? AND action = 'DELETE'")
        .all(section.id) as Array<{ action: string }>
      expect(logs.length).toBe(1)
    })
  })

  // ── restoreSection ────────────────────────────────────────

  describe('restoreSection', () => {
    it('should restore a soft-deleted section', () => {
      const { ayId, semId } = seedPrerequisites()

      const section = createSection({
        department: 'COLLEGE',
        section_code: 'RES-1A',
        student_count: 30,
        academic_year_id: ayId,
        semester_id: semId
      })

      deleteSection(section.id)
      const restored = restoreSection(section.id)

      expect(restored.archived_at).toBeNull()
      expect(restored.section_code).toBe('RES-1A')

      // Should appear in active queries again
      const active = getSection(restored.id)
      expect(active).toBeDefined()
    })

    it('should throw for non-archived section', () => {
      expect(() => {
        restoreSection('non-existent-id')
      }).toThrow(/not found/)
    })

    it('should create an audit log entry', () => {
      const { ayId, semId } = seedPrerequisites()

      const section = createSection({
        department: 'COLLEGE',
        section_code: 'RES-AUD',
        student_count: 20,
        academic_year_id: ayId,
        semester_id: semId
      })

      deleteSection(section.id)
      restoreSection(section.id)

      const db = getTestDb()
      const logs = db
        .prepare("SELECT * FROM audit_log WHERE entity_type = 'section' AND entity_id = ? AND action = 'RESTORE'")
        .all(section.id) as Array<{ action: string }>
      expect(logs.length).toBe(1)
    })
  })

  // ── permanentDeleteSection ────────────────────────────────

  describe('permanentDeleteSection', () => {
    it('should permanently delete an archived section', () => {
      const { ayId, semId } = seedPrerequisites()

      const section = createSection({
        department: 'COLLEGE',
        section_code: 'PERM-1A',
        student_count: 25,
        academic_year_id: ayId,
        semester_id: semId
      })

      deleteSection(section.id)
      permanentDeleteSection(section.id)

      // Should not appear in archived list
      const archived = getArchivedSections()
      expect(archived.some((s) => s.id === section.id)).toBe(false)

      // Should not exist in the database at all
      const db = getTestDb()
      const row = db.prepare('SELECT * FROM sections WHERE id = ?').get(section.id)
      expect(row).toBeUndefined()
    })

    it('should throw for non-archived section', () => {
      const { ayId, semId } = seedPrerequisites()

      const section = createSection({
        department: 'COLLEGE',
        section_code: 'PERM-ERR',
        student_count: 20,
        academic_year_id: ayId,
        semester_id: semId
      })

      // Section is still active (not archived) — should fail
      expect(() => {
        permanentDeleteSection(section.id)
      }).toThrow(/not found/)
    })

    it('should create an audit log entry', () => {
      const { ayId, semId } = seedPrerequisites()

      const section = createSection({
        department: 'COLLEGE',
        section_code: 'PERM-AUD',
        student_count: 20,
        academic_year_id: ayId,
        semester_id: semId
      })

      deleteSection(section.id)
      permanentDeleteSection(section.id)

      const db = getTestDb()
      const logs = db
        .prepare("SELECT * FROM audit_log WHERE entity_type = 'section' AND entity_id = ? AND action = 'PERMANENT_DELETE'")
        .all(section.id) as Array<{ action: string }>
      expect(logs.length).toBe(1)
    })
  })

  // ── getCascadeCount ───────────────────────────────────────

  describe('getCascadeCount', () => {
    it('should return zero when no schedule entries reference the section', () => {
      const { ayId, semId } = seedPrerequisites()

      const section = createSection({
        department: 'COLLEGE',
        section_code: 'CASCADE-0',
        student_count: 30,
        academic_year_id: ayId,
        semester_id: semId
      })

      const result = getCascadeCount(section.id)
      expect(result.schedule_entries).toBe(0)
    })
  })
})
