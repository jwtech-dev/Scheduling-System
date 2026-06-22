// ============================================================
// Quarter Service — Unit Tests
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

import {
  createQuarter,
  getQuarter,
  listQuarters,
  deleteQuarter
} from '../../services/quarter-service'

// ── Seed helpers ──────────────────────────────────────────────

/**
 * Seed an SHS academic year + semester via raw SQL.
 * Semester range: 2025-08-01 → 2025-12-15
 */
function seedSHSPrerequisites() {
  const db = getTestDb()
  const ayId = randomUUID()
  const semId = randomUUID()

  db.prepare(
    `INSERT INTO academic_years (id, department, label, start_date, end_date, is_active, status, created_at, updated_at)
     VALUES (?, 'SHS', 'AY 2025-2026', '2025-08-01', '2026-05-31', 1, 'PUBLISHED', datetime('now'), datetime('now'))`
  ).run(ayId)

  db.prepare(
    `INSERT INTO semesters (id, academic_year_id, department, semester_type, start_date, end_date, is_active, status, created_at, updated_at)
     VALUES (?, ?, 'SHS', '1ST_SEMESTER', '2025-08-01', '2025-12-15', 1, 'PUBLISHED', datetime('now'), datetime('now'))`
  ).run(semId, ayId)

  return { ayId, semId }
}

/**
 * Seed a COLLEGE academic year + semester via raw SQL.
 * Used to verify that quarter creation is rejected for non-SHS departments.
 */
function seedCollegePrerequisites() {
  const db = getTestDb()
  const ayId = randomUUID()
  const semId = randomUUID()

  db.prepare(
    `INSERT INTO academic_years (id, department, label, start_date, end_date, is_active, status, created_at, updated_at)
     VALUES (?, 'COLLEGE', 'AY 2025-2026', '2025-08-01', '2026-05-31', 1, 'PUBLISHED', datetime('now'), datetime('now'))`
  ).run(ayId)

  db.prepare(
    `INSERT INTO semesters (id, academic_year_id, department, semester_type, start_date, end_date, is_active, status, created_at, updated_at)
     VALUES (?, ?, 'COLLEGE', '1ST_SEMESTER', '2025-08-01', '2025-12-15', 1, 'PUBLISHED', datetime('now'), datetime('now'))`
  ).run(semId, ayId)

  return { ayId, semId }
}

// ── Tests ─────────────────────────────────────────────────────

