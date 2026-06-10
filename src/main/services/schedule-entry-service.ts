// ============================================================
// Schedule Entry Service — TASK-12
// ============================================================

import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { detectConflicts } from './conflict-detector'
import { expandRecurrence } from './recurrence-expander'
import { randomUUID } from 'crypto'
import type {
  ScheduleEntry, Department, ActivityType, Modality, RecurrencePattern,
  EntryStatus, ExamType, ConflictFlag
} from '../../shared/types'
import {
  ERROR_CODES, FIELD_DEPENDENCY_MATRIX, resolveRoomVisibility,
  MAX_RECURRENCE_OCCURRENCES
} from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

/**
 * Validate that all occurrence dates of an EXAM entry fall within
 * a designated EXAM_PERIOD calendar event. Throws NO_EXAM_PERIOD if not.
 */
function validateExamPeriodExists(
  occurrences: { date: string }[],
  semesterId: string | null
): void {
  if (occurrences.length === 0) return

  const db = getDatabase()

  for (const occ of occurrences) {
    const conditions = [
      "event_type = 'EXAM_PERIOD'",
      'is_active = 1',
      'archived_at IS NULL',
      'start_datetime <= ?',
      'end_datetime >= ?'
    ]
    const params: unknown[] = [occ.date + 'T23:59:59', occ.date + 'T00:00:00']

    // Scope to same semester if provided
    if (semesterId) {
      conditions.push('semester_id = ?')
      params.push(semesterId)
    }

    const examPeriod = db
      .prepare(`SELECT id FROM calendar_events WHERE ${conditions.join(' AND ')} LIMIT 1`)
      .get(...params)

    if (!examPeriod) {
      throwError(
        ERROR_CODES.NO_EXAM_PERIOD,
        'Cannot schedule exams — no exam period has been assigned on the calendar for these dates. Please create an Exam Period calendar event first.'
      )
    }
  }
}

interface EntryFilters {
  department?: Department
  status?: EntryStatus
  activity_type?: ActivityType
  room_id?: string
  personnel_id?: string
  semester_id?: string
  academic_year_id?: string
  search?: string
}

export function listScheduleEntries(filters: EntryFilters = {}): ScheduleEntry[] {
  const db = getDatabase()
  const conditions: string[] = ['is_active = 1']
  const params: unknown[] = []

  if (filters.department) { conditions.push('department = ?'); params.push(filters.department) }
  if (filters.status) { conditions.push('status = ?'); params.push(filters.status) }
  if (filters.activity_type) { conditions.push('activity_type = ?'); params.push(filters.activity_type) }
  if (filters.room_id) { conditions.push('room_id = ?'); params.push(filters.room_id) }
  if (filters.personnel_id) { conditions.push('personnel_id = ?'); params.push(filters.personnel_id) }
  if (filters.semester_id) { conditions.push('semester_id = ?'); params.push(filters.semester_id) }
  if (filters.academic_year_id) { conditions.push('academic_year_id = ?'); params.push(filters.academic_year_id) }
  if (filters.search) {
    conditions.push('(subject LIKE ? OR notes LIKE ? OR exam_title LIKE ?)')
    const term = `%${filters.search}%`
    params.push(term, term, term)
  }

  return db
    .prepare(`SELECT * FROM schedule_entries WHERE ${conditions.join(' AND ')} ORDER BY start_time`)
    .all(...params) as ScheduleEntry[]
}

export function listDraftEntries(filters: EntryFilters = {}): ScheduleEntry[] {
  return listScheduleEntries({ ...filters, status: 'DRAFT' })
}

export function getScheduleEntry(id: string): ScheduleEntry {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM schedule_entries WHERE id = ? AND is_active = 1').get(id) as ScheduleEntry | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Schedule entry not found: ${id}`)
  return row
}

/**
 * Create a new draft schedule entry with conflict detection.
 */
