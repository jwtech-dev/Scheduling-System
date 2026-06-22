// ============================================================
// Carry Forward Service — Unit Tests
// ============================================================

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { setupTestDb, teardownTestDb, cleanAllTables, getTestDb } from '../helpers/test-db'
import { randomUUID } from 'crypto'

vi.mock('../../database/connection', async () => {
  const helpers = await import('../helpers/test-db')
  return {
    getDatabase: () => helpers.getTestDb(),
    initDatabase: vi.fn(),
    closeDatabase: vi.fn(),
    getDbPath: vi.fn(() => ':memory:')
  }
})

import { previewCarryForward, executeCarryForward } from '../../services/carry-forward-service'

describe('Carry Forward Service', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  beforeEach(() => {
    cleanAllTables()
  })

  /**
   * Seed source and target academic years + semesters.
   * Returns IDs for both terms.
   */
  function seedTerms() {
    const db = getTestDb()
    const sourceAyId = randomUUID()
    const sourceSemId = randomUUID()
    const targetAyId = randomUUID()
    const targetSemId = randomUUID()

    // Source AY + semester
    db.prepare(`INSERT INTO academic_years (id, department, label, start_date, end_date, is_active, status, created_at, updated_at)
      VALUES (?, 'COLLEGE', 'AY 2024-2025', '2024-08-01', '2025-05-31', 0, 'PUBLISHED', datetime('now'), datetime('now'))`).run(sourceAyId)

    db.prepare(`INSERT INTO semesters (id, academic_year_id, department, semester_type, start_date, end_date, is_active, status, created_at, updated_at)
      VALUES (?, ?, 'COLLEGE', '1ST_SEMESTER', '2024-08-01', '2024-12-15', 0, 'PUBLISHED', datetime('now'), datetime('now'))`).run(sourceSemId, sourceAyId)

    // Target AY + semester
    db.prepare(`INSERT INTO academic_years (id, department, label, start_date, end_date, is_active, status, created_at, updated_at)
      VALUES (?, 'COLLEGE', 'AY 2025-2026', '2025-08-01', '2026-05-31', 1, 'PUBLISHED', datetime('now'), datetime('now'))`).run(targetAyId)

    db.prepare(`INSERT INTO semesters (id, academic_year_id, department, semester_type, start_date, end_date, is_active, status, created_at, updated_at)
      VALUES (?, ?, 'COLLEGE', '1ST_SEMESTER', '2025-08-01', '2025-12-15', 1, 'PUBLISHED', datetime('now'), datetime('now'))`).run(targetSemId, targetAyId)

    return { sourceAyId, sourceSemId, targetAyId, targetSemId }
  }

  function seedSourceSection(sourceAyId: string, sourceSemId: string) {
    const db = getTestDb()
    const sectionId = randomUUID()
    db.prepare(`INSERT INTO sections (id, department, section_code, section_name, academic_year_id, semester_id, is_active, created_at, updated_at)
      VALUES (?, 'COLLEGE', 'CS-1A', 'CS Section 1A', ?, ?, 1, datetime('now'), datetime('now'))`).run(sectionId, sourceAyId, sourceSemId)
    return sectionId
  }

  // ── Preview ───────────────────────────────────────────────────

  describe('previewCarryForward', () => {
    it('should return counts of items to carry forward', () => {
      const { sourceAyId, sourceSemId, targetAyId, targetSemId } = seedTerms()
      seedSourceSection(sourceAyId, sourceSemId)

      const preview = previewCarryForward({
        department: 'COLLEGE',
        source_academic_year_id: sourceAyId,
        source_semester_id: sourceSemId,
        target_academic_year_id: targetAyId,
        target_semester_id: targetSemId,
        entities: ['SECTIONS']
      })

      expect(preview.counts.SECTIONS).toBe(1)
      expect(preview.source_label).toContain('AY 2024-2025')
      expect(preview.target_label).toContain('AY 2025-2026')
    })

    it('should return 0 counts when source has no data', () => {
      const { sourceAyId, sourceSemId, targetAyId, targetSemId } = seedTerms()

      const preview = previewCarryForward({
        department: 'COLLEGE',
        source_academic_year_id: sourceAyId,
        source_semester_id: sourceSemId,
        target_academic_year_id: targetAyId,
        target_semester_id: targetSemId,
        entities: ['SECTIONS']
      })

      expect(preview.counts.SECTIONS).toBe(0)
    })

    it('should reject same source and target semester', () => {
      const { sourceAyId, sourceSemId } = seedTerms()

      expect(() =>
        previewCarryForward({
          department: 'COLLEGE',
          source_academic_year_id: sourceAyId,
          source_semester_id: sourceSemId,
          target_academic_year_id: sourceAyId,
          target_semester_id: sourceSemId,
          entities: ['SECTIONS']
        })
      ).toThrow(/same/)
    })

    it('should reject non-existent source AY', () => {
      const { targetAyId, targetSemId } = seedTerms()

      expect(() =>
        previewCarryForward({
          department: 'COLLEGE',
          source_academic_year_id: 'nonexistent',
          source_semester_id: 'nonexistent',
          target_academic_year_id: targetAyId,
          target_semester_id: targetSemId,
          entities: ['SECTIONS']
        })
      ).toThrow(/not found/)
    })
  })

  // ── Execute ───────────────────────────────────────────────────

  describe('executeCarryForward', () => {
    it('should clone sections from source to target', () => {
      const { sourceAyId, sourceSemId, targetAyId, targetSemId } = seedTerms()
      seedSourceSection(sourceAyId, sourceSemId)

      const result = executeCarryForward({
        department: 'COLLEGE',
        source_academic_year_id: sourceAyId,
        source_semester_id: sourceSemId,
        target_academic_year_id: targetAyId,
        target_semester_id: targetSemId,
        entities: ['SECTIONS']
      })

      expect(result.total_created).toBe(1)
      expect(result.total_skipped).toBe(0)

      // Verify cloned section exists in target
      const db = getTestDb()
      const targetSections = db.prepare(
        'SELECT * FROM sections WHERE academic_year_id = ? AND semester_id = ? AND is_active = 1'
      ).all(targetAyId, targetSemId) as any[]

      expect(targetSections).toHaveLength(1)
      expect(targetSections[0].section_code).toBe('CS-1A')
    })

    it('should skip duplicate sections (already exist in target)', () => {
      const { sourceAyId, sourceSemId, targetAyId, targetSemId } = seedTerms()
      seedSourceSection(sourceAyId, sourceSemId)

      // Also add same section to target
      const db = getTestDb()
      db.prepare(`INSERT INTO sections (id, department, section_code, section_name, academic_year_id, semester_id, is_active, created_at, updated_at)
        VALUES (?, 'COLLEGE', 'CS-1A', 'CS Section 1A', ?, ?, 1, datetime('now'), datetime('now'))`).run(randomUUID(), targetAyId, targetSemId)

      const result = executeCarryForward({
        department: 'COLLEGE',
        source_academic_year_id: sourceAyId,
        source_semester_id: sourceSemId,
        target_academic_year_id: targetAyId,
        target_semester_id: targetSemId,
        entities: ['SECTIONS']
      })

      expect(result.total_created).toBe(0)
      expect(result.total_skipped).toBe(1)
    })

    it('should create audit log entry', () => {
      const { sourceAyId, sourceSemId, targetAyId, targetSemId } = seedTerms()
      seedSourceSection(sourceAyId, sourceSemId)

      executeCarryForward({
        department: 'COLLEGE',
        source_academic_year_id: sourceAyId,
        source_semester_id: sourceSemId,
        target_academic_year_id: targetAyId,
        target_semester_id: targetSemId,
        entities: ['SECTIONS']
      })

      const db = getTestDb()
      const audit = db.prepare(
        "SELECT * FROM audit_log WHERE entity_type = 'carry_forward'"
      ).get() as any

      expect(audit).toBeTruthy()
      expect(audit.action).toBe('CREATE')
    })
  })
})
