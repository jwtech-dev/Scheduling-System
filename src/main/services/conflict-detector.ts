// ============================================================
// Conflict Detection Engine — TASK-14
// ============================================================
// Runs 15 detectors (9 HARD, 6 SOFT) against a schedule entry candidate.
// Returns an array of ConflictFlag objects.

import { getDatabase } from '../database/connection'
import { expandRecurrence } from './recurrence-expander'
import { getBlockingEventsInRange } from './calendar-event-service'
import type {
  ScheduleEntry,
  ConflictFlag,
  Room,
  Personnel,
  Department,
  ActivityType,
  RecurrencePattern
} from '../../shared/types'
import { CONFLICT_CODES } from '../../shared/constants'

interface CandidateEntry {
  id?: string // Undefined for new entries
  department: Department
  activity_type: ActivityType
  room_id: string | null
  personnel_id: string | null
  section_ids: string // JSON array
  start_time: string
  end_time: string
  recurrence_pattern: RecurrencePattern
  recurrence_start_date: string
  recurrence_end_date: string | null
  day_of_week: number | null
  day_of_month: number | null
  week_of_month: number | null
  custom_days: string | null
  academic_year_id: string
  semester_id: string | null
  modality: string
  exam_type?: string | null
  subject?: string | null
}

/**
 * Run all 15 conflict detectors against a candidate entry.
 */