export function createDraftEntry(data: {
  department: Department
  activity_type: ActivityType
  room_id?: string | null
  personnel_id?: string | null
  section_ids?: string[]
  subject?: string | null
  subject_code?: string | null
  lec_units?: number
  lab_units?: number
  exam_title?: string | null
  exam_type?: ExamType | null
  modality?: Modality
  start_time: string
  end_time: string
  recurrence_pattern: RecurrencePattern
  recurrence_start_date: string
  recurrence_end_date?: string | null
  day_of_week?: number | null
  day_of_month?: number | null
  week_of_month?: number | null
  custom_days?: number[] | null
  academic_year_id: string
  semester_id?: string | null
  notes?: string | null
  override_reason?: string | null
}): { entry: ScheduleEntry; conflicts: ConflictFlag[] } {
  const db = getDatabase()

  // === Validation ===
  validateEntry(data)

  const modality = data.modality ?? 'F2F'
  const sectionIds = JSON.stringify(data.section_ids ?? [])
  const customDays = data.custom_days ? JSON.stringify(data.custom_days) : null

  // Check occurrence limit
  const occurrences = expandRecurrence(data.recurrence_pattern, data.recurrence_start_date, data.recurrence_end_date ?? null, {
    dayOfWeek: data.day_of_week ?? null,
    dayOfMonth: data.day_of_month ?? null,
    weekOfMonth: data.week_of_month ?? null,
    customDays: data.custom_days ?? null
  })
  if (occurrences.length > MAX_RECURRENCE_OCCURRENCES) {
    throwError(ERROR_CODES.MAX_OCCURRENCES_EXCEEDED, `Entry generates ${occurrences.length} occurrences (max ${MAX_RECURRENCE_OCCURRENCES}).`)
  }

  // Block EXAM entries that don't fall within a calendar EXAM_PERIOD
  if (data.activity_type === 'EXAM') {
    validateExamPeriodExists(occurrences, data.semester_id ?? null)
  }

  // Run conflict detection
  const candidateForDetection = {
    department: data.department,
    activity_type: data.activity_type,
    room_id: data.room_id ?? null,
    personnel_id: data.personnel_id ?? null,
    section_ids: sectionIds,
    start_time: data.start_time,
    end_time: data.end_time,
    recurrence_pattern: data.recurrence_pattern,
    recurrence_start_date: data.recurrence_start_date,
    recurrence_end_date: data.recurrence_end_date ?? null,
    day_of_week: data.day_of_week ?? null,
    day_of_month: data.day_of_month ?? null,
    week_of_month: data.week_of_month ?? null,
    custom_days: customDays,
    academic_year_id: data.academic_year_id,
    semester_id: data.semester_id ?? null,
    modality,
    exam_type: data.exam_type ?? null,
    subject: data.subject ?? null
  }

  const conflicts = detectConflicts(candidateForDetection)

  // Check for HARD conflicts without override
  const hardConflicts = conflicts.filter((c) => c.severity === 'HARD')
  if (hardConflicts.length > 0 && !data.override_reason) {
    throwError(
      ERROR_CODES.HARD_CONFLICT,
      `${hardConflicts.map((c) => c.message).join(' | ')} — Add an override reason to save anyway.`
    )
  }

  const id = randomUUID()
  const conflictFlags = JSON.stringify(conflicts.map((c) => c.code))

  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO schedule_entries (id, department, activity_type, room_id, personnel_id,
       section_ids, subject, subject_code, lec_units, lab_units, exam_title, exam_type, modality, start_time, end_time,
       recurrence_pattern, recurrence_start_date, recurrence_end_date, day_of_week,
       day_of_month, week_of_month, custom_days, academic_year_id, semester_id,
       status, conflict_flags, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, datetime('now'), datetime('now'))`
    ).run(
      id, data.department, data.activity_type, data.room_id ?? null,
      data.personnel_id ?? null, sectionIds, data.subject ?? null,
      data.subject_code ?? null, data.lec_units ?? 0, data.lab_units ?? 0,
      data.exam_title ?? null, data.exam_type ?? null, modality,
      data.start_time, data.end_time, data.recurrence_pattern,
      data.recurrence_start_date, data.recurrence_end_date ?? null,
      data.day_of_week ?? null, data.day_of_month ?? null,
      data.week_of_month ?? null, customDays,
      data.academic_year_id, data.semester_id ?? null,
      conflictFlags, data.notes ?? null
    )

    logAudit({
      entity_type: 'schedule_entry',
      entity_id: id,
      department: data.department,
      action: 'CREATE',
      after_snapshot: { ...data, id },
      conflict_snapshot: conflicts.length > 0 ? conflicts : undefined,
      override_reason: data.override_reason
    })
  })

  create()
  return { entry: getScheduleEntry(id), conflicts }
}

/**
 * Update a draft schedule entry.
 */
export function updateDraftEntry(data: {
  id: string
  room_id?: string | null
  personnel_id?: string | null
  section_ids?: string[]
  subject?: string | null
  subject_code?: string | null
  lec_units?: number
  lab_units?: number
  exam_title?: string | null
  exam_type?: ExamType | null
  modality?: Modality
  start_time?: string
  end_time?: string
  recurrence_pattern?: RecurrencePattern
  recurrence_start_date?: string
  recurrence_end_date?: string | null
  day_of_week?: number | null
  day_of_month?: number | null
  week_of_month?: number | null
  custom_days?: number[] | null
  notes?: string | null
  override_reason?: string | null
}): { entry: ScheduleEntry; conflicts: ConflictFlag[] } {
  const db = getDatabase()
  const existing = getScheduleEntry(data.id)

  if (existing.status !== 'DRAFT') {
    throwError(ERROR_CODES.CANNOT_EDIT_PUBLISHED, 'Cannot edit a published entry. Unpublish first.')
  }

  const merged = {
    id: data.id,
    department: existing.department,
    activity_type: existing.activity_type,
    room_id: data.room_id !== undefined ? data.room_id : existing.room_id,
    personnel_id: data.personnel_id !== undefined ? data.personnel_id : existing.personnel_id,
    section_ids: data.section_ids ? JSON.stringify(data.section_ids) : existing.section_ids,
    subject: data.subject !== undefined ? data.subject : existing.subject,
    subject_code: data.subject_code !== undefined ? data.subject_code : existing.subject_code,
    lec_units: data.lec_units !== undefined ? data.lec_units : existing.lec_units,
    lab_units: data.lab_units !== undefined ? data.lab_units : existing.lab_units,
    exam_title: data.exam_title !== undefined ? data.exam_title : existing.exam_title,
    exam_type: data.exam_type !== undefined ? data.exam_type : existing.exam_type,
    modality: data.modality ?? (existing.modality as Modality),
    start_time: data.start_time ?? existing.start_time,
    end_time: data.end_time ?? existing.end_time,
    recurrence_pattern: data.recurrence_pattern ?? (existing.recurrence_pattern as RecurrencePattern),
    recurrence_start_date: data.recurrence_start_date ?? existing.recurrence_start_date,
    recurrence_end_date: data.recurrence_end_date !== undefined ? data.recurrence_end_date : existing.recurrence_end_date,
    day_of_week: data.day_of_week !== undefined ? data.day_of_week : existing.day_of_week,
    day_of_month: data.day_of_month !== undefined ? data.day_of_month : existing.day_of_month,
    week_of_month: data.week_of_month !== undefined ? data.week_of_month : existing.week_of_month,
    custom_days: data.custom_days ? JSON.stringify(data.custom_days) : existing.custom_days,
    academic_year_id: existing.academic_year_id,
    semester_id: existing.semester_id
  }

  // Re-run conflict detection
  // For EXAM entries, first validate exam period exists
  if (existing.activity_type === 'EXAM') {
    const occs = expandRecurrence(
      merged.recurrence_pattern as RecurrencePattern,
      merged.recurrence_start_date,
      merged.recurrence_end_date,
      {
        dayOfWeek: merged.day_of_week,
        dayOfMonth: merged.day_of_month,
        weekOfMonth: merged.week_of_month,
        customDays: merged.custom_days ? JSON.parse(merged.custom_days as string) : null
      }
    )
    validateExamPeriodExists(occs, merged.semester_id)
  }

  const conflicts = detectConflicts(merged)
  const hardConflicts = conflicts.filter((c) => c.severity === 'HARD')
  if (hardConflicts.length > 0 && !data.override_reason) {
    throwError(ERROR_CODES.HARD_CONFLICT, `${hardConflicts.map((c) => c.message).join(' | ')} — Add an override reason to save anyway.`)
  }

  const conflictFlags = JSON.stringify(conflicts.map((c) => c.code))

  const update = db.transaction(() => {
    db.prepare(
      `UPDATE schedule_entries SET room_id = ?, personnel_id = ?, section_ids = ?,
       subject = ?, subject_code = ?, lec_units = ?, lab_units = ?, exam_title = ?, exam_type = ?, modality = ?, start_time = ?,
       end_time = ?, recurrence_pattern = ?, recurrence_start_date = ?,
       recurrence_end_date = ?, day_of_week = ?, day_of_month = ?, week_of_month = ?,
       custom_days = ?, conflict_flags = ?, notes = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      merged.room_id, merged.personnel_id, merged.section_ids, merged.subject,
      merged.subject_code, merged.lec_units, merged.lab_units,
      merged.exam_title, merged.exam_type, merged.modality, merged.start_time,
      merged.end_time, merged.recurrence_pattern, merged.recurrence_start_date,
      merged.recurrence_end_date, merged.day_of_week, merged.day_of_month,
      merged.week_of_month, merged.custom_days, conflictFlags, data.notes !== undefined ? data.notes : existing.notes,
      data.id
    )

    logAudit({
      entity_type: 'schedule_entry',
      entity_id: data.id,
      department: existing.department,
      action: 'UPDATE',
      before_snapshot: existing,
      after_snapshot: merged,
      conflict_snapshot: conflicts.length > 0 ? conflicts : undefined,
      override_reason: data.override_reason
    })
  })

  update()
  return { entry: getScheduleEntry(data.id), conflicts }
}

