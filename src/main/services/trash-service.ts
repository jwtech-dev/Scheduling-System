// ============================================================
// Trash Service — Archived Item Management
// ============================================================
// Manages soft-deleted (archived) items across all entity types.
// Supports listing, restoring, permanent deletion, and auto-purge.
// Safety checks: restore validates uniqueness, delete/purge checks references.

import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { ERROR_CODES } from '../../shared/constants'

const ENTITY_TABLE_MAP: Record<string, string> = {
  schedule_entry: 'schedule_entries',
  calendar_event: 'calendar_events',
  section: 'sections',
  semester: 'semesters',
  academic_year: 'academic_years',
  personnel: 'personnel',
  room: 'rooms',
  subject_bank: 'subject_bank'
}

function resolveTable(entityType: string): string {
  const table = ENTITY_TABLE_MAP[entityType]
  if (!table) {
    throw Object.assign(
      new Error(`Invalid entity type: ${entityType}`),
      { code: 'INVALID_ENTITY_TYPE' }
    )
  }
  return table
}

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

// ── Uniqueness Checks for Restore ────────────────────────────

/**
 * Check if restoring an item would conflict with an existing active record.
 * Each entity type has different uniqueness constraints.
 */
function checkRestoreConflict(
  db: ReturnType<typeof getDatabase>,
  entityType: string,
  item: Record<string, unknown>
): void {
  switch (entityType) {
    case 'room': {
      const conflict = db
        .prepare('SELECT id FROM rooms WHERE room_code = ? AND archived_at IS NULL AND id != ?')
        .get(item.room_code, item.id) as { id: string } | undefined
      if (conflict) {
        throwError(ERROR_CODES.RESTORE_CONFLICT, `Cannot restore: room code '${item.room_code}' is already in use by an active room.`)
      }
      break
    }
    case 'personnel': {
      const byEmpId = db
        .prepare('SELECT id FROM personnel WHERE employee_id = ? AND archived_at IS NULL AND id != ?')
        .get(item.employee_id, item.id) as { id: string } | undefined
      if (byEmpId) {
        throwError(ERROR_CODES.RESTORE_CONFLICT, `Cannot restore: employee ID '${item.employee_id}' is already in use.`)
      }
      const byEmail = db
        .prepare('SELECT id FROM personnel WHERE email = ? AND archived_at IS NULL AND id != ?')
        .get(item.email, item.id) as { id: string } | undefined
      if (byEmail) {
        throwError(ERROR_CODES.RESTORE_CONFLICT, `Cannot restore: email '${item.email}' is already in use.`)
      }
      break
    }
    case 'section': {
      const conflict = db
        .prepare(
          `SELECT id FROM sections WHERE department = ? AND section_code = ?
           AND COALESCE(subject, '') = ? AND academic_year_id = ? AND semester_id = ?
           AND archived_at IS NULL AND id != ?`
        )
        .get(
          item.department, item.section_code,
          item.subject ?? '', item.academic_year_id, item.semester_id,
          item.id
        ) as { id: string } | undefined
      if (conflict) {
        throwError(ERROR_CODES.RESTORE_CONFLICT, `Cannot restore: section '${item.section_code}' already exists in this semester.`)
      }
      break
    }
    case 'subject_bank': {
      const conflict = db
        .prepare(
          `SELECT id FROM subject_bank WHERE subject_name = ? AND course_program = ?
           AND year_level = ? AND semester_type = ? AND department = ?
           AND archived_at IS NULL AND id != ?`
        )
        .get(
          item.subject_name, item.course_program,
          item.year_level, item.semester_type, item.department,
          item.id
        ) as { id: string } | undefined
      if (conflict) {
        throwError(ERROR_CODES.RESTORE_CONFLICT, `Cannot restore: subject '${item.subject_name}' already exists for this program/year/semester.`)
      }
      break
    }
    case 'academic_year': {
      const conflict = db
        .prepare('SELECT id FROM academic_years WHERE department = ? AND label = ? AND archived_at IS NULL AND id != ?')
        .get(item.department, item.label, item.id) as { id: string } | undefined
      if (conflict) {
        throwError(ERROR_CODES.RESTORE_CONFLICT, `Cannot restore: academic year '${item.label}' already exists for ${item.department}.`)
      }
      break
    }
    case 'semester': {
      const conflict = db
        .prepare('SELECT id FROM semesters WHERE academic_year_id = ? AND semester_type = ? AND archived_at IS NULL AND id != ?')
        .get(item.academic_year_id, item.semester_type, item.id) as { id: string } | undefined
      if (conflict) {
        throwError(ERROR_CODES.RESTORE_CONFLICT, `Cannot restore: ${item.semester_type} already exists for this academic year.`)
      }
      break
    }
    // schedule_entry, calendar_event — no natural unique key, always restorable
    default:
      break
  }
}

// ── Reference Checks for Delete ──────────────────────────────

/**
 * Check if an item is referenced by active schedule entries.
 * Returns the count of referencing entries, or 0 if safe to delete.
 */