export function detectConflicts(candidate: CandidateEntry): ConflictFlag[] {
  const conflicts: ConflictFlag[] = []

  // Expand candidate occurrences
  const occurrences = expandRecurrence(
    candidate.recurrence_pattern,
    candidate.recurrence_start_date,
    candidate.recurrence_end_date,
    {
      dayOfWeek: candidate.day_of_week,
      dayOfMonth: candidate.day_of_month,
      weekOfMonth: candidate.week_of_month,
      customDays: candidate.custom_days ? JSON.parse(candidate.custom_days) : null
    }
  )

  if (occurrences.length === 0) return conflicts

  const db = getDatabase()
  const parsedSectionIds: string[] = JSON.parse(candidate.section_ids || '[]')

  // === HARD DETECTORS (9) ===

  // 1. Room conflict — double booking
  if (candidate.room_id) {
    const roomConflicts = findTimeOverlaps(
      db,
      'room_id',
      candidate.room_id,
      candidate,
      occurrences
    )
    if (roomConflicts.length > 0) {
      conflicts.push({
        code: CONFLICT_CODES.ROOM_CONFLICT.code,
        severity: CONFLICT_CODES.ROOM_CONFLICT.severity,
        message: `Room is already booked at ${roomConflicts.length} occurrence(s).`,
        details: { overlapping_entries: roomConflicts }
      })
    }
  }

  // 2. Personnel conflict — double booking
  if (candidate.personnel_id) {
    const personnelConflicts = findTimeOverlaps(
      db,
      'personnel_id',
      candidate.personnel_id,
      candidate,
      occurrences
    )
    if (personnelConflicts.length > 0) {
      conflicts.push({
        code: CONFLICT_CODES.PERSONNEL_CONFLICT.code,
        severity: CONFLICT_CODES.PERSONNEL_CONFLICT.severity,
        message: `Personnel is already assigned at ${personnelConflicts.length} occurrence(s).`,
        details: { overlapping_entries: personnelConflicts }
      })
    }
  }

  // 3. Section conflict — double booking
  for (const sectionId of parsedSectionIds) {
    const sectionConflicts = findSectionTimeOverlaps(db, sectionId, candidate, occurrences)
    if (sectionConflicts.length > 0) {
      conflicts.push({
        code: CONFLICT_CODES.SECTION_CONFLICT.code,
        severity: CONFLICT_CODES.SECTION_CONFLICT.severity,
        message: `Section has a conflicting schedule at ${sectionConflicts.length} occurrence(s).`,
        details: { section_id: sectionId, overlapping_entries: sectionConflicts }
      })
      break // One section conflict is enough
    }
  }

  // 4. Blocked by calendar event
  if (occurrences.length > 0) {
    const firstDate = occurrences[0].date
    const lastDate = occurrences[occurrences.length - 1].date
    const blockingEvents = getBlockingEventsInRange(firstDate, lastDate + 'T23:59:59')

    const blockedDates = occurrences.filter((occ) =>
      blockingEvents.some((evt) => occ.date >= evt.start_datetime.split('T')[0] && occ.date <= evt.end_datetime.split('T')[0])
    )

    if (blockedDates.length > 0) {
      conflicts.push({
        code: CONFLICT_CODES.BLOCKED_BY_EVENT.code,
        severity: CONFLICT_CODES.BLOCKED_BY_EVENT.severity,
        message: `${blockedDates.length} occurrence(s) fall on blocked calendar dates.`,
        details: { blocked_dates: blockedDates.map((d) => d.date) }
      })
    }
  }

  // 5. Personnel overload — exceeds max_weekly_hours
  if (candidate.personnel_id) {
    const personnel = db
      .prepare('SELECT * FROM personnel WHERE id = ? AND is_active = 1')
      .get(candidate.personnel_id) as Personnel | undefined

    if (personnel) {
      const overloaded = checkWeeklyOverload(db, personnel, candidate, occurrences)
      if (overloaded) {
        conflicts.push({
          code: CONFLICT_CODES.PERSONNEL_OVERLOAD.code,
          severity: CONFLICT_CODES.PERSONNEL_OVERLOAD.severity,
          message: `Adding this entry would exceed the ${personnel.max_weekly_hours}h/week limit.`,
          details: { max_weekly_hours: personnel.max_weekly_hours }
        })
      }
    }
  }

  // 6. Room unavailable (MAINTENANCE/INACTIVE status)
  if (candidate.room_id) {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(candidate.room_id) as Room | undefined
    if (room && room.status !== 'AVAILABLE') {
      conflicts.push({
        code: CONFLICT_CODES.ROOM_UNAVAILABLE.code,
        severity: CONFLICT_CODES.ROOM_UNAVAILABLE.severity,
        message: `Room "${room.room_code}" is currently ${room.status}.`
      })
    }
  }

  // 7. Room department mismatch
  if (candidate.room_id) {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(candidate.room_id) as Room | undefined
    if (room) {
      const mismatch =
        (room.department_availability === 'SHS_ONLY' && candidate.department !== 'SHS') ||
        (room.department_availability === 'COLLEGE_ONLY' && candidate.department !== 'COLLEGE')
      if (mismatch) {
        conflicts.push({
          code: CONFLICT_CODES.ROOM_DEPT_MISMATCH.code,
          severity: CONFLICT_CODES.ROOM_DEPT_MISMATCH.severity,
          message: `Room "${room.room_code}" is restricted to ${room.department_availability}.`
        })
      }
    }
  }

  // 8. Personnel inactive
  if (candidate.personnel_id) {
    const p = db.prepare('SELECT status FROM personnel WHERE id = ?').get(candidate.personnel_id) as { status: string } | undefined
    if (p && p.status === 'INACTIVE') {
      conflicts.push({
        code: CONFLICT_CODES.PERSONNEL_INACTIVE.code,
        severity: CONFLICT_CODES.PERSONNEL_INACTIVE.severity,
        message: 'Assigned personnel is currently inactive.'
      })
    }
  }

  // 9. Section inactive
  for (const sectionId of parsedSectionIds) {
    const s = db.prepare('SELECT status, section_code FROM sections WHERE id = ?').get(sectionId) as { status: string; section_code: string } | undefined
    if (s && s.status === 'INACTIVE') {
      conflicts.push({
        code: CONFLICT_CODES.SECTION_INACTIVE.code,
        severity: CONFLICT_CODES.SECTION_INACTIVE.severity,
        message: `Section "${s.section_code}" is currently inactive.`
      })
      break
    }
  }

  // === SOFT DETECTORS (6) ===

  // 10. Capacity exceeded
  if (candidate.room_id && parsedSectionIds.length > 0) {
    const room = db.prepare('SELECT capacity FROM rooms WHERE id = ?').get(candidate.room_id) as { capacity: number } | undefined
    if (room) {
      let totalStudents = 0
      for (const sid of parsedSectionIds) {
        const sec = db.prepare('SELECT student_count FROM sections WHERE id = ?').get(sid) as { student_count: number } | undefined
        totalStudents += sec?.student_count ?? 0
      }
      if (totalStudents > room.capacity) {
        conflicts.push({
          code: CONFLICT_CODES.CAPACITY_EXCEEDED.code,
          severity: CONFLICT_CODES.CAPACITY_EXCEEDED.severity,
          message: `Total students (${totalStudents}) exceeds room capacity (${room.capacity}).`,
          details: { total_students: totalStudents, room_capacity: room.capacity }
        })
      }
    }
  }

  // 11. Workload approaching (>80% of max)
  if (candidate.personnel_id) {
    const personnel = db.prepare('SELECT max_weekly_hours FROM personnel WHERE id = ?').get(candidate.personnel_id) as { max_weekly_hours: number } | undefined
    if (personnel) {
      const threshold = personnel.max_weekly_hours * 0.8
      const approaching = checkWorkloadApproaching(db, candidate.personnel_id, candidate, occurrences, threshold)
      if (approaching) {
        conflicts.push({
          code: CONFLICT_CODES.WORKLOAD_APPROACHING.code,
          severity: CONFLICT_CODES.WORKLOAD_APPROACHING.severity,
          message: `Personnel is approaching ${personnel.max_weekly_hours}h/week limit (>80%).`
        })
      }
    }
  }

  // 12. Specialization mismatch
  if (candidate.personnel_id && candidate.subject && candidate.activity_type === 'CLASS') {
    const p = db.prepare('SELECT specializations FROM personnel WHERE id = ?').get(candidate.personnel_id) as { specializations: string } | undefined
    if (p) {
      const specs: string[] = JSON.parse(p.specializations || '[]')
      if (specs.length > 0 && !specs.some((s) => candidate.subject!.toLowerCase().includes(s.toLowerCase()))) {
        conflicts.push({
          code: CONFLICT_CODES.SPECIALIZATION_MISMATCH.code,
          severity: CONFLICT_CODES.SPECIALIZATION_MISMATCH.severity,
          message: `Subject "${candidate.subject}" doesn't match personnel's specializations.`
        })
      }
    }
  }

  // 13. Personnel department mismatch (cross-dept without is_shared)
  if (candidate.personnel_id) {
    const p = db
      .prepare('SELECT department, is_shared FROM personnel WHERE id = ?')
      .get(candidate.personnel_id) as { department: string; is_shared: number } | undefined
    if (p && p.department !== candidate.department && !p.is_shared) {
      conflicts.push({
        code: CONFLICT_CODES.PERSONNEL_DEPT_MISMATCH.code,
        severity: CONFLICT_CODES.PERSONNEL_DEPT_MISMATCH.severity,
        message: `Personnel belongs to ${p.department} and is not marked as shared.`
      })
    }
  }

  // 14. Exam period mismatch (EXAM not during EXAM_PERIOD calendar event)
  if (candidate.activity_type === 'EXAM') {
    const firstDate = occurrences[0]?.date
    if (firstDate) {
      const examPeriods = db
        .prepare(
          "SELECT id FROM calendar_events WHERE event_type = 'EXAM_PERIOD' AND is_active = 1 AND start_datetime <= ? AND end_datetime >= ?"
        )
        .all(firstDate + 'T23:59:59', firstDate + 'T00:00:00')
      if (examPeriods.length === 0) {
        conflicts.push({
          code: CONFLICT_CODES.EXAM_PERIOD_MISMATCH.code,
          severity: CONFLICT_CODES.EXAM_PERIOD_MISMATCH.severity,
          message: 'This exam is not scheduled during a designated exam period.'
        })
      }
    }
  }

  // 15. SHS exam quarter mismatch
  if (candidate.activity_type === 'EXAM' && candidate.department === 'SHS' && candidate.exam_type) {
    // Q1/Q2 exams should be in 1st semester, Q3/Q4 in 2nd semester
    if (candidate.semester_id) {
      const sem = db.prepare('SELECT semester_type FROM semesters WHERE id = ?').get(candidate.semester_id) as { semester_type: string } | undefined
      if (sem) {
        const q1q2 = ['Q1_EXAM', 'Q2_EXAM']
        const q3q4 = ['Q3_EXAM', 'Q4_EXAM']
        if (q1q2.includes(candidate.exam_type) && sem.semester_type !== '1ST_SEMESTER') {
          conflicts.push({
            code: CONFLICT_CODES.EXAM_QUARTER_MISMATCH.code,
            severity: CONFLICT_CODES.EXAM_QUARTER_MISMATCH.severity,
            message: `${candidate.exam_type} should be in 1st semester.`
          })
        }
        if (q3q4.includes(candidate.exam_type) && sem.semester_type !== '2ND_SEMESTER') {
          conflicts.push({
            code: CONFLICT_CODES.EXAM_QUARTER_MISMATCH.code,
            severity: CONFLICT_CODES.EXAM_QUARTER_MISMATCH.severity,
            message: `${candidate.exam_type} should be in 2nd semester.`
          })
        }
      }
    }
  }

  return conflicts
}

