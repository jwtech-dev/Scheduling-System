// ============================================================
// Audit Service — Append-Only Audit Log Writer
// ============================================================
// Infrastructure service (no domain dependencies).
// Writes audit records to the audit_log table.
// Records are immutable — the table has a trigger blocking UPDATE/DELETE.

import { getDatabase } from '../database/connection'
import { randomUUID } from 'crypto'
import type { AuditAction } from '../../shared/types'

export interface AuditEntry {
  entity_type: string
  entity_id: string
  department?: string | null
  action: AuditAction
  before_snapshot?: unknown
  after_snapshot?: unknown
  conflict_snapshot?: unknown
  override_reason?: string | null
}

export interface AuditQueryFilters {
  entity_type?: string
  action?: AuditAction
  department?: string
  academic_year_id?: string
  date_from?: string
  date_to?: string
  search?: string
  limit?: number
  offset?: number
}

/**
 * Resolve the active academic year ID for a department.
 * Returns null if no active AY exists or department is not provided.
 */
function resolveActiveAyId(department?: string | null): string | null {
  if (!department) return null
  const db = getDatabase()
  const row = db
    .prepare('SELECT id FROM academic_years WHERE department = ? AND is_active = 1 AND archived_at IS NULL')
    .get(department) as { id: string } | undefined
  return row?.id ?? null
}

/**
 * Write an audit record. Must be called within the same transaction as the mutation.
 * Automatically links the record to the active academic year for the department.
 */
export function logAudit(entry: AuditEntry): void {
  const db = getDatabase()
  const academicYearId = resolveActiveAyId(entry.department)
  db.prepare(
    `INSERT INTO audit_log (id, entity_type, entity_id, department, academic_year_id, action,
     before_snapshot, after_snapshot, conflict_snapshot, override_reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(
    randomUUID(),
    entry.entity_type,
    entry.entity_id,
    entry.department ?? null,
    academicYearId,
    entry.action,
    entry.before_snapshot ? JSON.stringify(entry.before_snapshot) : null,
    entry.after_snapshot ? JSON.stringify(entry.after_snapshot) : null,
    entry.conflict_snapshot ? JSON.stringify(entry.conflict_snapshot) : null,
    entry.override_reason ?? null
  )
}

/**
 * Query audit records with filters and pagination.
 */
export function queryAuditLog(
  filters: AuditQueryFilters = {}
): { records: unknown[]; total: number } {
  const db = getDatabase()

  const conditions: string[] = ['1=1']
  const params: unknown[] = []

  if (filters.entity_type) {
    conditions.push('entity_type = ?')
    params.push(filters.entity_type)
  }
  if (filters.action) {
    conditions.push('action = ?')
    params.push(filters.action)
  }
  if (filters.department) {
    conditions.push('department = ?')
    params.push(filters.department)
  }
  if (filters.academic_year_id) {
    conditions.push('(academic_year_id = ? OR academic_year_id IS NULL)')
    params.push(filters.academic_year_id)
  }
  if (filters.date_from) {
    conditions.push('created_at >= ?')
    params.push(filters.date_from)
  }
  if (filters.date_to) {
    conditions.push('created_at <= ?')
    params.push(filters.date_to)
  }

  const where = conditions.join(' AND ')
  const limit = filters.limit ?? 25
  const offset = filters.offset ?? 0

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM audit_log WHERE ${where}`)
    .get(...params) as { total: number }

  const records = db
    .prepare(
      `SELECT * FROM audit_log WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset)

  return { records, total: countRow.total }
}
