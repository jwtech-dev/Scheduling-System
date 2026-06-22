// ============================================================
// Subject Bank Service & Program Service — Unit Tests
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

// Now import the services — they'll use the mocked getDatabase()
import {
  createSubject,
  listSubjects,
  getSubject,
  updateSubject,
  deleteSubject
} from '../../services/subject-bank-service'

import {
  createProgram,
  listPrograms,
  getProgram,
  updateProgram,
  deleteProgram
} from '../../services/program-service'

// ── Subject Bank Service ──────────────────────────────────────

describe('Subject Bank Service', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  beforeEach(() => {
    cleanAllTables()
  })

  // Helper to build a valid subject payload
  function validSubjectData(overrides: Record<string, unknown> = {}) {
    return {
      subject_code: 'CS101',
      subject_name: 'Intro to Computer Science',
      description: 'Fundamentals of CS',
      course_program: 'BSCS',
      year_level: '1st Year',
      semester_type: '1ST',
      lec_units: 3,
      lab_units: 1,
      pre_requisites: '',
      department: 'COLLEGE' as string,
      ...overrides
    }
  }

  // ── createSubject ─────────────────────────────────────────

  describe('createSubject', () => {
    it('should create a subject with all required fields', () => {
      const subject = createSubject(validSubjectData())

      expect(subject).toBeDefined()
      expect(subject.id).toBeDefined()
      expect(subject.subject_code).toBe('CS101')
      expect(subject.subject_name).toBe('Intro to Computer Science')
      expect(subject.description).toBe('Fundamentals of CS')
      expect(subject.course_program).toBe('BSCS')
      expect(subject.year_level).toBe('1st Year')
      expect(subject.semester_type).toBe('1ST')
      expect(subject.lec_units).toBe(3)
      expect(subject.lab_units).toBe(1)
      expect(subject.department).toBe('COLLEGE')
      expect(subject.is_active).toBe(1)
      expect(subject.archived_at).toBeNull()
      expect(subject.created_at).toBeDefined()
      expect(subject.updated_at).toBeDefined()
    })

    it('should reject when subject_code is missing', () => {
      expect(() =>
        createSubject(validSubjectData({ subject_code: '' }))
      ).toThrow('Subject code is required.')
    })

    it('should reject duplicate subject (same code+program+year+semester+department)', () => {
      createSubject(validSubjectData())

      expect(() =>
        createSubject(validSubjectData())
      ).toThrow(/already exists/)
    })

    it('should allow same subject_code with different course_program', () => {
      createSubject(validSubjectData())
      const second = createSubject(validSubjectData({ course_program: 'BSIT' }))

      expect(second.subject_code).toBe('CS101')
      expect(second.course_program).toBe('BSIT')
    })
  })

  // ── listSubjects ──────────────────────────────────────────

  describe('listSubjects', () => {
    it('should filter subjects by department', () => {
      createSubject(validSubjectData({ subject_code: 'CS101', department: 'COLLEGE' }))
      createSubject(validSubjectData({
        subject_code: 'SHS-MATH1',
        subject_name: 'General Math',
        department: 'SHS',
        course_program: 'STEM'
      }))

      const collegeSubjects = listSubjects({ department: 'COLLEGE' as any })
      expect(collegeSubjects).toHaveLength(1)
      expect(collegeSubjects[0].subject_code).toBe('CS101')

      const shsSubjects = listSubjects({ department: 'SHS' as any })
      expect(shsSubjects).toHaveLength(1)
      expect(shsSubjects[0].subject_code).toBe('SHS-MATH1')
    })

    it('should return all active subjects when no filter is given', () => {
      createSubject(validSubjectData({ subject_code: 'CS101' }))
      createSubject(validSubjectData({ subject_code: 'CS102', subject_name: 'Data Structures' }))

      const all = listSubjects()
      expect(all).toHaveLength(2)
    })

    it('should not return archived subjects', () => {
      const subject = createSubject(validSubjectData())
      deleteSubject(subject.id)

      const all = listSubjects()
      expect(all).toHaveLength(0)
    })
  })

  // ── getSubject ────────────────────────────────────────────

  describe('getSubject', () => {
    it('should return a subject by id', () => {
      const created = createSubject(validSubjectData())
      const found = getSubject(created.id)

      expect(found.id).toBe(created.id)
      expect(found.subject_code).toBe('CS101')
    })

    it('should throw when subject is not found', () => {
      expect(() => getSubject('nonexistent-id')).toThrow(/not found/i)
    })
  })

  // ── updateSubject ─────────────────────────────────────────

  describe('updateSubject', () => {
    it('should update subject fields', () => {
      const created = createSubject(validSubjectData())

      const updated = updateSubject({
        id: created.id,
        subject_name: 'Advanced Computer Science',
        lec_units: 4,
        lab_units: 2,
        description: 'Updated description'
      })

      expect(updated.subject_name).toBe('Advanced Computer Science')
      expect(updated.lec_units).toBe(4)
      expect(updated.lab_units).toBe(2)
      expect(updated.description).toBe('Updated description')
      // Unchanged fields remain
      expect(updated.subject_code).toBe('CS101')
      expect(updated.course_program).toBe('BSCS')
    })

    it('should throw when updating a nonexistent subject', () => {
      expect(() =>
        updateSubject({ id: 'nonexistent-id', subject_name: 'Anything' })
      ).toThrow(/not found/i)
    })
  })

  // ── deleteSubject ─────────────────────────────────────────

  describe('deleteSubject', () => {
    it('should soft-delete the subject and return impact', () => {
      const created = createSubject(validSubjectData())

      const result = deleteSubject(created.id)

      expect(result).toHaveProperty('sectionCount')
      expect(typeof result.sectionCount).toBe('number')

      // Subject should no longer be findable through getSubject
      expect(() => getSubject(created.id)).toThrow(/not found/i)

      // But the row still exists in the DB (soft-deleted)
      const db = getTestDb()
      const raw = db
        .prepare('SELECT * FROM subject_bank WHERE id = ?')
        .get(created.id) as any
      expect(raw).toBeDefined()
      expect(raw.archived_at).not.toBeNull()
    })

    it('should return sectionCount 0 when no sections reference the subject', () => {
      const created = createSubject(validSubjectData())
      const result = deleteSubject(created.id)
      expect(result.sectionCount).toBe(0)
    })
  })
})

