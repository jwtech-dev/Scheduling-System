// ============================================================
// Section Service — TASK-10
// ============================================================

import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { randomUUID } from 'crypto'
import type { Section, Department, SectionStatus, GradeLevel } from '../../shared/types'
import { ERROR_CODES, SUBJECT_BANK_TO_SEMESTER_TYPE, YEAR_LEVEL_TO_GRADE_LEVEL } from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

interface SectionFilters {
  department?: Department
  academic_year_id?: string
  semester_id?: string
  grade_level?: GradeLevel
  status?: SectionStatus
  search?: string
}

export function listSections(filters: SectionFilters = {}): Section[] {
  const db = getDatabase()
  const conditions: string[] = ['is_active = 1 AND archived_at IS NULL']
  const params: unknown[] = []

  if (filters.department) { conditions.push('department = ?'); params.push(filters.department) }
  if (filters.academic_year_id) { conditions.push('academic_year_id = ?'); params.push(filters.academic_year_id) }
  if (filters.semester_id) { conditions.push('semester_id = ?'); params.push(filters.semester_id) }
  if (filters.grade_level) { conditions.push('grade_level = ?'); params.push(filters.grade_level) }
  if (filters.status) { conditions.push('status = ?'); params.push(filters.status) }
  if (filters.search) {
    conditions.push('(section_code LIKE ? OR section_name LIKE ? OR subject LIKE ?)')
    const term = `%${filters.search}%`
    params.push(term, term, term)
  }

  return db
    .prepare(`SELECT * FROM sections WHERE ${conditions.join(' AND ')} ORDER BY section_code`)
    .all(...params) as Section[]
}

export function getSection(id: string): Section {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM sections WHERE id = ? AND is_active = 1 AND archived_at IS NULL').get(id) as Section | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Section not found: ${id}`)
  return row
}

export function createSection(data: {
  department: Department
  section_code: string
  section_name?: string
  strand_track?: string
  subject?: string
  course_program?: string
  year_level?: string
  grade_level?: GradeLevel | null
  student_count: number
  academic_year_id: string
  semester_id: string
  adviser_id?: string
}): Section {
  const db = getDatabase()

  // Auto-derive grade_level from year_level if not explicitly provided (SHS only)
  const gradeLevel = data.grade_level
    ?? (data.department === 'SHS' && data.year_level ? YEAR_LEVEL_TO_GRADE_LEVEL[data.year_level] ?? null : null)

  // Validate student_count bounds
  if (data.student_count < 1 || data.student_count > 5000) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Student count must be between 1 and 5,000.')
  }

  // Validate against Subject Bank
  if (data.subject) {
    const programKey = data.department === 'SHS' ? (data.strand_track || '') : (data.course_program || '')
    const bankMatch = db.prepare(
      'SELECT id FROM subject_bank WHERE department = ? AND course_program = ? AND year_level = ? AND subject_name = ? AND is_active = 1 AND archived_at IS NULL'
    ).get(data.department, programKey, data.year_level || '', data.subject)
    if (!bankMatch) {
      throwError(
        ERROR_CODES.VALIDATION_ERROR,
        `Subject "${data.subject}" does not exist in the Subject Bank for program "${programKey}" and year level "${data.year_level}".`
      )
    }
  }

  // Validate uniqueness
  const existing = db
    .prepare(
      'SELECT id FROM sections WHERE department = ? AND section_code = ? AND COALESCE(subject, \'\') = COALESCE(?, \'\') AND academic_year_id = ? AND semester_id = ? AND is_active = 1 AND archived_at IS NULL'
    )
    .get(data.department, data.section_code, data.subject ?? '', data.academic_year_id, data.semester_id)
  if (existing) {
    throwError(ERROR_CODES.DUPLICATE_SECTION_CODE, `Section "${data.section_code}"${data.subject ? ` with subject "${data.subject}"` : ''} already exists in this term.`)
  }

  const id = randomUUID()

  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO sections (id, department, section_code, section_name, strand_track, subject,
       course_program, year_level, grade_level, student_count, academic_year_id, semester_id, adviser_id,
       created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      id, data.department, data.section_code, data.section_name ?? null,
      data.strand_track ?? null, data.subject ?? null, data.course_program ?? null,
      data.year_level ?? null, gradeLevel, data.student_count, data.academic_year_id,
      data.semester_id, data.adviser_id ?? null
    )

    logAudit({
      entity_type: 'section',
      entity_id: id,
      department: data.department,
      action: 'CREATE',
      after_snapshot: { ...data, id }
    })
  })

  create()
  return getSection(id)
}

