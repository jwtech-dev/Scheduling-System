// ============================================================
// Semester Service — TASK-06
// ============================================================

import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { getAcademicYear } from './academic-year-service'
import { randomUUID } from 'crypto'
import type { Semester, Department, SemesterType } from '../../shared/types'
import { ERROR_CODES, SHS_SEMESTER_TYPES, COLLEGE_SEMESTER_TYPES } from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

/**
 * Create a new semester within an academic year.
 */
export function createSemester(data: {
  academic_year_id: string
  semester_type: SemesterType
  start_date: string
  end_date: string
  is_active?: boolean
  q1_end_date?: string | null
  q3_end_date?: string | null
}): Semester {
  const db = getDatabase()
  const ay = getAcademicYear(data.academic_year_id)

  // Validate semester type is valid for the department
  const allowedTypes = ay.department === 'SHS' ? SHS_SEMESTER_TYPES : COLLEGE_SEMESTER_TYPES
  if (!allowedTypes.includes(data.semester_type as never)) {
    throwError(
      ERROR_CODES.VALIDATION_ERROR,
      `${data.semester_type} is not valid for ${ay.department}.`
    )
  }

  // Validate uniqueness within academic year
  const existing = db
    .prepare('SELECT id FROM semesters WHERE academic_year_id = ? AND semester_type = ?')
    .get(data.academic_year_id, data.semester_type)
  if (existing) {
    throwError(ERROR_CODES.DUPLICATE_SEMESTER_TYPE, `${data.semester_type} already exists for this academic year.`)
  }

  // Validate date range
  if (data.start_date >= data.end_date) {
    throwError(ERROR_CODES.INVALID_TIME_RANGE, 'Start date must be before end date.')
  }

  // Validate dates within academic year range
  if (data.start_date < ay.start_date || data.end_date > ay.end_date) {
    throwError(ERROR_CODES.DATE_OUT_OF_RANGE, 'Semester dates must be within the academic year range.')
  }

  // SHS validation — q1_end_date and q3_end_date required
  if (ay.department === 'SHS') {
    if (!data.q1_end_date && data.semester_type === '1ST_SEMESTER') {
      // Optional but recommended — we'll allow null for now
    }
    if (!data.q3_end_date && data.semester_type === '2ND_SEMESTER') {
      // Optional but recommended
    }
  }

  const id = randomUUID()
  const isActive = data.is_active ? 1 : 0

  const create = db.transaction(() => {
    // If activating, deactivate siblings
    if (isActive) {
      db.prepare(
        "UPDATE semesters SET is_active = 0, updated_at = datetime('now') WHERE academic_year_id = ?"
      ).run(data.academic_year_id)
    }

    db.prepare(
      `INSERT INTO semesters (id, academic_year_id, department, semester_type, start_date, end_date,
       is_active, q1_end_date, q3_end_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      id,
      data.academic_year_id,
      ay.department,
      data.semester_type,
      data.start_date,
      data.end_date,
      isActive,
      data.q1_end_date ?? null,
      data.q3_end_date ?? null
    )

    logAudit({
      entity_type: 'semester',
      entity_id: id,
      department: ay.department,
      action: 'CREATE',
      after_snapshot: { ...data, id, department: ay.department }
    })
  })

  create()
  return getSemester(id)
}

/**
 * Update an existing semester.
 */
export function updateSemester(data: {
  id: string
  start_date?: string
  end_date?: string
  is_active?: boolean
  q1_end_date?: string | null
  q3_end_date?: string | null
}): Semester {
  const db = getDatabase()
  const existing = getSemester(data.id)
  const ay = getAcademicYear(existing.academic_year_id)

  const newStartDate = data.start_date ?? existing.start_date
  const newEndDate = data.end_date ?? existing.end_date
  const newIsActive = data.is_active !== undefined ? (data.is_active ? 1 : 0) : existing.is_active

  if (newStartDate >= newEndDate) {
    throwError(ERROR_CODES.INVALID_TIME_RANGE, 'Start date must be before end date.')
  }

  if (newStartDate < ay.start_date || newEndDate > ay.end_date) {
    throwError(ERROR_CODES.DATE_OUT_OF_RANGE, 'Semester dates must be within the academic year range.')
  }

  const update = db.transaction(() => {
    if (newIsActive === 1 && existing.is_active === 0) {
      db.prepare(
        "UPDATE semesters SET is_active = 0, updated_at = datetime('now') WHERE academic_year_id = ?"
      ).run(existing.academic_year_id)
    }

    db.prepare(
      `UPDATE semesters SET start_date = ?, end_date = ?, is_active = ?,
       q1_end_date = ?, q3_end_date = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      newStartDate,
      newEndDate,
      newIsActive,
      data.q1_end_date !== undefined ? data.q1_end_date : existing.q1_end_date,
      data.q3_end_date !== undefined ? data.q3_end_date : existing.q3_end_date,
      data.id
    )

    logAudit({
      entity_type: 'semester',
      entity_id: data.id,
      department: existing.department,
      action: 'UPDATE',
      before_snapshot: existing,
      after_snapshot: { ...existing, start_date: newStartDate, end_date: newEndDate, is_active: newIsActive }
    })
  })

  update()
  return getSemester(data.id)
}

/**
 * Get a semester by ID.
 */
export function getSemester(id: string): Semester {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM semesters WHERE id = ?').get(id) as Semester | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Semester not found: ${id}`)
  return row
}
