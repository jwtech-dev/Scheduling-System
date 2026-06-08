// ============================================================
// Trash Service — Archived Item Management
// ============================================================
// Manages soft-deleted (archived) items across all entity types.
// Supports listing, restoring, permanent deletion, and auto-purge.

import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'

const ENTITY_TABLE_MAP: Record<string, string> = {
  academic_year: 'academic_years',
  semester: 'semesters',
  personnel: 'personnel',
  room: 'rooms',
  section: 'sections',
  schedule_entry: 'schedule_entries',
  calendar_event: 'calendar_events'
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
 * Returns the total number of items purged across all entity types.
 */
export function purgeExpired(retentionDays = 90): { purged: number } {
  const db = getDatabase()
  let totalPurged = 0

  const purgeAll = db.transaction(() => {
    for (const [entityType, table] of Object.entries(ENTITY_TABLE_MAP)) {
      const expired = db
        .prepare(
          `SELECT * FROM ${table} WHERE archived_at IS NOT NULL AND archived_at < datetime('now', ? || ' days')`
        )
        .all(`-${retentionDays}`)

      if (expired.length > 0) {
        db.prepare(
          `DELETE FROM ${table} WHERE archived_at IS NOT NULL AND archived_at < datetime('now', ? || ' days')`
        ).run(`-${retentionDays}`)

        for (const item of expired) {
          logAudit({
            entity_type: entityType,
            entity_id: (item as Record<string, unknown>).id as string,
            action: 'DELETE',
            before_snapshot: item
          })
        }

        totalPurged += expired.length
      }
    }
  })

  purgeAll()

  return { purged: totalPurged }
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
