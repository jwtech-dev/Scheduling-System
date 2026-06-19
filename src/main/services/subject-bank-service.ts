// ============================================================
// Subject Bank Service — CRUD for curriculum subjects
// ============================================================

import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { randomUUID } from 'crypto'
import type { SubjectBankEntry, Department } from '../../shared/types'
import { ERROR_CODES } from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

interface SubjectBankFilters {
  department?: Department
  course_program?: string
  year_level?: string
  semester_type?: string
  search?: string
}

export function listSubjects(filters: SubjectBankFilters = {}): SubjectBankEntry[] {
  const db = getDatabase()
  const conditions: string[] = ['is_active = 1 AND archived_at IS NULL']
  const params: unknown[] = []

  if (filters.department) {
    conditions.push('department = ?')
    params.push(filters.department)
  }
  if (filters.course_program) {
    conditions.push('course_program = ?')
    params.push(filters.course_program)
  }
  if (filters.year_level) {
    conditions.push('year_level = ?')
    params.push(filters.year_level)
  }
  if (filters.semester_type) {
    conditions.push('semester_type = ?')
    params.push(filters.semester_type)
  }
  if (filters.search) {
    conditions.push('(subject_code LIKE ? OR subject_name LIKE ?)')
    const term = `%${filters.search}%`
    params.push(term, term)
  }

  return db
    .prepare(`SELECT * FROM subject_bank WHERE ${conditions.join(' AND ')} ORDER BY course_program, year_level, semester_type, subject_code`)
    .all(...params) as SubjectBankEntry[]
}

export function getSubject(id: string): SubjectBankEntry {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM subject_bank WHERE id = ? AND is_active = 1 AND archived_at IS NULL').get(id) as SubjectBankEntry | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Subject not found: ${id}`)
  return row
}

export function createSubject(data: {
  subject_code: string
  subject_name: string
  description?: string
  course_program: string
  year_level: string
  semester_type: string
  lec_units?: number
  lab_units?: number
  pre_requisites?: string
  department: string
}): SubjectBankEntry {
  const db = getDatabase()

  // Validate required fields
  if (!data.subject_code?.trim()) throwError(ERROR_CODES.VALIDATION_ERROR, 'Subject code is required.')
  if (!data.subject_name?.trim()) throwError(ERROR_CODES.VALIDATION_ERROR, 'Subject name is required.')
  if (!data.course_program?.trim()) throwError(ERROR_CODES.VALIDATION_ERROR, 'Course/Program is required.')
  if (!data.year_level?.trim()) throwError(ERROR_CODES.VALIDATION_ERROR, 'Year level is required.')
  if (!data.semester_type?.trim()) throwError(ERROR_CODES.VALIDATION_ERROR, 'Semester is required.')

  // Check uniqueness
  const existing = db.prepare(
    'SELECT id FROM subject_bank WHERE subject_code = ? AND course_program = ? AND year_level = ? AND semester_type = ? AND department = ? AND is_active = 1'
  ).get(data.subject_code, data.course_program, data.year_level, data.semester_type, data.department)
  if (existing) {
    throwError(ERROR_CODES.VALIDATION_ERROR, `Subject "${data.subject_code}" already exists for ${data.course_program} ${data.year_level} ${data.semester_type}.`)
  }

  const id = randomUUID()

  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO subject_bank (id, subject_code, subject_name, description, course_program, year_level, semester_type, lec_units, lab_units, pre_requisites, department, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      id,
      data.subject_code.trim(),
      data.subject_name.trim(),
      data.description?.trim() || null,
      data.course_program.trim(),
      data.year_level.trim(),
      data.semester_type,
      data.lec_units ?? 0,
      data.lab_units ?? 0,
      data.pre_requisites?.trim() || null,
      data.department
    )

    logAudit({
      entity_type: 'subject_bank',
      entity_id: id,
      department: data.department as Department,
      action: 'CREATE',
      after_snapshot: { ...data, id }
    })
  })

  create()
  return getSubject(id)
}

