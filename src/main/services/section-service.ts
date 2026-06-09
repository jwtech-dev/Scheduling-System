// ============================================================
// Section Service — TASK-10
// ============================================================

import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { randomUUID } from 'crypto'
import type { Section, Department, SectionStatus } from '../../shared/types'
import { ERROR_CODES } from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

interface SectionFilters {
  department?: Department
  academic_year_id?: string
  semester_id?: string
  status?: SectionStatus
  search?: string
}

export function listSections(filters: SectionFilters = {}): Section[] {
  const db = getDatabase()
  const conditions: string[] = ['is_active = 1 AND archived_at IS NULL']
  const params: unknown[] = []

  if (filters.department) { conditions.push('department = ?'); params.push(filters.department) }
  if (filters.academic_year_id) { conditions.push('academic_year_id = ?'); params.push(filters.academic_year_id) }
  if (filters.semester_id) { conditions.push('semester_id = ?'); params.push(filters.semester_id) }
  if (filters.status) { conditions.push('status = ?'); params.push(filters.status) }
  if (filters.search) {
    conditions.push('(section_code LIKE ? OR section_name LIKE ? OR subject LIKE ?)')
    const term = `%${filters.search}%`
    params.push(term, term, term)
  }

  return db
    .prepare(`SELECT * FROM sections WHERE ${conditions.join(' AND ')} ORDER BY section_code`)
    .all(...params) as Section[]
}

export function getSection(id: string): Section {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM sections WHERE id = ? AND is_active = 1 AND archived_at IS NULL').get(id) as Section | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Section not found: ${id}`)
  return row
}

export function createSection(data: {
  department: Department
  section_code: string
  section_name?: string
  strand_track?: string
  subject?: string
  course_program?: string
  year_level?: string
  student_count: number
  academic_year_id: string
  semester_id: string
  adviser_id?: string
}): Section {
  const db = getDatabase()

  // Validate student_count bounds
  if (data.student_count < 1 || data.student_count > 5000) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Student count must be between 1 and 5,000.')
  }

  // Validate uniqueness
  const existing = db
    .prepare(
      'SELECT id FROM sections WHERE department = ? AND section_code = ? AND academic_year_id = ? AND semester_id = ? AND is_active = 1 AND archived_at IS NULL'
    )
    .get(data.department, data.section_code, data.academic_year_id, data.semester_id)
  if (existing) {
    throwError(ERROR_CODES.DUPLICATE_SECTION_CODE, `Section "${data.section_code}" already exists in this term.`)
  }

  const id = randomUUID()

  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO sections (id, department, section_code, section_name, strand_track, subject,
       course_program, year_level, student_count, academic_year_id, semester_id, adviser_id,
       created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      id, data.department, data.section_code, data.section_name ?? null,
      data.strand_track ?? null, data.subject ?? null, data.course_program ?? null,
      data.year_level ?? null, data.student_count, data.academic_year_id,
      data.semester_id, data.adviser_id ?? null
    )

    logAudit({
      entity_type: 'section',
      entity_id: id,
      department: data.department,
      action: 'CREATE',
      after_snapshot: { ...data, id }
    })
  })

  create()
  return getSection(id)
}

