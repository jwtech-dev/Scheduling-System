// ============================================================
// Personnel Service — TASK-11
// ============================================================

import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { randomUUID } from 'crypto'
import type { Personnel, Department, PersonnelType, PersonnelStatus } from '../../shared/types'
import { ERROR_CODES } from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

interface PersonnelFilters {
  department?: Department
  status?: PersonnelStatus
  personnel_type?: PersonnelType
  is_shared?: boolean
  search?: string
}

export function listPersonnel(filters: PersonnelFilters = {}): Personnel[] {
  const db = getDatabase()
  const conditions: string[] = ['is_active = 1']
  const params: unknown[] = []

  if (filters.department) {
    if (filters.is_shared) {
      conditions.push('(department = ? OR is_shared = 1)')
    } else {
      conditions.push('department = ?')
    }
    params.push(filters.department)
  }
  if (filters.status) {
    conditions.push('status = ?')
    params.push(filters.status)
  }
  if (filters.personnel_type) {
    conditions.push('personnel_type = ?')
    params.push(filters.personnel_type)
  }
  if (filters.search) {
    conditions.push('(first_name LIKE ? OR last_name LIKE ? OR employee_id LIKE ? OR email LIKE ?)')
    const term = `%${filters.search}%`
    params.push(term, term, term, term)
  }

  return db
    .prepare(`SELECT * FROM personnel WHERE ${conditions.join(' AND ')} ORDER BY last_name, first_name`)
    .all(...params) as Personnel[]
}

export function getPersonnel(id: string): Personnel {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM personnel WHERE id = ? AND is_active = 1').get(id) as Personnel | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Personnel not found: ${id}`)
  return row
}

export function createPersonnel(data: {
  employee_id: string
  first_name: string
  last_name: string
  email: string
  department: Department
  is_shared?: boolean
  personnel_type?: PersonnelType
  specializations?: string[]
  max_weekly_hours?: number
}): Personnel {
  const db = getDatabase()

  // Validate uniqueness
  const dupEid = db.prepare('SELECT id FROM personnel WHERE employee_id = ? AND is_active = 1').get(data.employee_id)
  if (dupEid) throwError(ERROR_CODES.DUPLICATE_EMPLOYEE_ID, `Employee ID "${data.employee_id}" is already in use.`)

  const dupEmail = db.prepare('SELECT id FROM personnel WHERE email = ? AND is_active = 1').get(data.email)
  if (dupEmail) throwError(ERROR_CODES.DUPLICATE_EMAIL, `Email "${data.email}" is already in use.`)

  const id = randomUUID()
  const specializations = JSON.stringify(data.specializations ?? [])
  const maxHours = data.max_weekly_hours ?? 40

  if (maxHours < 1 || maxHours > 80) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Max weekly hours must be between 1 and 80.')
  }

  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO personnel (id, employee_id, first_name, last_name, email, department,
       is_shared, personnel_type, specializations, max_weekly_hours, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      id, data.employee_id, data.first_name, data.last_name, data.email,
      data.department, data.is_shared ? 1 : 0, data.personnel_type ?? 'FACULTY',
      specializations, maxHours
    )

    logAudit({
      entity_type: 'personnel',
      entity_id: id,
      department: data.department,
      action: 'CREATE',
      after_snapshot: { ...data, id }
    })
  })

  create()
  return getPersonnel(id)
}

export function updatePersonnel(data: {
  id: string
  employee_id?: string
  first_name?: string
  last_name?: string
  email?: string
  department?: Department
  is_shared?: boolean
  personnel_type?: PersonnelType
  specializations?: string[]
  max_weekly_hours?: number
  status?: PersonnelStatus
}): Personnel {
  const db = getDatabase()
  const existing = getPersonnel(data.id)

  if (data.employee_id && data.employee_id !== existing.employee_id) {
    const dup = db.prepare('SELECT id FROM personnel WHERE employee_id = ? AND id != ? AND is_active = 1').get(data.employee_id, data.id)
    if (dup) throwError(ERROR_CODES.DUPLICATE_EMPLOYEE_ID, `Employee ID "${data.employee_id}" is already in use.`)
  }

  if (data.email && data.email !== existing.email) {
    const dup = db.prepare('SELECT id FROM personnel WHERE email = ? AND id != ? AND is_active = 1').get(data.email, data.id)
    if (dup) throwError(ERROR_CODES.DUPLICATE_EMAIL, `Email "${data.email}" is already in use.`)
  }

  const updated = {
    employee_id: data.employee_id ?? existing.employee_id,
    first_name: data.first_name ?? existing.first_name,
    last_name: data.last_name ?? existing.last_name,
    email: data.email ?? existing.email,
    department: data.department ?? existing.department,
    is_shared: data.is_shared !== undefined ? (data.is_shared ? 1 : 0) : existing.is_shared,
    personnel_type: data.personnel_type ?? existing.personnel_type,
    specializations: data.specializations ? JSON.stringify(data.specializations) : existing.specializations,
    max_weekly_hours: data.max_weekly_hours ?? existing.max_weekly_hours,
    status: data.status ?? existing.status
  }

  const update = db.transaction(() => {
    db.prepare(
      `UPDATE personnel SET employee_id = ?, first_name = ?, last_name = ?, email = ?,
       department = ?, is_shared = ?, personnel_type = ?, specializations = ?,
       max_weekly_hours = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      updated.employee_id, updated.first_name, updated.last_name, updated.email,
      updated.department, updated.is_shared, updated.personnel_type, updated.specializations,
      updated.max_weekly_hours, updated.status, data.id
    )

    logAudit({
      entity_type: 'personnel',
      entity_id: data.id,
      department: updated.department,
      action: 'UPDATE',
      before_snapshot: existing,
      after_snapshot: { ...existing, ...updated }
    })
  })

  update()
  return getPersonnel(data.id)
}

export function deletePersonnel(id: string): void {
  const db = getDatabase()
  const existing = getPersonnel(id)

  const activeEntries = db
    .prepare("SELECT COUNT(*) as count FROM schedule_entries WHERE personnel_id = ? AND status = 'PUBLISHED' AND is_active = 1")
    .get(id) as { count: number }

  if (activeEntries.count > 0) {
    throwError(ERROR_CODES.DELETE_PROTECTED, `Cannot delete — ${activeEntries.count} published schedule entries reference this personnel.`)
  }

  const del = db.transaction(() => {
    db.prepare("UPDATE personnel SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(id)

    logAudit({
      entity_type: 'personnel',
      entity_id: id,
      department: existing.department,
      action: 'DELETE',
      before_snapshot: existing
    })
  })

  del()
}