// === Helper functions ===

function findTimeOverlaps(
  db: ReturnType<typeof getDatabase>,
  field: 'room_id' | 'personnel_id',
  value: string,
  candidate: CandidateEntry,
  occurrences: { date: string }[]
): string[] {
  const overlapping: string[] = []
  const dates = occurrences.map((o) => o.date)

  // Query existing entries with the same resource
  const existing = db
    .prepare(
      `SELECT id, start_time, end_time, recurrence_pattern, recurrence_start_date,
       recurrence_end_date, day_of_week, day_of_month, week_of_month, custom_days
       FROM schedule_entries
       WHERE ${field} = ? AND is_active = 1 AND id != ?`
    )
    .all(value, candidate.id ?? '') as ScheduleEntry[]

  for (const entry of existing) {
    const entryOccs = expandRecurrence(
      entry.recurrence_pattern as RecurrencePattern,
      entry.recurrence_start_date,
      entry.recurrence_end_date,
      {
        dayOfWeek: entry.day_of_week,
        dayOfMonth: entry.day_of_month,
        weekOfMonth: entry.week_of_month,
        customDays: entry.custom_days ? JSON.parse(entry.custom_days) : null
      }
    )

    const entryDates = new Set(entryOccs.map((o) => o.date))
    const overlappingDates = dates.filter((d) => entryDates.has(d))

    if (overlappingDates.length > 0 && timesOverlap(candidate.start_time, candidate.end_time, entry.start_time, entry.end_time)) {
      overlapping.push(entry.id)
    }
  }

  return overlapping
}

