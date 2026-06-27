import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
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

vi.mock('../../services/quarter-service', () => ({
  resolveCurrentQuarter: vi.fn(() => null)
}))

import { setupTestDb, teardownTestDb, cleanAllTables, getTestDb } from '../helpers/test-db'
import { getActiveTerm } from '../../services/active-term-service'
import { resolveCurrentQuarter } from '../../services/quarter-service'

// ── Seed helpers ──────────────────────────────────────────────

function seedCollegeTerm() {
  const db = getTestDb()
  const ayId = randomUUID()
  const semId = randomUUID()

  db.prepare(`INSERT INTO academic_years (id, department, label, start_date, end_date, is_active, status, created_at, updated_at)
    VALUES (?, 'COLLEGE', 'AY 2025-2026', '2025-08-01', '2026-05-31', 1, 'PUBLISHED', datetime('now'), datetime('now'))`).run(ayId)

  db.prepare(`INSERT INTO semesters (id, academic_year_id, department, semester_type, start_date, end_date, is_active, status, created_at, updated_at)
    VALUES (?, ?, 'COLLEGE', '1ST_SEMESTER', '2025-08-01', '2025-12-15', 1, 'PUBLISHED', datetime('now'), datetime('now'))`).run(semId, ayId)

  return { ayId, semId }
}

function seedCollegeAyOnly() {
  const db = getTestDb()
  const ayId = randomUUID()

  db.prepare(`INSERT INTO academic_years (id, department, label, start_date, end_date, is_active, status, created_at, updated_at)
    VALUES (?, 'COLLEGE', 'AY 2025-2026', '2025-08-01', '2026-05-31', 1, 'PUBLISHED', datetime('now'), datetime('now'))`).run(ayId)

  return { ayId }
}

function seedCollegeAyWithInactiveSemester() {
  const db = getTestDb()
  const ayId = randomUUID()
  const semId = randomUUID()

  db.prepare(`INSERT INTO academic_years (id, department, label, start_date, end_date, is_active, status, created_at, updated_at)
    VALUES (?, 'COLLEGE', 'AY 2025-2026', '2025-08-01', '2026-05-31', 1, 'PUBLISHED', datetime('now'), datetime('now'))`).run(ayId)

  // Semester exists but is_active = 0
  db.prepare(`INSERT INTO semesters (id, academic_year_id, department, semester_type, start_date, end_date, is_active, status, created_at, updated_at)
    VALUES (?, ?, 'COLLEGE', '1ST_SEMESTER', '2025-08-01', '2025-12-15', 0, 'PUBLISHED', datetime('now'), datetime('now'))`).run(semId, ayId)

  return { ayId, semId }
}

function seedShsTerm() {
  const db = getTestDb()
  const ayId = randomUUID()
  const g11SemId = randomUUID()
  const g12SemId = randomUUID()

  db.prepare(`INSERT INTO academic_years (id, department, label, start_date, end_date, is_active, status, created_at, updated_at)
    VALUES (?, 'SHS', 'AY 2025-2026', '2025-08-01', '2026-05-31', 1, 'PUBLISHED', datetime('now'), datetime('now'))`).run(ayId)

  db.prepare(`INSERT INTO semesters (id, academic_year_id, department, semester_type, grade_level, start_date, end_date, is_active, status, created_at, updated_at)
    VALUES (?, ?, 'SHS', '1ST_SEMESTER', 'GRADE_11', '2025-08-01', '2025-12-15', 1, 'PUBLISHED', datetime('now'), datetime('now'))`).run(g11SemId, ayId)

  db.prepare(`INSERT INTO semesters (id, academic_year_id, department, semester_type, grade_level, start_date, end_date, is_active, status, created_at, updated_at)
    VALUES (?, ?, 'SHS', '1ST_SEMESTER', 'GRADE_12', '2025-08-01', '2025-12-15', 1, 'PUBLISHED', datetime('now'), datetime('now'))`).run(g12SemId, ayId)

  return { ayId, g11SemId, g12SemId }
}

// ── Tests ─────────────────────────────────────────────────────

describe('active-term-service', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  beforeEach(() => {
    cleanAllTables()
    vi.mocked(resolveCurrentQuarter).mockReset().mockReturnValue(null)
  })

  // ── COLLEGE ───────────────────────────────────────────────

  describe('getActiveTerm COLLEGE', () => {
    it('returns active AY and semester', () => {
      const { ayId, semId } = seedCollegeTerm()

      const result = getActiveTerm('COLLEGE')

      expect(result.academicYear).not.toBeNull()
      expect(result.academicYear!.id).toBe(ayId)
      expect(result.academicYear!.department).toBe('COLLEGE')
      expect(result.academicYear!.is_active).toBe(1)

      expect(result.semester).not.toBeNull()
      expect(result.semester!.id).toBe(semId)
      expect(result.semester!.department).toBe('COLLEGE')
      expect(result.semester!.semester_type).toBe('1ST_SEMESTER')
      expect(result.semester!.is_active).toBe(1)

      // College never has quarter or gradeLevelTerms
      expect(result.quarter).toBeNull()
      expect(result.gradeLevelTerms).toBeUndefined()
    })

    it('returns null when no active AY', () => {
      // No data seeded — no active AY exists for COLLEGE

      const result = getActiveTerm('COLLEGE')

      expect(result.academicYear).toBeNull()
      expect(result.semester).toBeNull()
      expect(result.quarter).toBeNull()
    })

    it('returns null semester when AY exists but no active semester', () => {
      const { ayId } = seedCollegeAyWithInactiveSemester()

      const result = getActiveTerm('COLLEGE')

      expect(result.academicYear).not.toBeNull()
      expect(result.academicYear!.id).toBe(ayId)

      // Semester is inactive → should not be returned
      expect(result.semester).toBeNull()
      expect(result.quarter).toBeNull()
    })
  })

  // ── SHS ───────────────────────────────────────────────────

  describe('getActiveTerm SHS', () => {
    it('returns active AY and semester with grade level terms', () => {
      const { ayId, g11SemId, g12SemId } = seedShsTerm()

      const result = getActiveTerm('SHS')

      // AY
      expect(result.academicYear).not.toBeNull()
      expect(result.academicYear!.id).toBe(ayId)
      expect(result.academicYear!.department).toBe('SHS')

      // First active semester found becomes the top-level semester
      expect(result.semester).not.toBeNull()
      expect([g11SemId, g12SemId]).toContain(result.semester!.id)

      // gradeLevelTerms map
      expect(result.gradeLevelTerms).toBeDefined()
      expect(result.gradeLevelTerms!.GRADE_11).toBeDefined()
      expect(result.gradeLevelTerms!.GRADE_11.semester).not.toBeNull()
      expect(result.gradeLevelTerms!.GRADE_11.semester!.id).toBe(g11SemId)
      expect(result.gradeLevelTerms!.GRADE_11.semester!.grade_level).toBe('GRADE_11')

      expect(result.gradeLevelTerms!.GRADE_12).toBeDefined()
      expect(result.gradeLevelTerms!.GRADE_12.semester).not.toBeNull()
      expect(result.gradeLevelTerms!.GRADE_12.semester!.id).toBe(g12SemId)
      expect(result.gradeLevelTerms!.GRADE_12.semester!.grade_level).toBe('GRADE_12')

      // resolveCurrentQuarter was called for each SHS semester
      expect(resolveCurrentQuarter).toHaveBeenCalledWith(g11SemId)
      expect(resolveCurrentQuarter).toHaveBeenCalledWith(g12SemId)
    })
  })
})