describe('Quarter Service', () => {
  beforeAll(() => {
    setupTestDb()
  })

  beforeEach(() => {
    cleanAllTables()
  })

  afterAll(() => {
    teardownTestDb()
  })

  // ────────────────────────────────────────────────────────────
  // createQuarter
  // ────────────────────────────────────────────────────────────

  describe('createQuarter', () => {
    it('creates a quarter for an SHS semester (happy path)', () => {
      const { semId } = seedSHSPrerequisites()

      const quarter = createQuarter({
        semester_id: semId,
        quarter_label: 'Q1',
        start_date: '2025-08-01',
        end_date: '2025-09-30'
      })

      expect(quarter).toBeDefined()
      expect(quarter.id).toEqual(expect.any(String))
      expect(quarter.semester_id).toBe(semId)
      expect(quarter.department).toBe('SHS')
      expect(quarter.quarter_label).toBe('Q1')
      expect(quarter.start_date).toBe('2025-08-01')
      expect(quarter.end_date).toBe('2025-09-30')
      expect(quarter.is_active).toBe(1)
      expect(quarter.status).toBe('PUBLISHED')
    })

    it('rejects quarter creation for COLLEGE department', () => {
      const { semId } = seedCollegePrerequisites()

      expect(() =>
        createQuarter({
          semester_id: semId,
          quarter_label: 'Q1',
          start_date: '2025-08-01',
          end_date: '2025-09-30'
        })
      ).toThrow('Quarters are only supported for SHS semesters.')
    })

    it('rejects quarter when start_date >= end_date', () => {
      const { semId } = seedSHSPrerequisites()

      // start == end
      expect(() =>
        createQuarter({
          semester_id: semId,
          quarter_label: 'Q1',
          start_date: '2025-09-15',
          end_date: '2025-09-15'
        })
      ).toThrow('Start date must be before end date.')

      // start > end
      expect(() =>
        createQuarter({
          semester_id: semId,
          quarter_label: 'Q1',
          start_date: '2025-10-01',
          end_date: '2025-09-01'
        })
      ).toThrow('Start date must be before end date.')
    })

    it('rejects quarter whose dates fall outside the semester range', () => {
      const { semId } = seedSHSPrerequisites()
      // Semester range is 2025-08-01 → 2025-12-15

      // start_date before semester start
      expect(() =>
        createQuarter({
          semester_id: semId,
          quarter_label: 'Q1',
          start_date: '2025-07-01',
          end_date: '2025-09-30'
        })
      ).toThrow('Quarter dates must be within the semester range.')

      // end_date after semester end
      expect(() =>
        createQuarter({
          semester_id: semId,
          quarter_label: 'Q2',
          start_date: '2025-10-01',
          end_date: '2026-01-15'
        })
      ).toThrow('Quarter dates must be within the semester range.')
    })

    it('rejects duplicate quarter_label within the same semester', () => {
      const { semId } = seedSHSPrerequisites()

      createQuarter({
        semester_id: semId,
        quarter_label: 'Q1',
        start_date: '2025-08-01',
        end_date: '2025-09-15'
      })

      expect(() =>
        createQuarter({
          semester_id: semId,
          quarter_label: 'Q1',
          start_date: '2025-09-16',
          end_date: '2025-10-30'
        })
      ).toThrow('Q1 already exists for this semester.')
    })
  })

  // ────────────────────────────────────────────────────────────
  // listQuarters
  // ────────────────────────────────────────────────────────────

  describe('listQuarters', () => {
    it('returns all non-archived quarters for a semester ordered by start_date', () => {
      const { semId } = seedSHSPrerequisites()

      // Create Q2 first, then Q1 — expect Q1 returned first (ordered by start_date)
      createQuarter({
        semester_id: semId,
        quarter_label: 'Q2',
        start_date: '2025-10-01',
        end_date: '2025-12-15'
      })
      createQuarter({
        semester_id: semId,
        quarter_label: 'Q1',
        start_date: '2025-08-01',
        end_date: '2025-09-30'
      })

      const quarters = listQuarters(semId)

      expect(quarters).toHaveLength(2)
      expect(quarters[0].quarter_label).toBe('Q1')
      expect(quarters[1].quarter_label).toBe('Q2')
    })

    it('returns an empty array when no quarters exist', () => {
      const { semId } = seedSHSPrerequisites()

      const quarters = listQuarters(semId)
      expect(quarters).toEqual([])
    })
  })

  // ────────────────────────────────────────────────────────────
  // getQuarter
  // ────────────────────────────────────────────────────────────

  describe('getQuarter', () => {
    it('returns the quarter when it exists', () => {
      const { semId } = seedSHSPrerequisites()

      const created = createQuarter({
        semester_id: semId,
        quarter_label: 'Q1',
        start_date: '2025-08-01',
        end_date: '2025-09-30'
      })

      const found = getQuarter(created.id)

      expect(found.id).toBe(created.id)
      expect(found.quarter_label).toBe('Q1')
      expect(found.semester_id).toBe(semId)
    })

    it('throws NOT_FOUND for a non-existent quarter', () => {
      expect(() => getQuarter(randomUUID())).toThrow(/Quarter not found/)
    })
  })

  // ────────────────────────────────────────────────────────────
  // deleteQuarter
  // ────────────────────────────────────────────────────────────

  describe('deleteQuarter', () => {
    it('soft-deletes a quarter so it no longer appears in queries', () => {
      const { semId } = seedSHSPrerequisites()

      const quarter = createQuarter({
        semester_id: semId,
        quarter_label: 'Q1',
        start_date: '2025-08-01',
        end_date: '2025-09-30'
      })

      deleteQuarter(quarter.id)

      // getQuarter should now throw NOT_FOUND (archived_at is set)
      expect(() => getQuarter(quarter.id)).toThrow(/Quarter not found/)

      // listQuarters should return empty
      expect(listQuarters(semId)).toHaveLength(0)

      // Verify the row still exists in the DB (soft-delete, not hard-delete)
      const db = getTestDb()
      const raw = db
        .prepare('SELECT archived_at, archived_by FROM quarters WHERE id = ?')
        .get(quarter.id) as { archived_at: string; archived_by: string } | undefined

      expect(raw).toBeDefined()
      expect(raw!.archived_at).toBeTruthy()
      expect(raw!.archived_by).toBe('admin')
    })
  })
})
