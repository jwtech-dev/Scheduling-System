// ============================================================
// Calendar Event Service — TASK-08
// ============================================================

import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { randomUUID } from 'crypto'
import type { CalendarEvent, CalendarEventType, ExamType, Department } from '../../shared/types'
import { ERROR_CODES, DEFAULTS, SHS_EXAM_TYPES, COLLEGE_EXAM_TYPES } from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

interface CalendarEventFilters {
  event_type?: CalendarEventType
  academic_year_id?: string
  semester_id?: string
  department?: Department
  is_blocking?: boolean
  date_from?: string
  date_to?: string
  search?: string
}

export function listCalendarEvents(filters: CalendarEventFilters = {}): CalendarEvent[] {
  const db = getDatabase()
  const conditions: string[] = ['is_active = 1 AND archived_at IS NULL']
  const params: unknown[] = []

  if (filters.event_type) { conditions.push('event_type = ?'); params.push(filters.event_type) }
  if (filters.academic_year_id) { conditions.push('academic_year_id = ?'); params.push(filters.academic_year_id) }
  if (filters.semester_id) { conditions.push('semester_id = ?'); params.push(filters.semester_id) }
  if (filters.department) { conditions.push('(department = ? OR department IS NULL)'); params.push(filters.department) }
  if (filters.is_blocking !== undefined) { conditions.push('is_blocking = ?'); params.push(filters.is_blocking ? 1 : 0) }
  if (filters.date_from) { conditions.push('end_datetime >= ?'); params.push(filters.date_from) }
  if (filters.date_to) { conditions.push('start_datetime <= ?'); params.push(filters.date_to) }
  if (filters.search) {
    conditions.push('(title LIKE ? OR description LIKE ?)')
    const term = `%${filters.search}%`
    params.push(term, term)
  }

  return db
    .prepare(`SELECT * FROM calendar_events WHERE ${conditions.join(' AND ')} ORDER BY start_datetime`)
    .all(...params) as CalendarEvent[]
}

export function getCalendarEvent(id: string): CalendarEvent {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM calendar_events WHERE id = ? AND is_active = 1 AND archived_at IS NULL').get(id) as CalendarEvent | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Calendar event not found: ${id}`)
  return row
}

export function createCalendarEvent(data: {
  title: string
  event_type: CalendarEventType
  exam_type?: ExamType | null
  department?: Department | null
  is_blocking?: boolean
  is_all_day?: boolean
  start_datetime: string
  end_datetime: string
  academic_year_id?: string
  semester_id?: string
  description?: string
}): CalendarEvent {
  const db = getDatabase()

  if (!data.title || data.title.length < DEFAULTS.CALENDAR_TITLE_MIN_LENGTH) {
    throwError(ERROR_CODES.VALIDATION_ERROR, `Title must be at least ${DEFAULTS.CALENDAR_TITLE_MIN_LENGTH} characters.`)
  }

  // Validate date format
  const startDate = new Date(data.start_datetime)
  const endDate = new Date(data.end_datetime)
  if (isNaN(startDate.getTime())) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Invalid start datetime format.')
  }
  if (isNaN(endDate.getTime())) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Invalid end datetime format.')
  }

  if (startDate.getTime() > endDate.getTime()) {
    throwError(ERROR_CODES.INVALID_TIME_RANGE, 'Start date cannot be after end date.')
  }

  // Validate semester is active
  if (data.semester_id) {
    const semester = db.prepare('SELECT is_active FROM semesters WHERE id = ?').get(data.semester_id) as { is_active: number } | undefined
    if (!semester) {
      throwError(ERROR_CODES.NOT_FOUND, 'Semester not found.')
    }
    if (!semester.is_active) {
      throwError(ERROR_CODES.SEMESTER_INACTIVE, 'Cannot assign calendar events to an inactive semester. Only active semesters are allowed.')
    }
  }

  // Require override reason (description) for BREAK, INSTITUTIONAL_EVENT, CUSTOM
  const requiresReason = ['BREAK', 'INSTITUTIONAL_EVENT', 'CUSTOM'].includes(data.event_type)
  if (requiresReason && (!data.description || data.description.trim().length === 0)) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'This event type requires an override reason in the description field.')
  }

  // Check for duplicate title within same date range
  const dup = db
    .prepare(
      `SELECT id FROM calendar_events WHERE title = ? AND start_datetime = ? AND end_datetime = ? AND is_active = 1 AND archived_at IS NULL`
    )
    .get(data.title, data.start_datetime, data.end_datetime)
  if (dup) {
    throwError(ERROR_CODES.DUPLICATE_TITLE, `An event with the same title and dates already exists.`)
  }

  // Validate exam_type for EXAM_PERIOD events
  const ALL_EXAM_TYPES = [...SHS_EXAM_TYPES, ...COLLEGE_EXAM_TYPES] as string[]
  if (data.event_type === 'EXAM_PERIOD') {
    if (!data.exam_type) {
      throwError(ERROR_CODES.VALIDATION_ERROR, 'Exam type is required for Exam Period events.')
    }
    if (!ALL_EXAM_TYPES.includes(data.exam_type)) {
      throwError(ERROR_CODES.INVALID_EXAM_TYPE, `Invalid exam type: ${data.exam_type}`)
    }
  }
  // Clear exam_type for non-EXAM_PERIOD events
  const effectiveExamType = data.event_type === 'EXAM_PERIOD' ? (data.exam_type ?? null) : null

  const id = randomUUID()

  // Force blocking for HOLIDAY, EXAM_PERIOD, BREAK — these always override regular schedules
  const autoBlocking = ['HOLIDAY', 'EXAM_PERIOD', 'BREAK'].includes(data.event_type)
  const isBlocking = autoBlocking ? 1 : (data.is_blocking ? 1 : 0)

  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO calendar_events (id, title, event_type, exam_type, department, is_blocking, is_all_day,
       start_datetime, end_datetime, academic_year_id, semester_id, description,
       created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      id, data.title, data.event_type, effectiveExamType,
      data.department ?? null, isBlocking,
      data.is_all_day ? 1 : 0, data.start_datetime, data.end_datetime,
      data.academic_year_id ?? null, data.semester_id ?? null,
      data.description ?? null
    )

    logAudit({
      entity_type: 'calendar_event',
      entity_id: id,
      action: 'CREATE',
      after_snapshot: { ...data, id }
    })
  })

  create()
  return getCalendarEvent(id)
}