export function updateSection(data: {
  id: string
  section_code?: string
  section_name?: string | null
  strand_track?: string | null
  subject?: string | null
  course_program?: string | null
  year_level?: string | null
  student_count?: number
  adviser_id?: string | null
  status?: SectionStatus
}): Section {
  const db = getDatabase()
  const existing = getSection(data.id)

  // Validate student_count bounds if provided
  if (data.student_count !== undefined && (data.student_count < 1 || data.student_count > 5000)) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Student count must be between 1 and 5,000.')
  }

  if (data.section_code && data.section_code !== existing.section_code) {
    const dup = db
      .prepare(
        'SELECT id FROM sections WHERE department = ? AND section_code = ? AND academic_year_id = ? AND semester_id = ? AND id != ? AND is_active = 1 AND archived_at IS NULL'
      )
      .get(existing.department, data.section_code, existing.academic_year_id, existing.semester_id, data.id)
    if (dup) {
      throwError(ERROR_CODES.DUPLICATE_SECTION_CODE, `Section "${data.section_code}" already exists in this term.`)
    }
  }

  const updated = {
    section_code: data.section_code ?? existing.section_code,
    section_name: data.section_name !== undefined ? data.section_name : existing.section_name,
    strand_track: data.strand_track !== undefined ? data.strand_track : existing.strand_track,
    subject: data.subject !== undefined ? data.subject : existing.subject,
    course_program: data.course_program !== undefined ? data.course_program : existing.course_program,
    year_level: data.year_level !== undefined ? data.year_level : existing.year_level,
    student_count: data.student_count ?? existing.student_count,
    adviser_id: data.adviser_id !== undefined ? data.adviser_id : existing.adviser_id,
    status: data.status ?? existing.status
  }

  const update = db.transaction(() => {
    db.prepare(
      `UPDATE sections SET section_code = ?, section_name = ?, strand_track = ?, subject = ?,
       course_program = ?, year_level = ?, student_count = ?, adviser_id = ?, status = ?,
       updated_at = datetime('now') WHERE id = ?`
    ).run(
      updated.section_code, updated.section_name, updated.strand_track, updated.subject,
      updated.course_program, updated.year_level, updated.student_count, updated.adviser_id,
      updated.status, data.id
    )

    logAudit({
      entity_type: 'section',
      entity_id: data.id,
      department: existing.department,
      action: 'UPDATE',
      before_snapshot: existing,
      after_snapshot: { ...existing, ...updated }
    })
  })

  update()
  return getSection(data.id)
}

export function deleteSection(id: string): void {
  const db = getDatabase()
  const existing = getSection(id)

  // Delimiter-bounded matching to prevent substring ID collisions
  const activeEntries = db
    .prepare(
      `SELECT COUNT(*) as count FROM schedule_entries
       WHERE (',' || REPLACE(REPLACE(REPLACE(section_ids, '[', ''), ']', ''), '"', '') || ',') LIKE ('%,' || ? || ',%')
       AND status = 'PUBLISHED' AND is_active = 1`
    )
    .get(id) as { count: number }

  if (activeEntries.count > 0) {
    throwError(ERROR_CODES.DELETE_PROTECTED, `Cannot delete section "${existing.section_code}" — it has ${activeEntries.count} published schedule entries.`)
  }

  const del = db.transaction(() => {
    db.prepare(
      "UPDATE sections SET archived_at = datetime('now'), archived_by = 'admin', updated_at = datetime('now') WHERE id = ?"
    ).run(id)

    logAudit({
      entity_type: 'section',
      entity_id: id,
      department: existing.department,
      action: 'DELETE',
      before_snapshot: existing
    })
  })

  del()
}

/**
 * Get cascade count — number of related schedule entries.
 */
export function getCascadeCount(id: string): { schedule_entries: number } {
  const db = getDatabase()
  const result = db
    .prepare(
      `SELECT COUNT(*) as count FROM schedule_entries
       WHERE (',' || REPLACE(REPLACE(REPLACE(section_ids, '[', ''), ']', ''), '"', '') || ',') LIKE ('%,' || ? || ',%')
       AND is_active = 1`
    )
    .get(id) as { count: number }
  return { schedule_entries: result.count }
}

/**
 * List archived (soft-deleted) sections.
 */
export function getArchivedSections(): Section[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM sections WHERE archived_at IS NOT NULL ORDER BY archived_at DESC')
    .all() as Section[]
}

/**
 * Restore a soft-deleted section.
 */
export function restoreSection(id: string): Section {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM sections WHERE id = ? AND archived_at IS NOT NULL').get(id) as Section | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Archived section not found: ${id}`)

  const restore = db.transaction(() => {
    db.prepare(
      "UPDATE sections SET archived_at = NULL, archived_by = NULL, updated_at = datetime('now') WHERE id = ?"
    ).run(id)

    logAudit({
      entity_type: 'section',
      entity_id: id,
      department: row.department,
      action: 'RESTORE',
      before_snapshot: row
    })
  })

  restore()
  return getSection(id)
}

/**
 * Permanently delete a section from the database.
 */
export function permanentDeleteSection(id: string): void {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM sections WHERE id = ? AND archived_at IS NOT NULL').get(id) as Section | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Archived section not found: ${id}`)

  const del = db.transaction(() => {
    db.prepare('DELETE FROM sections WHERE id = ?').run(id)

    logAudit({
      entity_type: 'section',
      entity_id: id,
      department: row.department,
      action: 'PERMANENT_DELETE',
      before_snapshot: row
    })
  })

  del()
}
