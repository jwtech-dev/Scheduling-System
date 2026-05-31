// ============================================================
// Publish Workflow Service — TASK-16
// ============================================================

import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { detectConflicts } from './conflict-detector'
import { getScheduleEntry } from './schedule-entry-service'
import type { ScheduleEntry, ConflictFlag, RecurrencePattern } from '../../shared/types'
import { ERROR_CODES } from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

/**
 * Publish one or more DRAFT entries. Runs conflict check first.
 * Blocks if any entry has unresolved HARD conflicts.
 */
export function publishEntries(ids: string[]): {
  published: string[]
  blocked: Array<{ id: string; conflicts: ConflictFlag[] }>
} {
  const db = getDatabase()
  const published: string[] = []
  const blocked: Array<{ id: string; conflicts: ConflictFlag[] }> = []

  const publish = db.transaction(() => {
    for (const id of ids) {
      const entry = getScheduleEntry(id)
      if (entry.status !== 'DRAFT') continue

      // Re-run conflict detection
      const conflicts = detectConflicts({
        id: entry.id,
        department: entry.department,
        activity_type: entry.activity_type,
        room_id: entry.room_id,
        personnel_id: entry.personnel_id,
        section_ids: entry.section_ids,
        start_time: entry.start_time,
        end_time: entry.end_time,
        recurrence_pattern: entry.recurrence_pattern as RecurrencePattern,
        recurrence_start_date: entry.recurrence_start_date,
        recurrence_end_date: entry.recurrence_end_date,
        day_of_week: entry.day_of_week,
        day_of_month: entry.day_of_month,
        week_of_month: entry.week_of_month,
        custom_days: entry.custom_days,
        academic_year_id: entry.academic_year_id,
        semester_id: entry.semester_id,
        modality: entry.modality,
        exam_type: entry.exam_type,
        subject: entry.subject
      })

      const hardConflicts = conflicts.filter((c) => c.severity === 'HARD')
      if (hardConflicts.length > 0) {
        blocked.push({ id, conflicts })
        continue
      }

      db.prepare(
        "UPDATE schedule_entries SET status = 'PUBLISHED', conflict_flags = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(JSON.stringify(conflicts.map((c) => c.code)), id)

      logAudit({
        entity_type: 'schedule_entry',
        entity_id: id,
        department: entry.department,
        action: 'PUBLISH',
        before_snapshot: { status: 'DRAFT' },
        after_snapshot: { status: 'PUBLISHED' },
        conflict_snapshot: conflicts.length > 0 ? conflicts : undefined
      })

      published.push(id)
    }
  })

  publish()
  return { published, blocked }
}

/**
 * Unpublish entries back to DRAFT.
 */
export function unpublishEntries(ids: string[]): string[] {
  const db = getDatabase()
  const unpublished: string[] = []

  const unpublish = db.transaction(() => {
    for (const id of ids) {
      const entry = getScheduleEntry(id)
      if (entry.status !== 'PUBLISHED') continue

      db.prepare(
        "UPDATE schedule_entries SET status = 'DRAFT', updated_at = datetime('now') WHERE id = ?"
      ).run(id)

      logAudit({
        entity_type: 'schedule_entry',
        entity_id: id,
        department: entry.department,
        action: 'UNPUBLISH',
        before_snapshot: { status: 'PUBLISHED' },
        after_snapshot: { status: 'DRAFT' }
      })

      unpublished.push(id)
    }
  })

  unpublish()
  return unpublished
}

/**
 * Re-validate all published entries (cascade check after resource changes).
 * Returns entries whose conflict status changed.
 */
export function revalidatePublishedEntries(filters: {
  department?: string
  semester_id?: string
} = {}): Array<{ id: string; oldFlags: string; newFlags: string; conflicts: ConflictFlag[] }> {
  const db = getDatabase()
  const conditions: string[] = ["status = 'PUBLISHED'", 'is_active = 1']
  const params: unknown[] = []

  if (filters.department) { conditions.push('department = ?'); params.push(filters.department) }
  if (filters.semester_id) { conditions.push('semester_id = ?'); params.push(filters.semester_id) }

  const entries = db
    .prepare(`SELECT * FROM schedule_entries WHERE ${conditions.join(' AND ')}`)
    .all(...params) as ScheduleEntry[]

  const changed: Array<{ id: string; oldFlags: string; newFlags: string; conflicts: ConflictFlag[] }> = []

  const revalidate = db.transaction(() => {
    for (const entry of entries) {
      const conflicts = detectConflicts({
        id: entry.id,
        department: entry.department,
        activity_type: entry.activity_type,
        room_id: entry.room_id,
        personnel_id: entry.personnel_id,
        section_ids: entry.section_ids,
        start_time: entry.start_time,
        end_time: entry.end_time,
        recurrence_pattern: entry.recurrence_pattern as RecurrencePattern,
        recurrence_start_date: entry.recurrence_start_date,
        recurrence_end_date: entry.recurrence_end_date,
        day_of_week: entry.day_of_week,
        day_of_month: entry.day_of_month,
        week_of_month: entry.week_of_month,
        custom_days: entry.custom_days,
        academic_year_id: entry.academic_year_id,
        semester_id: entry.semester_id,
        modality: entry.modality,
        exam_type: entry.exam_type,
        subject: entry.subject
      })

      const newFlags = JSON.stringify(conflicts.map((c) => c.code))
      if (newFlags !== entry.conflict_flags) {
        db.prepare(
          "UPDATE schedule_entries SET conflict_flags = ?, updated_at = datetime('now') WHERE id = ?"
        ).run(newFlags, entry.id)

        changed.push({
          id: entry.id,
          oldFlags: entry.conflict_flags,
          newFlags,
          conflicts
        })
      }
    }
  })

  revalidate()
  return changed
}
