// ============================================================
// Semester Service — TASK-06
// ============================================================

import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { getAcademicYear } from './academic-year-service'
import { randomUUID } from 'crypto'
import type { Semester, Department, SemesterType, SemesterStatus, GradeLevel, TermType } from '../../shared/types'
import {
  ERROR_CODES,
  SHS_SEMESTER_TYPES,
  SHS_TWO_SEM_SEMESTER_TYPES,
  SHS_TRIMESTRAL_SEMESTER_TYPES,
  COLLEGE_SEMESTER_TYPES
} from '../../shared/constants'

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
  grade_level?: GradeLevel | null
  term_type?: TermType | null
}): Semester {
  const db = getDatabase()
  const ay = getAcademicYear(data.academic_year_id)

  const gradeLevel = ay.department === 'SHS' ? (data.grade_level ?? null) : null
  const termType = ay.department === 'SHS' ? (data.term_type ?? null) : null

  // Validate semester type is valid for the department + term type
  if (ay.department === 'SHS' && termType) {
    const allowedTypes = termType === 'TRIMESTRAL'
      ? SHS_TRIMESTRAL_SEMESTER_TYPES
      : SHS_TWO_SEM_SEMESTER_TYPES
    if (!allowedTypes.includes(data.semester_type as never)) {
      throwError(
        ERROR_CODES.VALIDATION_ERROR,
        `${data.semester_type} is not valid for ${termType} term type.`
      )
    }
  } else {
    const allowedTypes = ay.department === 'SHS' ? SHS_SEMESTER_TYPES : COLLEGE_SEMESTER_TYPES
    if (!allowedTypes.includes(data.semester_type as never)) {
      throwError(
        ERROR_CODES.VALIDATION_ERROR,
        `${data.semester_type} is not valid for ${ay.department}.`
      )
    }
  }

  // Validate uniqueness within academic year + grade_level
  const existing = gradeLevel
    ? db
        .prepare('SELECT id FROM semesters WHERE academic_year_id = ? AND semester_type = ? AND grade_level = ? AND archived_at IS NULL')
        .get(data.academic_year_id, data.semester_type, gradeLevel)
    : db
        .prepare('SELECT id FROM semesters WHERE academic_year_id = ? AND semester_type = ? AND grade_level IS NULL AND archived_at IS NULL')
        .get(data.academic_year_id, data.semester_type)
  if (existing) {
    throwError(ERROR_CODES.DUPLICATE_SEMESTER_TYPE, `${data.semester_type} already exists for this academic year${gradeLevel ? ` (${gradeLevel})` : ''}.`)
  }

  // Validate date range
  if (data.start_date >= data.end_date) {
    throwError(ERROR_CODES.INVALID_TIME_RANGE, 'Start date must be before end date.')
  }

  // Validate no date overlap with sibling semesters (same grade_level)
  const overlapQuery = gradeLevel
    ? `SELECT semester_type, start_date, end_date FROM semesters
       WHERE academic_year_id = ? AND grade_level = ? AND archived_at IS NULL
       AND start_date < ? AND end_date > ?`
    : `SELECT semester_type, start_date, end_date FROM semesters
       WHERE academic_year_id = ? AND grade_level IS NULL AND archived_at IS NULL
       AND start_date < ? AND end_date > ?`
  const overlapParams = gradeLevel
    ? [data.academic_year_id, gradeLevel, data.end_date, data.start_date]
    : [data.academic_year_id, data.end_date, data.start_date]
  const overlapping = db.prepare(overlapQuery).get(...overlapParams) as
    { semester_type: string; start_date: string; end_date: string } | undefined
  if (overlapping) {
    throwError(
      ERROR_CODES.SEMESTER_DATE_OVERLAP,
      `Semester dates overlap with ${overlapping.semester_type} (${overlapping.start_date} – ${overlapping.end_date}).`
    )
  }

  // Validate dates within academic year range
  if (data.start_date < ay.start_date || data.end_date > ay.end_date) {
    throwError(ERROR_CODES.DATE_OUT_OF_RANGE, 'Semester dates must be within the academic year range.')
  }

  // SHS validation — q1_end_date and q3_end_date relevant only for TWO_SEMESTER
  if (ay.department === 'SHS' && termType === 'TWO_SEMESTER') {
    if (!data.q1_end_date && data.semester_type === '1ST_SEMESTER') {
      // Optional but recommended — we'll allow null for now
    }
    if (!data.q3_end_date && data.semester_type === '2ND_SEMESTER') {
      // Optional but recommended
    }
  }

  const id = randomUUID()

  // Auto-detect draft status: if a sibling semester (same grade_level) is currently active, save as DRAFT
  const activeSiblingQuery = gradeLevel
    ? 'SELECT id FROM semesters WHERE academic_year_id = ? AND grade_level = ? AND is_active = 1 AND archived_at IS NULL'
    : 'SELECT id FROM semesters WHERE academic_year_id = ? AND grade_level IS NULL AND is_active = 1 AND archived_at IS NULL'
  const activeSiblingParams = gradeLevel
    ? [data.academic_year_id, gradeLevel]
    : [data.academic_year_id]
  const activeSibling = db.prepare(activeSiblingQuery).get(...activeSiblingParams) as { id: string } | undefined

  const shouldDraft = !!activeSibling
  const status: SemesterStatus = shouldDraft ? 'DRAFT' : 'PUBLISHED'
  const isActive = shouldDraft ? 0 : 1

  const create = db.transaction(() => {
    // If activating (no sibling active in same grade_level), deactivate any remaining siblings
    if (isActive) {
      if (gradeLevel) {
        db.prepare(
          "UPDATE semesters SET is_active = 0, updated_at = datetime('now') WHERE academic_year_id = ? AND grade_level = ?"
        ).run(data.academic_year_id, gradeLevel)
      } else {
        db.prepare(
          "UPDATE semesters SET is_active = 0, updated_at = datetime('now') WHERE academic_year_id = ? AND grade_level IS NULL"
        ).run(data.academic_year_id)
      }
    }

    db.prepare(
      `INSERT INTO semesters (id, academic_year_id, department, semester_type,
       grade_level, term_type,
       start_date, end_date,
       is_active, status, q1_end_date, q3_end_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      id,
      data.academic_year_id,
      ay.department,
      data.semester_type,
      gradeLevel,
      termType,
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
      after_snapshot: { ...data, id, department: ay.department, grade_level: gradeLevel, term_type: termType }
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

  // Check that parent AY is active
  const parentAy = getAcademicYear(semester.academic_year_id)
  if (!parentAy.is_active) {
    throwError(
      ERROR_CODES.SEMESTER_AY_INACTIVE,
      'Cannot publish semester: parent academic year must be active first.'
    )
  }

  // Check if there's an active sibling (same grade_level) whose end_date hasn't passed yet
  const activeSiblingQuery = semester.grade_level
    ? 'SELECT * FROM semesters WHERE academic_year_id = ? AND grade_level = ? AND is_active = 1 AND id != ? AND archived_at IS NULL'
    : 'SELECT * FROM semesters WHERE academic_year_id = ? AND grade_level IS NULL AND is_active = 1 AND id != ? AND archived_at IS NULL'
  const activeSiblingParams = semester.grade_level
    ? [semester.academic_year_id, semester.grade_level, id]
    : [semester.academic_year_id, id]
  const activeSibling = db.prepare(activeSiblingQuery).get(...activeSiblingParams) as Semester | undefined

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
    // Deactivate siblings with same grade_level only (not other grade levels)
    if (semester.grade_level) {
      db.prepare(
        "UPDATE semesters SET is_active = 0, updated_at = datetime('now') WHERE academic_year_id = ? AND grade_level = ?"
      ).run(semester.academic_year_id, semester.grade_level)
    } else {
      db.prepare(
        "UPDATE semesters SET is_active = 0, updated_at = datetime('now') WHERE academic_year_id = ? AND grade_level IS NULL"
      ).run(semester.academic_year_id)
    }

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

  // Validate no date overlap with sibling semesters (exclude self, same grade_level)
  const overlapQuery = existing.grade_level
    ? `SELECT semester_type, start_date, end_date FROM semesters
       WHERE academic_year_id = ? AND grade_level = ? AND id != ? AND archived_at IS NULL
       AND start_date < ? AND end_date > ?`
    : `SELECT semester_type, start_date, end_date FROM semesters
       WHERE academic_year_id = ? AND grade_level IS NULL AND id != ? AND archived_at IS NULL
       AND start_date < ? AND end_date > ?`
  const overlapParams = existing.grade_level
    ? [existing.academic_year_id, existing.grade_level, data.id, newEndDate, newStartDate]
    : [existing.academic_year_id, data.id, newEndDate, newStartDate]
  const overlapping = db.prepare(overlapQuery).get(...overlapParams) as
    { semester_type: string; start_date: string; end_date: string } | undefined
  if (overlapping) {
    throwError(
      ERROR_CODES.SEMESTER_DATE_OVERLAP,
      `Semester dates overlap with ${overlapping.semester_type} (${overlapping.start_date} – ${overlapping.end_date}).`
    )
  }

  if (newStartDate < ay.start_date || newEndDate > ay.end_date) {
    throwError(ERROR_CODES.DATE_OUT_OF_RANGE, 'Semester dates must be within the academic year range.')
  }

  const update = db.transaction(() => {
    if (newIsActive === 1 && existing.is_active === 0) {
      if (existing.grade_level) {
        db.prepare(
          "UPDATE semesters SET is_active = 0, updated_at = datetime('now') WHERE academic_year_id = ? AND grade_level = ?"
        ).run(existing.academic_year_id, existing.grade_level)
      } else {
        db.prepare(
          "UPDATE semesters SET is_active = 0, updated_at = datetime('now') WHERE academic_year_id = ? AND grade_level IS NULL"
        ).run(existing.academic_year_id)
      }
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
    // Cascade-archive DRAFT schedule entries for this semester
    const draftEntries = db
      .prepare(
        `SELECT id FROM schedule_entries WHERE semester_id = ? AND status = 'DRAFT' AND archived_at IS NULL`
      )
      .all(id) as Array<{ id: string }>

    if (draftEntries.length > 0) {
      db.prepare(
        `UPDATE schedule_entries SET archived_at = datetime('now'), archived_by = 'admin', updated_at = datetime('now')
         WHERE semester_id = ? AND status = 'DRAFT' AND archived_at IS NULL`
      ).run(id)

      for (const entry of draftEntries) {
        logAudit({
          entity_type: 'schedule_entry',
          entity_id: entry.id,
          department: existing.department,
          action: 'DELETE',
          before_snapshot: { id: entry.id, reason: 'cascade_semester_delete' }
        })
      }
    }

    // Cascade-archive DRAFT calendar events for this semester
    const draftEvents = db
      .prepare(
        `SELECT id FROM calendar_events WHERE semester_id = ? AND status = 'DRAFT' AND archived_at IS NULL`
      )
      .all(id) as Array<{ id: string }>

    if (draftEvents.length > 0) {
      db.prepare(
        `UPDATE calendar_events SET archived_at = datetime('now'), archived_by = 'admin', updated_at = datetime('now')
         WHERE semester_id = ? AND status = 'DRAFT' AND archived_at IS NULL`
      ).run(id)

      for (const event of draftEvents) {
        logAudit({
          entity_type: 'calendar_event',
          entity_id: event.id,
          department: existing.department,
          action: 'DELETE',
          before_snapshot: { id: event.id, reason: 'cascade_semester_delete' }
        })
      }
    }

    // Count PUBLISHED entries that are left untouched
    const publishedEntries = db
      .prepare(
        `SELECT COUNT(*) as count FROM schedule_entries WHERE semester_id = ? AND status = 'PUBLISHED' AND archived_at IS NULL`
      )
      .get(id) as { count: number }

    // Archive the semester itself
    db.prepare(
      "UPDATE semesters SET archived_at = datetime('now'), archived_by = 'admin', updated_at = datetime('now') WHERE id = ?"
    ).run(id)

    logAudit({
      entity_type: 'semester',
      entity_id: id,
      department: existing.department,
      action: 'DELETE',
      before_snapshot: existing,
      after_snapshot: {
        cascaded_draft_entries: draftEntries.length,
        cascaded_draft_events: draftEvents.length,
        untouched_published_entries: publishedEntries.count
      }
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