function findSectionTimeOverlaps(
  db: ReturnType<typeof getDatabase>,
  sectionId: string,
  candidate: CandidateEntry,
  occurrences: { date: string }[]
): string[] {
  const overlapping: string[] = []
  const dates = occurrences.map((o) => o.date)

  const existing = db
    .prepare(
      `SELECT id, section_ids, start_time, end_time, recurrence_pattern, recurrence_start_date,
       recurrence_end_date, day_of_week, day_of_month, week_of_month, custom_days
       FROM schedule_entries
       WHERE is_active = 1 AND id != ? AND section_ids LIKE ?`
    )
    .all(candidate.id ?? '', `%${sectionId}%`) as ScheduleEntry[]

  for (const entry of existing) {
    // Verify the section is actually in the JSON array (avoid false positives from LIKE)
    const entrySections: string[] = JSON.parse(entry.section_ids || '[]')
    if (!entrySections.includes(sectionId)) continue

    const entryOccs = expandRecurrence(
      entry.recurrence_pattern as RecurrencePattern,
      entry.recurrence_start_date,
      entry.recurrence_end_date,
      {
        dayOfWeek: entry.day_of_week,
        dayOfMonth: entry.day_of_month,
        weekOfMonth: entry.week_of_month,
        customDays: entry.custom_days ? JSON.parse(entry.custom_days) : null
      }
    )

    const entryDates = new Set(entryOccs.map((o) => o.date))
    const overlappingDates = dates.filter((d) => entryDates.has(d))

    if (overlappingDates.length > 0 && timesOverlap(candidate.start_time, candidate.end_time, entry.start_time, entry.end_time)) {
      overlapping.push(entry.id)
    }
  }

  return overlapping
}