/**
 * Batch-create section entries by auto-populating subjects from Subject Bank.
 * Looks up all subjects matching the given course_program (or strand_track for SHS)
 * + year_level + department, then creates one section row per subject,
 * mapped to the correct semester within the given academic year.
 */
export function createSectionBatch(data: {
  department: Department
  section_code: string
  section_name?: string
  strand_track?: string
  course_program?: string
  year_level: string
  student_count: number
  academic_year_id: string
  semester_filter?: string   // '1ST' | '2ND' | '3RD' | 'SUMMER' — restrict to one semester if set
}): { created: number; skipped: number; entries: Section[]; skipped_semesters: string[] } {
  const db = getDatabase()

  // Validate student_count bounds
  if (data.student_count < 1 || data.student_count > 5000) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Student count must be between 1 and 5,000.')
  }

  // Determine the program key to match against subject_bank.course_program
  const programKey = data.department === 'SHS'
    ? (data.strand_track || data.course_program || '')
    : (data.course_program || '')

  if (!programKey) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Course/Program (or Strand/Track for SHS) is required for batch creation.')
  }

  // Build a map of semester_type → semester_id for the given academic year
  const semRows = db.prepare(
    'SELECT id, semester_type FROM semesters WHERE academic_year_id = ? AND archived_at IS NULL'
  ).all(data.academic_year_id) as Array<{ id: string; semester_type: string }>

  const semesterIdMap = new Map<string, string>()
  for (const row of semRows) {
    // Map short codes used by subject_bank (1ST, 2ND, 3RD, SUMMER) to semester IDs
    if (row.semester_type === '1ST_SEMESTER') semesterIdMap.set('1ST', row.id)
    else if (row.semester_type === '2ND_SEMESTER') semesterIdMap.set('2ND', row.id)
    else if (row.semester_type === '3RD_SEMESTER') semesterIdMap.set('3RD', row.id)
    else if (row.semester_type === 'SUMMER') semesterIdMap.set('SUMMER', row.id)
  }

  // Look up matching subjects from Subject Bank
  const subjects = db.prepare(
    'SELECT * FROM subject_bank WHERE department = ? AND course_program = ? AND year_level = ? AND is_active = 1 ORDER BY semester_type, subject_code, subject_name'
  ).all(data.department, programKey, data.year_level) as Array<{
    id: string; subject_code: string; subject_name: string; semester_type: string;
    lec_units: number; lab_units: number; course_program: string; year_level: string;
  }>

  if (subjects.length === 0) {
    throwError(ERROR_CODES.VALIDATION_ERROR, `No subjects found in Subject Bank for ${programKey} / ${data.year_level}. Add subjects to the Subject Bank first.`)
  }

  let created = 0
  let skipped = 0
  const entries: Section[] = []
  const skippedSemesters: Set<string> = new Set()

  const batch = db.transaction(() => {
    for (const subj of subjects) {
      // If a semester filter is set, skip subjects not matching that semester
      if (data.semester_filter && subj.semester_type !== data.semester_filter) {
        skipped++
        continue
      }

      // Resolve the semester_id for this subject's semester_type
      const semesterId = semesterIdMap.get(subj.semester_type)
      if (!semesterId) {
        // Semester not configured in this academic year — skip and record
        skippedSemesters.add(subj.semester_type)
        skipped++
        continue
      }

      // Uniqueness: section_code + subject + department + academic_year + semester
      const existing = db.prepare(
        "SELECT id FROM sections WHERE department = ? AND section_code = ? AND COALESCE(subject, '') = ? AND academic_year_id = ? AND semester_id = ? AND is_active = 1 AND archived_at IS NULL"
      ).get(data.department, data.section_code, subj.subject_name, data.academic_year_id, semesterId) as { id: string } | undefined

      if (existing) {
        skipped++
        continue
      }

      const id = randomUUID()
      const sectionGradeLevel = data.department === 'SHS'
        ? YEAR_LEVEL_TO_GRADE_LEVEL[data.year_level] ?? null
        : null
      db.prepare(
        `INSERT INTO sections (id, department, section_code, section_name, strand_track, subject,
         course_program, year_level, grade_level, student_count, academic_year_id, semester_id, semester_type,
         created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).run(
        id, data.department, data.section_code, data.section_name ?? null,
        data.strand_track ?? null, subj.subject_name, data.course_program ?? programKey,
        data.year_level, sectionGradeLevel, data.student_count, data.academic_year_id, semesterId, subj.semester_type
      )

      logAudit({
        entity_type: 'section',
        entity_id: id,
        department: data.department,
        action: 'CREATE',
        after_snapshot: { ...data, id, subject: subj.subject_name, semester_type: subj.semester_type }
      })

      entries.push(getSection(id))
      created++
    }
  })

  batch()
  return { created, skipped, entries, skipped_semesters: [...skippedSemesters] }
}

export function updateSection(data: {
  id: string
  section_code?: string
  section_name?: string | null
  strand_track?: string | null
  subject?: string | null
  course_program?: string | null
  year_level?: string | null
  student_count?: number
  adviser_id?: string | null
  status?: SectionStatus
}): Section {
  const db = getDatabase()
  const existing = getSection(data.id)

  // Validate student_count bounds if provided
  if (data.student_count !== undefined && (data.student_count < 1 || data.student_count > 5000)) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Student count must be between 1 and 5,000.')
  }

  // Check uniqueness with full composite key when section_code or subject changes
  const newCode = data.section_code ?? existing.section_code
  const newSubject = data.subject !== undefined ? data.subject : existing.subject
  if (newCode !== existing.section_code || (data.subject !== undefined && newSubject !== existing.subject)) {
    const dup = db
      .prepare(
        `SELECT id FROM sections WHERE department = ? AND section_code = ? AND COALESCE(subject, '') = ?
         AND academic_year_id = ? AND semester_id = ? AND id != ? AND is_active = 1 AND archived_at IS NULL`
      )
      .get(existing.department, newCode, newSubject ?? '', existing.academic_year_id, existing.semester_id, data.id)
    if (dup) {
      throwError(ERROR_CODES.DUPLICATE_SECTION_CODE, `Section "${newCode}"${newSubject ? ` with subject "${newSubject}"` : ''} already exists in this term.`)
    }
  }

  const updated = {
    section_code: data.section_code ?? existing.section_code,
    section_name: data.section_name !== undefined ? data.section_name : existing.section_name,
    strand_track: data.strand_track !== undefined ? data.strand_track : existing.strand_track,
    subject: data.subject !== undefined ? data.subject : existing.subject,
    course_program: data.course_program !== undefined ? data.course_program : existing.course_program,
    year_level: data.year_level !== undefined ? data.year_level : existing.year_level,
    student_count: data.student_count ?? existing.student_count,
    adviser_id: data.adviser_id !== undefined ? data.adviser_id : existing.adviser_id,
    status: data.status ?? existing.status
  }

  // Validate against Subject Bank if updated/changed
  if (updated.subject) {
    const programKey = existing.department === 'SHS' ? (updated.strand_track || '') : (updated.course_program || '')
    const bankMatch = db.prepare(
      'SELECT id FROM subject_bank WHERE department = ? AND course_program = ? AND year_level = ? AND subject_name = ? AND is_active = 1 AND archived_at IS NULL'
    ).get(existing.department, programKey, updated.year_level || '', updated.subject)
    if (!bankMatch) {
      throwError(
        ERROR_CODES.VALIDATION_ERROR,
        `Subject "${updated.subject}" does not exist in the Subject Bank for program "${programKey}" and year level "${updated.year_level}".`
      )
    }
  }

  const update = db.transaction(() => {
    db.prepare(
      `UPDATE sections SET section_code = ?, section_name = ?, strand_track = ?, subject = ?,
       course_program = ?, year_level = ?, student_count = ?, adviser_id = ?, status = ?,
       updated_at = datetime('now') WHERE id = ?`
    ).run(
      updated.section_code, updated.section_name, updated.strand_track, updated.subject,
      updated.course_program, updated.year_level, updated.student_count, updated.adviser_id,
      updated.status, data.id
    )

    logAudit({
      entity_type: 'section',
      entity_id: data.id,
      department: existing.department,
      action: 'UPDATE',
      before_snapshot: existing,
      after_snapshot: { ...existing, ...updated }
    })
  })

  update()
  return getSection(data.id)
}

export function deleteSection(id: string): void {
  const db = getDatabase()
  const existing = getSection(id)

  // Delimiter-bounded matching to prevent substring ID collisions
  const activeEntries = db
    .prepare(
      `SELECT COUNT(*) as count FROM schedule_entries
       WHERE (',' || REPLACE(REPLACE(REPLACE(section_ids, '[', ''), ']', ''), '"', '') || ',') LIKE ('%,' || ? || ',%')
       AND status = 'PUBLISHED' AND is_active = 1`
    )
    .get(id) as { count: number }

  if (activeEntries.count > 0) {
    throwError(ERROR_CODES.DELETE_PROTECTED, `Cannot delete section "${existing.section_code}" — it has ${activeEntries.count} published schedule entries.`)
  }

  const del = db.transaction(() => {
    db.prepare(
      "UPDATE sections SET archived_at = datetime('now'), archived_by = 'admin', updated_at = datetime('now') WHERE id = ?"
    ).run(id)

    logAudit({
      entity_type: 'section',
      entity_id: id,
      department: existing.department,
      action: 'DELETE',
      before_snapshot: existing
    })
  })

  del()
}

/**
 * Get cascade count — number of related schedule entries.
 */
export function getCascadeCount(id: string): { schedule_entries: number } {
  const db = getDatabase()
  const result = db
    .prepare(
      `SELECT COUNT(*) as count FROM schedule_entries
       WHERE (',' || REPLACE(REPLACE(REPLACE(section_ids, '[', ''), ']', ''), '"', '') || ',') LIKE ('%,' || ? || ',%')
       AND is_active = 1`
    )
    .get(id) as { count: number }
  return { schedule_entries: result.count }
}

/**
 * List archived (soft-deleted) sections.
 */
export function getArchivedSections(): Section[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM sections WHERE archived_at IS NOT NULL ORDER BY archived_at DESC')
    .all() as Section[]
}

/**
 * Restore a soft-deleted section.
 */
export function restoreSection(id: string): Section {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM sections WHERE id = ? AND archived_at IS NOT NULL').get(id) as Section | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Archived section not found: ${id}`)

  const restore = db.transaction(() => {
    db.prepare(
      "UPDATE sections SET archived_at = NULL, archived_by = NULL, updated_at = datetime('now') WHERE id = ?"
    ).run(id)

    logAudit({
      entity_type: 'section',
      entity_id: id,
      department: row.department,
      action: 'RESTORE',
      before_snapshot: row
    })
  })

  restore()
  return getSection(id)
}

/**
 * Permanently delete a section from the database.
 */
export function permanentDeleteSection(id: string): void {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM sections WHERE id = ? AND archived_at IS NOT NULL').get(id) as Section | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Archived section not found: ${id}`)

  const del = db.transaction(() => {
    db.prepare('DELETE FROM sections WHERE id = ?').run(id)

    logAudit({
      entity_type: 'section',
      entity_id: id,
      department: row.department,
      action: 'PERMANENT_DELETE',
      before_snapshot: row
    })
  })

  del()
}