// ── Program Service ───────────────────────────────────────────

describe('Program Service', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  beforeEach(() => {
    cleanAllTables()
  })

  // Helper to build a valid program payload
  function validProgramData(overrides: Record<string, unknown> = {}) {
    return {
      name: 'BSCS',
      description: 'Bachelor of Science in Computer Science',
      department: 'COLLEGE' as string,
      ...overrides
    }
  }

  // ── createProgram ─────────────────────────────────────────

  describe('createProgram', () => {
    it('should create a program with all required fields', () => {
      const program = createProgram(validProgramData())

      expect(program).toBeDefined()
      expect(program.id).toBeDefined()
      expect(program.name).toBe('BSCS')
      expect(program.description).toBe('Bachelor of Science in Computer Science')
      expect(program.department).toBe('COLLEGE')
      expect(program.is_active).toBe(1)
      expect(program.archived_at).toBeNull()
      expect(program.created_at).toBeDefined()
      expect(program.updated_at).toBeDefined()
    })

    it('should reject when name is missing', () => {
      expect(() =>
        createProgram(validProgramData({ name: '' }))
      ).toThrow('Program name is required.')
    })

    it('should reject duplicate name + department combination', () => {
      createProgram(validProgramData())

      expect(() =>
        createProgram(validProgramData())
      ).toThrow(/already exists/)
    })

    it('should allow same name in different departments', () => {
      createProgram(validProgramData({ department: 'COLLEGE' }))
      const second = createProgram(validProgramData({ department: 'SHS' }))

      expect(second.name).toBe('BSCS')
      expect(second.department).toBe('SHS')
    })
  })

  // ── listPrograms ──────────────────────────────────────────

  describe('listPrograms', () => {
    it('should filter programs by department', () => {
      createProgram(validProgramData({ name: 'BSCS', department: 'COLLEGE' }))
      createProgram(validProgramData({ name: 'STEM', department: 'SHS' }))

      const collegePrograms = listPrograms({ department: 'COLLEGE' as any })
      expect(collegePrograms).toHaveLength(1)
      expect(collegePrograms[0].name).toBe('BSCS')

      const shsPrograms = listPrograms({ department: 'SHS' as any })
      expect(shsPrograms).toHaveLength(1)
      expect(shsPrograms[0].name).toBe('STEM')
    })

    it('should return all active programs when no filter is given', () => {
      createProgram(validProgramData({ name: 'BSCS' }))
      createProgram(validProgramData({ name: 'BSIT' }))

      const all = listPrograms()
      expect(all).toHaveLength(2)
    })

    it('should not return archived programs', () => {
      const program = createProgram(validProgramData())
      deleteProgram(program.id)

      const all = listPrograms()
      expect(all).toHaveLength(0)
    })
  })

  // ── getProgram ────────────────────────────────────────────

  describe('getProgram', () => {
    it('should return a program by id', () => {
      const created = createProgram(validProgramData())
      const found = getProgram(created.id)

      expect(found.id).toBe(created.id)
      expect(found.name).toBe('BSCS')
    })

    it('should throw when program is not found', () => {
      expect(() => getProgram('nonexistent-id')).toThrow(/not found/i)
    })
  })

  // ── updateProgram ─────────────────────────────────────────

  describe('updateProgram', () => {
    it('should update program fields', () => {
      const created = createProgram(validProgramData())

      const updated = updateProgram({
        id: created.id,
        name: 'BSCS-Updated',
        description: 'Updated description'
      })

      expect(updated.name).toBe('BSCS-Updated')
      expect(updated.description).toBe('Updated description')
      // Department should remain unchanged (not updatable via updateProgram)
      expect(updated.department).toBe('COLLEGE')
    })

    it('should throw when updating a nonexistent program', () => {
      expect(() =>
        updateProgram({ id: 'nonexistent-id', name: 'Anything' })
      ).toThrow(/not found/i)
    })
  })

  // ── deleteProgram ─────────────────────────────────────────

  describe('deleteProgram', () => {
    it('should soft-delete the program and return impact counts', () => {
      const created = createProgram(validProgramData())

      const result = deleteProgram(created.id)

      expect(result).toHaveProperty('subjectCount')
      expect(result).toHaveProperty('sectionCount')
      expect(typeof result.subjectCount).toBe('number')
      expect(typeof result.sectionCount).toBe('number')

      // Program should no longer be findable through getProgram
      expect(() => getProgram(created.id)).toThrow(/not found/i)

      // But the row still exists in the DB (soft-deleted)
      const db = getTestDb()
      const raw = db
        .prepare('SELECT * FROM programs WHERE id = ?')
        .get(created.id) as any
      expect(raw).toBeDefined()
      expect(raw.archived_at).not.toBeNull()
    })

    it('should return zero counts when no subjects or sections reference the program', () => {
      const created = createProgram(validProgramData())
      const result = deleteProgram(created.id)

      expect(result.subjectCount).toBe(0)
      expect(result.sectionCount).toBe(0)
    })

    it('should cascade soft-delete related subjects', () => {
      const program = createProgram(validProgramData())

      // Create a subject under this program
      createSubject({
        subject_code: 'CS101',
        subject_name: 'Intro to CS',
        course_program: 'BSCS',
        year_level: '1st Year',
        semester_type: '1ST',
        department: 'COLLEGE'
      })

      const result = deleteProgram(program.id)
      expect(result.subjectCount).toBe(1)

      // Subject should also be archived
      const db = getTestDb()
      const rawSubject = db
        .prepare('SELECT * FROM subject_bank WHERE subject_code = ?')
        .get('CS101') as any
      expect(rawSubject.archived_at).not.toBeNull()
    })
  })
})
