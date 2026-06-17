// ============================================================
// Academic Year Service — TASK-05
// ============================================================

import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { randomUUID } from 'crypto'
import type { AcademicYear, AcademicYearStatus, Department, Semester } from '../../shared/types'
import { ERROR_CODES, DEPARTMENT_START_MONTH } from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

/**
 * List academic years for a department.
 */
export function listAcademicYears(department: Department): AcademicYear[] {
  const db = getDatabase()
  return db
    .prepare(
      'SELECT * FROM academic_years WHERE department = ? AND archived_at IS NULL ORDER BY start_date DESC'
    )
    .all(department) as AcademicYear[]
}

/**
 * Get a single academic year by ID.
 */
export function getAcademicYear(id: string): AcademicYear {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM academic_years WHERE id = ? AND archived_at IS NULL').get(id) as
    | AcademicYear
    | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Academic year not found: ${id}`)
  return row
}

/**
 * Create a new academic year.
 */
export function createAcademicYear(data: {
  department: Department
  label: string
  start_date: string
  end_date: string
}): AcademicYear {
  const db = getDatabase()

  // Validate label uniqueness within department
  const existing = db
    .prepare('SELECT id FROM academic_years WHERE department = ? AND label = ?')
    .get(data.department, data.label)
  if (existing) {
    throwError(ERROR_CODES.DUPLICATE_LABEL, `Academic year "${data.label}" already exists for ${data.department}.`)
  }

  // Validate date overlap — reject if new AY dates overlap an existing active AY in same department
  const overlap = db
    .prepare(
      `SELECT id FROM academic_years WHERE department = ? AND archived_at IS NULL
       AND start_date < ? AND end_date > ?`
    )
    .get(data.department, data.end_date, data.start_date)
  if (overlap) {
    throwError(ERROR_CODES.VALIDATION_ERROR, `Date range overlaps with an existing academic year in ${data.department}.`)
  }

  // Validate date range
  if (data.start_date >= data.end_date) {
    throwError(ERROR_CODES.INVALID_TIME_RANGE, 'Start date must be before end date.')
  }

  const id = randomUUID()

  // Auto-detect draft status: if an active AY exists in the department, save as DRAFT
  const activeAy = db
    .prepare('SELECT id FROM academic_years WHERE department = ? AND is_active = 1 AND archived_at IS NULL')
    .get(data.department) as { id: string } | undefined

  const shouldDraft = !!activeAy
  const status: AcademicYearStatus = shouldDraft ? 'DRAFT' : 'PUBLISHED'
  const isActive = shouldDraft ? 0 : 1

  const create = db.transaction(() => {
    // If activating (no active AY exists), deactivate others in same department just in case
    if (isActive) {
      db.prepare('UPDATE academic_years SET is_active = 0, updated_at = datetime(\'now\') WHERE department = ?').run(
        data.department
      )
    }

    db.prepare(
      `INSERT INTO academic_years (id, department, label, start_date, end_date, is_active, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(id, data.department, data.label, data.start_date, data.end_date, isActive, status)

    logAudit({
      entity_type: 'academic_year',
      entity_id: id,
      department: data.department,
      action: 'CREATE',
      after_snapshot: { ...data, id, status, is_active: isActive }
    })
  })

  create()
  return getAcademicYear(id)
}

/**
 * Update an existing academic year.
 */
