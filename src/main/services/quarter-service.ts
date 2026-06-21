// ============================================================
// Quarter Service — quarters are first-class children of semesters (SHS only)
// ============================================================

import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { getSemester } from './semester-service'
import { randomUUID } from 'crypto'
import type { Quarter, QuarterLabel } from '../../shared/types'
import { ERROR_CODES } from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

/**
 * List all active quarters for a semester, ordered by start_date.
 */
export function listQuarters(semesterId: string): Quarter[] {
  const db = getDatabase()
  return db
    .prepare(
      'SELECT * FROM quarters WHERE semester_id = ? AND archived_at IS NULL ORDER BY start_date ASC'
    )
    .all(semesterId) as Quarter[]
}

/**
 * Get a single quarter by ID.
 */
export function getQuarter(id: string): Quarter {
  const db = getDatabase()
  const row = db
    .prepare('SELECT * FROM quarters WHERE id = ? AND archived_at IS NULL')
    .get(id) as Quarter | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Quarter not found: ${id}`)
  return row
}

/**
 * Create a new quarter within a semester.
 */
export function createQuarter(data: {
  semester_id: string
  quarter_label: QuarterLabel
  start_date: string
  end_date: string
}): Quarter {
  const db = getDatabase()
  const semester = getSemester(data.semester_id)

  // Quarters only supported for SHS
  if (semester.department !== 'SHS') {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Quarters are only supported for SHS semesters.')
  }

  // Quarters only supported for TWO_SEMESTER term type
  if (semester.term_type === 'TRIMESTRAL') {
    throwError(ERROR_CODES.TRIMESTRAL_NO_QUARTERS, 'Quarters are not supported for trimestral semesters.')
  }

  // Validate dates
  if (data.start_date >= data.end_date) {
    throwError(ERROR_CODES.INVALID_TIME_RANGE, 'Start date must be before end date.')
  }

  // Dates must be within semester range
  if (data.start_date < semester.start_date || data.end_date > semester.end_date) {
    throwError(
      ERROR_CODES.DATE_OUT_OF_RANGE,
      'Quarter dates must be within the semester range.'
    )
  }

  // No duplicate quarter_label for this semester
  const existing = db
    .prepare(
      'SELECT id FROM quarters WHERE semester_id = ? AND quarter_label = ? AND archived_at IS NULL'
    )
    .get(data.semester_id, data.quarter_label)
  if (existing) {
    throwError(
      ERROR_CODES.VALIDATION_ERROR,
      `${data.quarter_label} already exists for this semester.`
    )
  }

  // No date overlap with sibling quarters
  const overlapping = db
    .prepare(
      `SELECT quarter_label FROM quarters
       WHERE semester_id = ? AND archived_at IS NULL
       AND start_date < ? AND end_date > ?`
    )
    .get(data.semester_id, data.end_date, data.start_date) as { quarter_label: string } | undefined
  if (overlapping) {
    throwError(
      ERROR_CODES.VALIDATION_ERROR,
      `Dates overlap with ${overlapping.quarter_label}.`
    )
  }

  const id = randomUUID()

  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO quarters (id, semester_id, department, quarter_label, start_date, end_date,
       is_active, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, 'PUBLISHED', datetime('now'), datetime('now'))`
    ).run(id, data.semester_id, semester.department, data.quarter_label, data.start_date, data.end_date)

    logAudit({
      entity_type: 'quarter',
      entity_id: id,
      department: semester.department,
      action: 'CREATE',
      after_snapshot: { ...data, id, department: semester.department }
    })
  })

  create()
  return getQuarter(id)
}

/**
 * Update an existing quarter's dates.
 */
export function updateQuarter(data: {
  id: string
  start_date?: string
  end_date?: string
}): Quarter {
  const db = getDatabase()
  const existing = getQuarter(data.id)
  const semester = getSemester(existing.semester_id)

  const newStart = data.start_date ?? existing.start_date
  const newEnd = data.end_date ?? existing.end_date

  if (newStart >= newEnd) {
    throwError(ERROR_CODES.INVALID_TIME_RANGE, 'Start date must be before end date.')
  }

  if (newStart < semester.start_date || newEnd > semester.end_date) {
    throwError(
      ERROR_CODES.DATE_OUT_OF_RANGE,
      'Quarter dates must be within the semester range.'
    )
  }

  // Check overlap with siblings (exclude self)
  const overlapping = db
    .prepare(
      `SELECT quarter_label FROM quarters
       WHERE semester_id = ? AND id != ? AND archived_at IS NULL
       AND start_date < ? AND end_date > ?`
    )
    .get(existing.semester_id, data.id, newEnd, newStart) as { quarter_label: string } | undefined
  if (overlapping) {
    throwError(
      ERROR_CODES.VALIDATION_ERROR,
      `Dates overlap with ${overlapping.quarter_label}.`
    )
  }

  const update = db.transaction(() => {
    db.prepare(
      `UPDATE quarters SET start_date = ?, end_date = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(newStart, newEnd, data.id)

    logAudit({
      entity_type: 'quarter',
      entity_id: data.id,
      department: existing.department,
      action: 'UPDATE',
      before_snapshot: existing,
      after_snapshot: { ...existing, start_date: newStart, end_date: newEnd }
    })
  })

  update()
  return getQuarter(data.id)
}

/**
 * Soft-delete a quarter.
 */
export function deleteQuarter(id: string): void {
  const db = getDatabase()
  const existing = getQuarter(id)

  const del = db.transaction(() => {
    db.prepare(
      `UPDATE quarters SET archived_at = datetime('now'), archived_by = 'admin', updated_at = datetime('now') WHERE id = ?`
    ).run(id)

    logAudit({
      entity_type: 'quarter',
      entity_id: id,
      department: existing.department,
      action: 'DELETE',
      before_snapshot: existing
    })
  })

  del()
}

/**
 * Resolve the active/current quarter for a semester by today's date.
 * Returns the quarter whose date range contains today, or the last one.
 */
export function resolveCurrentQuarter(semesterId: string): Quarter | null {
  const db = getDatabase()
  const today = new Date().toISOString().split('T')[0]

  // Find a quarter whose range contains today
  const current = db
    .prepare(
      `SELECT * FROM quarters
       WHERE semester_id = ? AND archived_at IS NULL
       AND start_date <= ? AND end_date >= ?
       ORDER BY start_date ASC LIMIT 1`
    )
    .get(semesterId, today, today) as Quarter | undefined

  if (current) return current

  // If past all quarters, return the last one
  const last = db
    .prepare(
      `SELECT * FROM quarters WHERE semester_id = ? AND archived_at IS NULL
       ORDER BY end_date DESC LIMIT 1`
    )
    .get(semesterId) as Quarter | undefined

  return last ?? null
}