function countScheduleReferences(
  db: ReturnType<typeof getDatabase>,
  entityType: string,
  id: string
): number {
  switch (entityType) {
    case 'room': {
      const row = db
        .prepare('SELECT COUNT(*) as count FROM schedule_entries WHERE room_id = ? AND is_active = 1')
        .get(id) as { count: number }
      return row.count
    }
    case 'personnel': {
      const row = db
        .prepare('SELECT COUNT(*) as count FROM schedule_entries WHERE personnel_id = ? AND is_active = 1')
        .get(id) as { count: number }
      return row.count
    }
    case 'section': {
      // section_ids is a JSON array — use json_each to search within it
      const row = db
        .prepare(
          `SELECT COUNT(*) as count FROM schedule_entries, json_each(schedule_entries.section_ids)
           WHERE json_each.value = ? AND schedule_entries.is_active = 1`
        )
        .get(id) as { count: number }
      return row.count
    }
    // Other entity types don't have direct FK references from schedule_entries
    default:
      return 0
  }
}

/**
 * Get all archived items for a given entity type.
 */
export function getArchivedItems(entityType: string): unknown[] {
  const db = getDatabase()
  const table = resolveTable(entityType)
  return db
    .prepare(`SELECT * FROM ${table} WHERE archived_at IS NOT NULL ORDER BY archived_at DESC`)
    .all()
}

/**
 * Restore an archived item by clearing its archived_at and archived_by fields.
 * Validates uniqueness before restoring to prevent constraint violations.
 */
export function restoreItem(entityType: string, id: string): void {
  const db = getDatabase()
  const table = resolveTable(entityType)

  const item = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id)
  if (!item) {
    throw Object.assign(
      new Error(`Item not found: ${entityType}/${id}`),
      { code: 'NOT_FOUND' }
    )
  }

  // Check for uniqueness conflicts before restoring
  checkRestoreConflict(db, entityType, item as Record<string, unknown>)

  db.prepare(`UPDATE ${table} SET archived_at = NULL, archived_by = NULL WHERE id = ?`).run(id)

  logAudit({
    entity_type: entityType,
    entity_id: id,
    action: 'UPDATE',
    before_snapshot: item,
    after_snapshot: { ...(item as Record<string, unknown>), archived_at: null, archived_by: null }
  })
}

/**
 * Permanently delete an archived item from the database.
 * Blocks deletion if active schedule entries reference this item.
 */
export function permanentDelete(entityType: string, id: string): void {
  const db = getDatabase()
  const table = resolveTable(entityType)

  const item = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id)
  if (!item) {
    throw Object.assign(
      new Error(`Item not found: ${entityType}/${id}`),
      { code: 'NOT_FOUND' }
    )
  }

  // Check if active schedule entries reference this item
  const refCount = countScheduleReferences(db, entityType, id)
  if (refCount > 0) {
    const entityLabel = entityType.replace('_', ' ')
    throwError(
      ERROR_CODES.DELETE_REFERENCED,
      `Cannot permanently delete: ${refCount} active schedule ${refCount === 1 ? 'entry references' : 'entries reference'} this ${entityLabel}.`
    )
  }

  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)

  logAudit({
    entity_type: entityType,
    entity_id: id,
    action: 'DELETE',
    before_snapshot: item
  })
}

/**
 * Purge all expired archived items (older than retentionDays).
 * Skips items that are still referenced by active schedule entries.
 * Returns the total number purged and skipped.
 */
export function purgeExpired(retentionDays = 90): { purged: number; skippedReferenced: number } {
  const db = getDatabase()
  let totalPurged = 0
  let totalSkipped = 0

  const purgeAll = db.transaction(() => {
    for (const [entityType, table] of Object.entries(ENTITY_TABLE_MAP)) {
      const expired = db
        .prepare(
          `SELECT * FROM ${table} WHERE archived_at IS NOT NULL AND archived_at < datetime('now', ? || ' days')`
        )
        .all(`-${retentionDays}`) as Array<Record<string, unknown>>

      for (const item of expired) {
        // Check if this item is referenced before deleting
        const refCount = countScheduleReferences(db, entityType, item.id as string)
        if (refCount > 0) {
          totalSkipped++
          continue
        }

        db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(item.id)

        logAudit({
          entity_type: entityType,
          entity_id: item.id as string,
          action: 'DELETE',
          before_snapshot: item
        })

        totalPurged++
      }
    }
  })

  purgeAll()

  return { purged: totalPurged, skippedReferenced: totalSkipped }
}

/**
 * Get counts of archived items per entity type.
 */
export function getArchivedCounts(): Record<string, number> {
  const db = getDatabase()
  const counts: Record<string, number> = {}

  for (const [entityType, table] of Object.entries(ENTITY_TABLE_MAP)) {
    const row = db
      .prepare(`SELECT COUNT(*) as count FROM ${table} WHERE archived_at IS NOT NULL`)
      .get() as { count: number }
    counts[entityType] = row.count
  }

  return counts
}