export function updateCalendarEvent(data: {
  id: string
  title?: string
  event_type?: CalendarEventType
  exam_type?: ExamType | null
  department?: Department | null
  is_blocking?: boolean
  is_all_day?: boolean
  start_datetime?: string
  end_datetime?: string
  academic_year_id?: string | null
  semester_id?: string | null
  description?: string | null
}): CalendarEvent {
  const db = getDatabase()
  const existing = getCalendarEvent(data.id)

  const updated = {
    title: data.title ?? existing.title,
    event_type: data.event_type ?? existing.event_type,
    exam_type: data.exam_type !== undefined ? data.exam_type : existing.exam_type,
    department: data.department !== undefined ? data.department : existing.department,
    is_blocking: data.is_blocking !== undefined ? (data.is_blocking ? 1 : 0) : existing.is_blocking,
    is_all_day: data.is_all_day !== undefined ? (data.is_all_day ? 1 : 0) : existing.is_all_day,
    start_datetime: data.start_datetime ?? existing.start_datetime,
    end_datetime: data.end_datetime ?? existing.end_datetime,
    academic_year_id: data.academic_year_id !== undefined ? data.academic_year_id : existing.academic_year_id,
    semester_id: data.semester_id !== undefined ? data.semester_id : existing.semester_id,
    description: data.description !== undefined ? data.description : existing.description
  }

  // Use Date parsing for proper temporal comparison
  const startDate = new Date(updated.start_datetime)
  const endDate = new Date(updated.end_datetime)
  if (isNaN(startDate.getTime())) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Invalid start datetime format.')
  }
  if (isNaN(endDate.getTime())) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Invalid end datetime format.')
  }
  if (startDate.getTime() > endDate.getTime()) {
    throwError(ERROR_CODES.INVALID_TIME_RANGE, 'Start date cannot be after end date.')
  }

  // Validate semester is active (if being changed)
  if (data.semester_id !== undefined && data.semester_id !== null) {
    const semester = db.prepare('SELECT is_active FROM semesters WHERE id = ?').get(data.semester_id) as { is_active: number } | undefined
    if (!semester) {
      throwError(ERROR_CODES.NOT_FOUND, 'Semester not found.')
    }
    if (!semester.is_active) {
      throwError(ERROR_CODES.SEMESTER_INACTIVE, 'Cannot assign calendar events to an inactive semester. Only active semesters are allowed.')
    }
  }

  // Require override reason (description) for BREAK, INSTITUTIONAL_EVENT, CUSTOM
  const requiresReason = ['BREAK', 'INSTITUTIONAL_EVENT', 'CUSTOM'].includes(updated.event_type)
  if (requiresReason && (!updated.description || updated.description.trim().length === 0)) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'This event type requires an override reason in the description field.')
  }

  // Validate exam_type for EXAM_PERIOD events
  const ALL_EXAM_TYPES = [...SHS_EXAM_TYPES, ...COLLEGE_EXAM_TYPES] as string[]
  if (updated.event_type === 'EXAM_PERIOD') {
    if (!updated.exam_type) {
      throwError(ERROR_CODES.VALIDATION_ERROR, 'Exam type is required for Exam Period events.')
    }
    if (!ALL_EXAM_TYPES.includes(updated.exam_type)) {
      throwError(ERROR_CODES.INVALID_EXAM_TYPE, `Invalid exam type: ${updated.exam_type}`)
    }
  }
  // Clear exam_type for non-EXAM_PERIOD events
  if (updated.event_type !== 'EXAM_PERIOD') {
    updated.exam_type = null
  }

  // Force blocking for HOLIDAY, EXAM_PERIOD, BREAK — these always override regular schedules
  const autoBlocking = ['HOLIDAY', 'EXAM_PERIOD', 'BREAK'].includes(updated.event_type)
  if (autoBlocking) {
    updated.is_blocking = 1
  }

  const update = db.transaction(() => {
    db.prepare(
      `UPDATE calendar_events SET title = ?, event_type = ?, exam_type = ?, department = ?, is_blocking = ?, is_all_day = ?,
       start_datetime = ?, end_datetime = ?, academic_year_id = ?, semester_id = ?,
       description = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      updated.title, updated.event_type, updated.exam_type, updated.department,
      updated.is_blocking, updated.is_all_day,
      updated.start_datetime, updated.end_datetime, updated.academic_year_id,
      updated.semester_id, updated.description, data.id
    )

    logAudit({
      entity_type: 'calendar_event',
      entity_id: data.id,
      action: 'UPDATE',
      before_snapshot: existing,
      after_snapshot: { ...existing, ...updated }
    })
  })

  update()
  return getCalendarEvent(data.id)
}

export function deleteCalendarEvent(id: string): void {
  const db = getDatabase()
  const existing = getCalendarEvent(id)

  const del = db.transaction(() => {
    db.prepare(
      "UPDATE calendar_events SET archived_at = datetime('now'), archived_by = 'admin', updated_at = datetime('now') WHERE id = ?"
    ).run(id)

    logAudit({
      entity_type: 'calendar_event',
      entity_id: id,
      action: 'DELETE',
      before_snapshot: existing
    })
  })

  del()
}

/**
 * Get blocking events within a date range (used by conflict detection).
 */
export function getBlockingEventsInRange(startDate: string, endDate: string, department?: Department): CalendarEvent[] {
  const db = getDatabase()
  const conditions = ['is_blocking = 1', 'is_active = 1', 'archived_at IS NULL', 'end_datetime > ?', 'start_datetime < ?']
  const params: unknown[] = [startDate, endDate]
  if (department) {
    conditions.push('(department = ? OR department IS NULL)')
    params.push(department)
  }
  return db
    .prepare(`SELECT * FROM calendar_events WHERE ${conditions.join(' AND ')}`)
    .all(...params) as CalendarEvent[]
}

/**
 * List archived (soft-deleted) calendar events.
 */
export function getArchivedCalendarEvents(): CalendarEvent[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM calendar_events WHERE archived_at IS NOT NULL ORDER BY archived_at DESC')
    .all() as CalendarEvent[]
}

/**
 * Restore a soft-deleted calendar event.
 */
export function restoreCalendarEvent(id: string): CalendarEvent {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM calendar_events WHERE id = ? AND archived_at IS NOT NULL').get(id) as CalendarEvent | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Archived calendar event not found: ${id}`)

  const restore = db.transaction(() => {
    db.prepare(
      "UPDATE calendar_events SET archived_at = NULL, archived_by = NULL, updated_at = datetime('now') WHERE id = ?"
    ).run(id)

    logAudit({
      entity_type: 'calendar_event',
      entity_id: id,
      action: 'RESTORE',
      before_snapshot: row
    })
  })

  restore()
  return getCalendarEvent(id)
}

/**
 * Permanently delete a calendar event from the database.
 */
export function permanentDeleteCalendarEvent(id: string): void {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM calendar_events WHERE id = ? AND archived_at IS NOT NULL').get(id) as CalendarEvent | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Archived calendar event not found: ${id}`)

  const del = db.transaction(() => {
    db.prepare('DELETE FROM calendar_events WHERE id = ?').run(id)

    logAudit({
      entity_type: 'calendar_event',
      entity_id: id,
      action: 'PERMANENT_DELETE',
      before_snapshot: row
    })
  })

  del()
}
