// ============================================================
// Program Service — CRUD for curriculum/program definitions
// ============================================================

import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { randomUUID } from 'crypto'
import type { Program, Department } from '../../shared/types'
import { ERROR_CODES } from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

interface ProgramFilters {
  department?: Department
  search?: string
}

export function listPrograms(filters: ProgramFilters = {}): Program[] {
  const db = getDatabase()
  const conditions: string[] = ['is_active = 1 AND archived_at IS NULL']
  const params: unknown[] = []

  if (filters.department) {
    conditions.push('department = ?')
    params.push(filters.department)
  }
  if (filters.search) {
    conditions.push('(name LIKE ? OR description LIKE ?)')
    const term = `%${filters.search}%`
    params.push(term, term)
  }

  return db
    .prepare(`SELECT * FROM programs WHERE ${conditions.join(' AND ')} ORDER BY name`)
    .all(...params) as Program[]
}

export function getProgram(id: string): Program {
  const db = getDatabase()
  const row = db
    .prepare('SELECT * FROM programs WHERE id = ? AND is_active = 1 AND archived_at IS NULL')
    .get(id) as Program | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Program not found: ${id}`)
  return row
}

export function createProgram(data: {
  name: string
  description?: string
  department: string
}): Program {
  const db = getDatabase()

  if (!data.name?.trim()) throwError(ERROR_CODES.VALIDATION_ERROR, 'Program name is required.')
  if (!data.department) throwError(ERROR_CODES.VALIDATION_ERROR, 'Department is required.')

  // Check uniqueness
  const existing = db
    .prepare(
      'SELECT id FROM programs WHERE name = ? AND department = ? AND is_active = 1 AND archived_at IS NULL'
    )
    .get(data.name.trim(), data.department)
  if (existing) {
    throwError(
      ERROR_CODES.VALIDATION_ERROR,
      `Program "${data.name.trim()}" already exists for ${data.department}.`
    )
  }

  const id = randomUUID()

  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO programs (id, name, description, department, created_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(id, data.name.trim(), data.description?.trim() || null, data.department)

    logAudit({
      entity_type: 'program',
      entity_id: id,
      department: data.department as Department,
      action: 'CREATE',
      after_snapshot: { ...data, id }
    })
  })

  create()
  return getProgram(id)
}

export function updateProgram(data: {
  id: string
  name?: string
  description?: string | null
}): Program {
  const db = getDatabase()
  const existing = getProgram(data.id)

  const updated = {
    name: data.name?.trim() ?? existing.name,
    description:
      data.description !== undefined
        ? (data.description?.trim() || null)
        : existing.description
  }

  // Check uniqueness if name changed
  if (updated.name !== existing.name) {
    const dup = db
      .prepare(
        'SELECT id FROM programs WHERE name = ? AND department = ? AND id != ? AND is_active = 1 AND archived_at IS NULL'
      )
      .get(updated.name, existing.department, data.id)
    if (dup) {
      throwError(
        ERROR_CODES.VALIDATION_ERROR,
        `Program "${updated.name}" already exists for ${existing.department}.`
      )
    }
  }

  const update = db.transaction(() => {
    // Update the program record
    db.prepare(
      `UPDATE programs SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(updated.name, updated.description, data.id)

    // If name changed, cascade to subject_bank and sections
    if (updated.name !== existing.name) {
      db.prepare(
        `UPDATE subject_bank SET course_program = ?, updated_at = datetime('now') WHERE course_program = ? AND department = ? AND is_active = 1`
      ).run(updated.name, existing.name, existing.department)

      db.prepare(
        `UPDATE sections SET course_program = ?, updated_at = datetime('now') WHERE course_program = ? AND department = ? AND is_active = 1`
      ).run(updated.name, existing.name, existing.department)

      // Also update strand_track for SHS sections
      if (existing.department === 'SHS') {
        db.prepare(
          `UPDATE sections SET strand_track = ?, updated_at = datetime('now') WHERE strand_track = ? AND department = 'SHS' AND is_active = 1`
        ).run(updated.name, existing.name)
      }
    }

    logAudit({
      entity_type: 'program',
      entity_id: data.id,
      department: existing.department,
      action: 'UPDATE',
      before_snapshot: existing,
      after_snapshot: { ...existing, ...updated }
    })
  })

  update()
  return getProgram(data.id)
}

export function deleteProgram(id: string): void {
  const db = getDatabase()
  const existing = getProgram(id)

  const del = db.transaction(() => {
    db.prepare(
      "UPDATE programs SET archived_at = datetime('now'), archived_by = 'admin', updated_at = datetime('now') WHERE id = ?"
    ).run(id)

    logAudit({
      entity_type: 'program',
      entity_id: id,
      department: existing.department,
      action: 'DELETE',
      before_snapshot: existing
    })
  })

  del()
}