/**
 * Soft-delete a draft entry.
 */
export function deleteDraftEntry(id: string): void {
  const db = getDatabase()
  const existing = getScheduleEntry(id)

  if (existing.status !== 'DRAFT') {
    throwError(ERROR_CODES.CANNOT_EDIT_PUBLISHED, 'Cannot delete a published entry. Unpublish first.')
  }

  const del = db.transaction(() => {
    db.prepare("UPDATE schedule_entries SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(id)

    logAudit({
      entity_type: 'schedule_entry',
      entity_id: id,
      department: existing.department,
      action: 'DELETE',
      before_snapshot: existing
    })
  })

  del()
}

/**
 * Validate an entry against the field dependency matrix.
 */
function validateEntry(data: {
  activity_type: ActivityType
  room_id?: string | null
  personnel_id?: string | null
  section_ids?: string[]
  subject?: string | null
  exam_title?: string | null
  exam_type?: ExamType | null
  modality?: Modality
  start_time: string
  end_time: string
  recurrence_pattern: RecurrencePattern
}): void {
  const rules = FIELD_DEPENDENCY_MATRIX[data.activity_type]
  const modality = data.modality ?? 'F2F'

  // Room validation
  const roomVis = resolveRoomVisibility(data.activity_type, modality)
  if (roomVis === 'required' && !data.room_id) {
    throwError(ERROR_CODES.ROOM_REQUIRED, 'Room is required for this activity type and modality.')
  }

  // Personnel validation
  if (rules.personnel_id === 'required' && !data.personnel_id) {
    throwError(ERROR_CODES.REQUIRED_FIELD, 'Personnel is required for this activity type.')
  }

  // Section validation
  if (rules.section_ids === 'required' && (!data.section_ids || data.section_ids.length === 0)) {
    throwError(ERROR_CODES.REQUIRED_FIELD, 'At least one section is required for this activity type.')
  }

  // Subject validation
  if (rules.subject === 'required' && !data.subject) {
    throwError(ERROR_CODES.REQUIRED_FIELD, 'Subject is required for this activity type.')
  }

  // Exam fields
  if (rules.exam_title === 'required' && !data.exam_title) {
    throwError(ERROR_CODES.REQUIRED_FIELD, 'Exam title is required.')
  }
  if (rules.exam_type === 'required' && !data.exam_type) {
    throwError(ERROR_CODES.REQUIRED_FIELD, 'Exam type is required.')
  }

  // EXAM must use ONCE recurrence
  if (data.activity_type === 'EXAM' && data.recurrence_pattern !== 'ONCE') {
    throwError(ERROR_CODES.EXAM_ONCE_ONLY, 'Exams must use the ONCE recurrence pattern.')
  }

  // Time validation
  if (data.start_time >= data.end_time) {
    throwError(ERROR_CODES.INVALID_TIME_RANGE, 'Start time must be before end time.')
  }

  // Check for midnight spanning
  const [sh] = data.start_time.split(':').map(Number)
  const [eh] = data.end_time.split(':').map(Number)
  if (eh < sh) {
    throwError(ERROR_CODES.MIDNIGHT_SPANNING, 'Schedule entries cannot span midnight.')
  }

  // Cross-department section validation
  if (data.section_ids && data.section_ids.length > 0) {
    // This would be checked at the service level with DB access
    // For now, basic validation is sufficient
  }
}

/**
 * Validate an entry without saving (dry-run for the UI).
 */
export function validateEntryDryRun(data: Parameters<typeof createDraftEntry>[0]): {
  valid: boolean
  conflicts: ConflictFlag[]
  validationError?: string
} {
  try {
    validateEntry(data)
  } catch (err) {
    return {
      valid: false,
      conflicts: [],
      validationError: (err as Error).message
    }
  }

  const sectionIds = JSON.stringify(data.section_ids ?? [])
  const customDays = data.custom_days ? JSON.stringify(data.custom_days) : null
  const modality = data.modality ?? 'F2F'

  const conflicts = detectConflicts({
    department: data.department,
    activity_type: data.activity_type,
    room_id: data.room_id ?? null,
    personnel_id: data.personnel_id ?? null,
    section_ids: sectionIds,
    start_time: data.start_time,
    end_time: data.end_time,
    recurrence_pattern: data.recurrence_pattern,
    recurrence_start_date: data.recurrence_start_date,
    recurrence_end_date: data.recurrence_end_date ?? null,
    day_of_week: data.day_of_week ?? null,
    day_of_month: data.day_of_month ?? null,
    week_of_month: data.week_of_month ?? null,
    custom_days: customDays,
    academic_year_id: data.academic_year_id,
    semester_id: data.semester_id ?? null,
    modality,
    exam_type: data.exam_type ?? null,
    subject: data.subject ?? null
  })

  const hasHard = conflicts.some((c) => c.severity === 'HARD')
  return { valid: !hasHard, conflicts }
}