export function updateAcademicYear(data: {
  id: string
  label?: string
  start_date?: string
  end_date?: string
}): AcademicYear {
  const db = getDatabase()
  const existing = getAcademicYear(data.id)

  // Guard: only DRAFT academic years can be edited
  if (existing.status === 'PUBLISHED') {
    throwError(ERROR_CODES.CANNOT_EDIT_PUBLISHED, 'Cannot edit a published academic year.')
  }

  const newLabel = data.label ?? existing.label
  const newStartDate = data.start_date ?? existing.start_date
  const newEndDate = data.end_date ?? existing.end_date

  // Validate label uniqueness (if changing)
  if (newLabel !== existing.label) {
    const dup = db
      .prepare('SELECT id FROM academic_years WHERE department = ? AND label = ? AND id != ?')
      .get(existing.department, newLabel, data.id)
    if (dup) {
      throwError(ERROR_CODES.DUPLICATE_LABEL, `Academic year "${newLabel}" already exists for ${existing.department}.`)
    }
  }

  // Validate dates
  if (newStartDate >= newEndDate) {
    throwError(ERROR_CODES.INVALID_TIME_RANGE, 'Start date must be before end date.')
  }

  const update = db.transaction(() => {
    db.prepare(
      `UPDATE academic_years SET label = ?, start_date = ?, end_date = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(newLabel, newStartDate, newEndDate, data.id)

    logAudit({
      entity_type: 'academic_year',
      entity_id: data.id,
      department: existing.department,
      action: 'UPDATE',
      before_snapshot: existing,
      after_snapshot: { ...existing, label: newLabel, start_date: newStartDate, end_date: newEndDate }
    })
  })

  update()
  return getAcademicYear(data.id)
}

/**
 * Get all semesters for an academic year.
 */
export function getAcademicYearSemesters(academicYearId: string): Semester[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM semesters WHERE academic_year_id = ? AND archived_at IS NULL ORDER BY start_date')
    .all(academicYearId) as Semester[]
}

/**
 * Soft-delete an academic year (set archived_at timestamp).
 */
export function deleteAcademicYear(id: string): void {
  const db = getDatabase()
  const existing = getAcademicYear(id)

  // Guard: only DRAFT academic years can be deleted
  if (existing.status === 'PUBLISHED') {
    throwError(ERROR_CODES.DELETE_PROTECTED, 'Cannot delete a published academic year.')
  }

  const del = db.transaction(() => {
    db.prepare(
      "UPDATE academic_years SET archived_at = datetime('now'), archived_by = 'admin', updated_at = datetime('now') WHERE id = ?"
    ).run(id)

    logAudit({
      entity_type: 'academic_year',
      entity_id: id,
      department: existing.department,
      action: 'DELETE',
      before_snapshot: existing
    })
  })

  del()
}

/**
 * Publish a draft academic year — gate by active AY's end date.
 * The AY can only be published once the currently active AY's end_date has passed.
 */
export function publishAcademicYear(id: string): AcademicYear & { warning?: string } {
  const db = getDatabase()
  const ay = getAcademicYear(id)

  if (ay.status === 'PUBLISHED') {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Academic year is already published.')
  }

  // Check if there's an active AY in the same department whose end_date hasn't passed
  const activeAy = db
    .prepare(
      'SELECT * FROM academic_years WHERE department = ? AND is_active = 1 AND id != ? AND archived_at IS NULL'
    )
    .get(ay.department, id) as AcademicYear | undefined

  if (activeAy) {
    const today = new Date().toISOString().split('T')[0]
    if (today < activeAy.end_date) {
      throwError(
        ERROR_CODES.AY_PUBLISH_BLOCKED,
        `Cannot publish until the current academic year ends on ${activeAy.end_date}.`
      )
    }
  }

  const publish = db.transaction(() => {
    // Deactivate all AYs in the department
    db.prepare(
      "UPDATE academic_years SET is_active = 0, updated_at = datetime('now') WHERE department = ?"
    ).run(ay.department)

    // Publish and activate this AY
    db.prepare(
      "UPDATE academic_years SET status = 'PUBLISHED', is_active = 1, updated_at = datetime('now') WHERE id = ?"
    ).run(id)

    logAudit({
      entity_type: 'academic_year',
      entity_id: id,
      department: ay.department,
      action: 'PUBLISH',
      before_snapshot: ay,
      after_snapshot: { ...ay, status: 'PUBLISHED', is_active: 1 }
    })
  })

  publish()

  const published = getAcademicYear(id)

  // Non-blocking warning: AY has no semesters yet
  const semesterCount = db
    .prepare('SELECT COUNT(*) as count FROM semesters WHERE academic_year_id = ? AND archived_at IS NULL')
    .get(id) as { count: number }

  if (semesterCount.count === 0) {
    return {
      ...published,
      warning: 'This academic year has no semesters yet. Add at least one semester for scheduling to work.'
    }
  }

  return published
}

/**
 * Get cascade count — number of related records that would be affected.
 */
export function getCascadeCount(id: string): { semesters: number; schedule_entries: number; calendar_events: number } {
  const db = getDatabase()

  const semesters = db
    .prepare('SELECT COUNT(*) as count FROM semesters WHERE academic_year_id = ?')
    .get(id) as { count: number }

  const scheduleEntries = db
    .prepare('SELECT COUNT(*) as count FROM schedule_entries WHERE academic_year_id = ?')
    .get(id) as { count: number }

  const calendarEvents = db
    .prepare('SELECT COUNT(*) as count FROM calendar_events WHERE academic_year_id = ?')
    .get(id) as { count: number }

  return {
    semesters: semesters.count,
    schedule_entries: scheduleEntries.count,
    calendar_events: calendarEvents.count
  }
}

/**
 * Get all archived (soft-deleted) academic years.
 */
export function getArchivedAcademicYears(): AcademicYear[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM academic_years WHERE archived_at IS NOT NULL ORDER BY archived_at DESC')
    .all() as AcademicYear[]
}

/**
 * Restore a soft-deleted academic year.
 */
export function restoreAcademicYear(id: string): AcademicYear {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM academic_years WHERE id = ? AND archived_at IS NOT NULL').get(id) as
    | AcademicYear
    | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Archived academic year not found: ${id}`)

  db.prepare(
    "UPDATE academic_years SET archived_at = NULL, archived_by = NULL, updated_at = datetime('now') WHERE id = ?"
  ).run(id)

  logAudit({
    entity_type: 'academic_year',
    entity_id: id,
    department: row.department,
    action: 'UPDATE',
    before_snapshot: row,
    after_snapshot: { ...row, archived_at: null, archived_by: null }
  })

  return getAcademicYear(id)
}

/**
 * Permanently delete an academic year from the database.
 */
export function permanentDeleteAcademicYear(id: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM academic_years WHERE id = ?').run(id)
}