export function updateSubject(data: {
  id: string
  subject_code?: string
  subject_name?: string
  description?: string | null
  course_program?: string
  year_level?: string
  semester_type?: string
  lec_units?: number
  lab_units?: number
  pre_requisites?: string | null
  department?: string
}): SubjectBankEntry {
  const db = getDatabase()
  const existing = getSubject(data.id)

  const updated = {
    subject_code: data.subject_code?.trim() ?? existing.subject_code,
    subject_name: data.subject_name?.trim() ?? existing.subject_name,
    description: data.description !== undefined ? (data.description?.trim() || null) : existing.description,
    course_program: data.course_program?.trim() ?? existing.course_program,
    year_level: data.year_level?.trim() ?? existing.year_level,
    semester_type: data.semester_type ?? existing.semester_type,
    lec_units: data.lec_units ?? existing.lec_units,
    lab_units: data.lab_units ?? existing.lab_units,
    pre_requisites: data.pre_requisites !== undefined ? (data.pre_requisites?.trim() || null) : existing.pre_requisites,
    department: data.department ?? existing.department
  }

  // Check uniqueness if key fields changed
  if (updated.subject_code !== existing.subject_code || updated.course_program !== existing.course_program ||
      updated.year_level !== existing.year_level || updated.semester_type !== existing.semester_type) {
    const dup = db.prepare(
      'SELECT id FROM subject_bank WHERE subject_code = ? AND course_program = ? AND year_level = ? AND semester_type = ? AND department = ? AND id != ? AND is_active = 1'
    ).get(updated.subject_code, updated.course_program, updated.year_level, updated.semester_type, updated.department, data.id)
    if (dup) {
      throwError(ERROR_CODES.VALIDATION_ERROR, `Subject "${updated.subject_code}" already exists for ${updated.course_program} ${updated.year_level} ${updated.semester_type}.`)
    }
  }

  const update = db.transaction(() => {
    db.prepare(
      `UPDATE subject_bank SET subject_code = ?, subject_name = ?, description = ?, course_program = ?, year_level = ?, semester_type = ?, lec_units = ?, lab_units = ?, pre_requisites = ?, department = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      updated.subject_code, updated.subject_name, updated.description,
      updated.course_program, updated.year_level, updated.semester_type,
      updated.lec_units, updated.lab_units, updated.pre_requisites,
      updated.department, data.id
    )

    logAudit({
      entity_type: 'subject_bank',
      entity_id: data.id,
      department: updated.department as Department,
      action: 'UPDATE',
      before_snapshot: existing,
      after_snapshot: { ...existing, ...updated }
    })
  })

  update()
  return getSubject(data.id)
}

export function getSubjectDeleteImpact(id: string): { sectionCount: number } {
  const db = getDatabase()
  const existing = getSubject(id)

  const sectionCount = (db.prepare(
    'SELECT COUNT(*) as cnt FROM sections WHERE subject = ? AND course_program = ? AND department = ? AND is_active = 1 AND archived_at IS NULL'
  ).get(existing.subject_name, existing.course_program, existing.department) as { cnt: number }).cnt

  return { sectionCount }
}

export function deleteSubject(id: string): { sectionCount: number } {
  const db = getDatabase()
  const existing = getSubject(id)

  let sectionCount = 0

  const del = db.transaction(() => {
    // Cascade soft-delete sections referencing this subject
    const secResult = db.prepare(
      "UPDATE sections SET archived_at = datetime('now'), archived_by = 'admin', updated_at = datetime('now') WHERE subject = ? AND course_program = ? AND department = ? AND is_active = 1 AND archived_at IS NULL"
    ).run(existing.subject_name, existing.course_program, existing.department)
    sectionCount = secResult.changes

    // Soft-delete the subject itself
    db.prepare("UPDATE subject_bank SET archived_at = datetime('now'), archived_by = 'admin', updated_at = datetime('now') WHERE id = ?").run(id)

    logAudit({
      entity_type: 'subject_bank',
      entity_id: id,
      department: existing.department,
      action: 'DELETE',
      before_snapshot: existing,
      after_snapshot: { cascaded: { sectionCount } }
    })
  })

  del()
  return { sectionCount }
}
