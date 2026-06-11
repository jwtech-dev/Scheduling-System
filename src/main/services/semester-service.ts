// ============================================================
// Semester Service — TASK-06
// ============================================================

import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { getAcademicYear } from './academic-year-service'
import { randomUUID } from 'crypto'
import type { Semester, Department, SemesterType, SemesterStatus } from '../../shared/types'
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
    .prepare('SELECT id FROM semesters WHERE academic_year_id = ? AND semester_type = ? AND archived_at IS NULL')
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

  // Auto-detect draft status: if a sibling semester is currently active, save as DRAFT
  const activeSibling = db
    .prepare('SELECT id FROM semesters WHERE academic_year_id = ? AND is_active = 1 AND archived_at IS NULL')
    .get(data.academic_year_id) as { id: string } | undefined

  const shouldDraft = !!activeSibling
  const status: SemesterStatus = shouldDraft ? 'DRAFT' : 'PUBLISHED'
  const isActive = shouldDraft ? 0 : 1

  const create = db.transaction(() => {
    // If activating (no sibling active), deactivate any remaining siblings just in case
    if (isActive) {
      db.prepare(
        "UPDATE semesters SET is_active = 0, updated_at = datetime('now') WHERE academic_year_id = ?"
      ).run(data.academic_year_id)
    }

    db.prepare(
      `INSERT INTO semesters (id, academic_year_id, department, semester_type, start_date, end_date,
       is_active, status, q1_end_date, q3_end_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      id,
      data.academic_year_id,
      ay.department,
      data.semester_type,
      data.start_date,
      data.end_date,
      isActive,
      status,
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
 * Publish a draft semester — gate by active sibling's end date.
 * The semester can only be published once the currently active semester's end_date has passed.
 */
export function publishSemester(id: string): Semester {
  const db = getDatabase()
  const semester = getSemester(id)

  if (semester.status === 'PUBLISHED') {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Semester is already published.')
  }

  // Check if there's an active sibling whose end_date hasn't passed yet
  const activeSibling = db
    .prepare(
      'SELECT * FROM semesters WHERE academic_year_id = ? AND is_active = 1 AND id != ? AND archived_at IS NULL'
    )
    .get(semester.academic_year_id, id) as Semester | undefined

  if (activeSibling) {
    const today = new Date().toISOString().split('T')[0]
    if (today < activeSibling.end_date) {
      throwError(
        ERROR_CODES.SEMESTER_PUBLISH_BLOCKED,
        `Cannot publish until the current semester ends on ${activeSibling.end_date}.`
      )
    }
  }

  const publish = db.transaction(() => {
    // Deactivate all siblings
    db.prepare(
      "UPDATE semesters SET is_active = 0, updated_at = datetime('now') WHERE academic_year_id = ?"
    ).run(semester.academic_year_id)

    // Publish and activate this semester
    db.prepare(
      "UPDATE semesters SET status = 'PUBLISHED', is_active = 1, updated_at = datetime('now') WHERE id = ?"
    ).run(id)

    logAudit({
      entity_type: 'semester',
      entity_id: id,
      department: semester.department,
      action: 'PUBLISH',
      before_snapshot: semester,
      after_snapshot: { ...semester, status: 'PUBLISHED', is_active: 1 }
    })
  })

  publish()
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

  // Guard: only DRAFT semesters can be edited
  if (existing.status === 'PUBLISHED') {
    throwError(ERROR_CODES.CANNOT_EDIT_PUBLISHED, 'Cannot edit a published semester.')
  }

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
  const row = db.prepare('SELECT * FROM semesters WHERE id = ? AND archived_at IS NULL').get(id) as Semester | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Semester not found: ${id}`)
  return row
}

/**
 * Soft-delete a semester (set archived_at timestamp).
 */
export function deleteSemester(id: string): void {
  const db = getDatabase()
  const existing = getSemester(id)

  // Guard: only DRAFT semesters can be deleted
  if (existing.status === 'PUBLISHED') {
    throwError(ERROR_CODES.DELETE_PROTECTED, 'Cannot delete a published semester.')
  }

  const del = db.transaction(() => {
    db.prepare(
      "UPDATE semesters SET archived_at = datetime('now'), archived_by = 'admin', updated_at = datetime('now') WHERE id = ?"
    ).run(id)

    logAudit({
      entity_type: 'semester',
      entity_id: id,
      department: existing.department,
      action: 'DELETE',
      before_snapshot: existing
    })
  })

  del()
}

/**
 * Get cascade count — number of related records that would be affected.
 */
export function getCascadeCount(id: string): { schedule_entries: number; calendar_events: number } {
  const db = getDatabase()

  const scheduleEntries = db
    .prepare('SELECT COUNT(*) as count FROM schedule_entries WHERE semester_id = ?')
    .get(id) as { count: number }

  const calendarEvents = db
    .prepare('SELECT COUNT(*) as count FROM calendar_events WHERE semester_id = ?')
    .get(id) as { count: number }

  return {
    schedule_entries: scheduleEntries.count,
    calendar_events: calendarEvents.count
  }
}

/**
 * Get all archived (soft-deleted) semesters.
 */
export function getArchivedSemesters(): Semester[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM semesters WHERE archived_at IS NOT NULL ORDER BY archived_at DESC')
    .all() as Semester[]
}

/**
 * Restore a soft-deleted semester.
 */
export function restoreSemester(id: string): Semester {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM semesters WHERE id = ? AND archived_at IS NOT NULL').get(id) as
    | Semester
    | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Archived semester not found: ${id}`)

  db.prepare(
    "UPDATE semesters SET archived_at = NULL, archived_by = NULL, updated_at = datetime('now') WHERE id = ?"
  ).run(id)

  logAudit({
    entity_type: 'semester',
    entity_id: id,
    department: row.department,
    action: 'UPDATE',
    before_snapshot: row,
    after_snapshot: { ...row, archived_at: null, archived_by: null }
  })

  return getSemester(id)
}

/**
 * Permanently delete a semester from the database.
 */
export function permanentDeleteSemester(id: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM semesters WHERE id = ?').run(id)
}