function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 < end2 && start2 < end1
}

function checkWeeklyOverload(
  db: ReturnType<typeof getDatabase>,
  personnel: Personnel,
  candidate: CandidateEntry,
  occurrences: { date: string }[]
): boolean {
  // Calculate hours for this candidate per week
  const candidateHours = calculateHours(candidate.start_time, candidate.end_time)

  // For each occurrence date, get the ISO week and check total hours
  for (const occ of occurrences.slice(0, 10)) { // Check first 10 weeks
    const weekStart = getWeekStart(occ.date)
    const weekEnd = getWeekEnd(occ.date)

    const existingHours = getPersonnelWeeklyHours(db, personnel.id, weekStart, weekEnd, candidate.id)
    const candidateWeekOccs = occurrences.filter((o) => o.date >= weekStart && o.date <= weekEnd)
    const totalNewHours = candidateWeekOccs.length * candidateHours

    if (existingHours + totalNewHours > personnel.max_weekly_hours) {
      return true
    }
  }

  return false
}

function checkWorkloadApproaching(
  db: ReturnType<typeof getDatabase>,
  personnelId: string,
  candidate: CandidateEntry,
  occurrences: { date: string }[],
  threshold: number
): boolean {
  if (occurrences.length === 0) return false
  const occ = occurrences[0]
  const weekStart = getWeekStart(occ.date)
  const weekEnd = getWeekEnd(occ.date)
  const existingHours = getPersonnelWeeklyHours(db, personnelId, weekStart, weekEnd, candidate.id)
  const candidateHours = calculateHours(candidate.start_time, candidate.end_time)
  return existingHours + candidateHours > threshold
}

function getPersonnelWeeklyHours(
  db: ReturnType<typeof getDatabase>,
  personnelId: string,
  weekStart: string,
  weekEnd: string,
  excludeId?: string
): number {
  const entries = db
    .prepare(
      `SELECT start_time, end_time, recurrence_pattern, recurrence_start_date, recurrence_end_date,
       day_of_week, day_of_month, week_of_month, custom_days
       FROM schedule_entries
       WHERE personnel_id = ? AND is_active = 1 AND id != ?`
    )
    .all(personnelId, excludeId ?? '') as ScheduleEntry[]

  let totalHours = 0
  for (const entry of entries) {
    const occs = expandRecurrence(
      entry.recurrence_pattern as RecurrencePattern,
      entry.recurrence_start_date,
      entry.recurrence_end_date,
      {
        dayOfWeek: entry.day_of_week,
        dayOfMonth: entry.day_of_month,
        weekOfMonth: entry.week_of_month,
        customDays: entry.custom_days ? JSON.parse(entry.custom_days) : null
      }
    )
    const weekOccs = occs.filter((o) => o.date >= weekStart && o.date <= weekEnd)
    totalHours += weekOccs.length * calculateHours(entry.start_time, entry.end_time)
  }

  return totalHours
}

function calculateHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em - (sh * 60 + sm)) / 60
}

function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay()
  date.setDate(date.getDate() - day) // Sunday
  return formatDate(date)
}

function getWeekEnd(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay()
  date.setDate(date.getDate() + (6 - day)) // Saturday
  return formatDate(date)
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
