// Template Service — TASK-18
import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { randomUUID } from 'crypto'
import type { ScheduleTemplate, ScheduleTemplateEntry, TemplateApplication, TemplateDeptScope, TemplateScope, Department, RecurrencePattern } from '../../shared/types'
import { ERROR_CODES } from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message); (err as Error & { code: string }).code = code; throw err
}

export function listTemplates(filters: { department_scope?: TemplateDeptScope } = {}): ScheduleTemplate[] {
  const db = getDatabase()
  const conditions: string[] = ['is_active = 1']
  const params: unknown[] = []
  if (filters.department_scope) { conditions.push('department_scope = ?'); params.push(filters.department_scope) }
  return db.prepare(`SELECT * FROM schedule_templates WHERE ${conditions.join(' AND ')} ORDER BY name`).all(...params) as ScheduleTemplate[]
}

export function getTemplate(id: string): ScheduleTemplate {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM schedule_templates WHERE id = ? AND is_active = 1').get(id) as ScheduleTemplate | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Template not found: ${id}`)
  return row
}

export function createTemplate(data: {
  name: string; description?: string; department_scope: TemplateDeptScope
  scope: TemplateScope; source_department: Department
  source_academic_year_label: string; source_semester_name: string
}): ScheduleTemplate {
  const db = getDatabase()
  const existing = db.prepare('SELECT id FROM schedule_templates WHERE name = ? AND is_active = 1').get(data.name)
  if (existing) throwError(ERROR_CODES.DUPLICATE_TEMPLATE_NAME, `Template "${data.name}" already exists.`)

  const id = randomUUID()
  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO schedule_templates (id, name, description, department_scope, scope, source_department, source_academic_year_label, source_semester_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(id, data.name, data.description ?? null, data.department_scope, data.scope, data.source_department, data.source_academic_year_label, data.source_semester_name)

    // Copy schedule entries from source as template entries
    const sourceEntries = db.prepare(
      `SELECT se.* FROM schedule_entries se JOIN semesters s ON se.semester_id = s.id JOIN academic_years ay ON se.academic_year_id = ay.id WHERE se.department = ? AND ay.label = ? AND se.is_active = 1 ${data.scope === 'CLASS_ONLY' ? "AND se.activity_type = 'CLASS'" : data.scope === 'EXAM_ONLY' ? "AND se.activity_type = 'EXAM'" : ''}`
    ).all(data.source_department, data.source_academic_year_label)

    for (const entry of sourceEntries as Record<string, unknown>[]) {
      db.prepare(
        `INSERT INTO schedule_template_entries (id, template_id, activity_type, room_code, employee_id, section_codes, subject, exam_title, exam_type, modality, start_time, end_time, recurrence_pattern, day_of_week, day_of_month, week_of_month, custom_days, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).run(
        randomUUID(), id, entry.activity_type,
        entry.room_id ? (db.prepare('SELECT room_code FROM rooms WHERE id = ?').get(entry.room_id) as { room_code: string } | undefined)?.room_code ?? null : null,
        entry.personnel_id ? (db.prepare('SELECT employee_id FROM personnel WHERE id = ?').get(entry.personnel_id) as { employee_id: string } | undefined)?.employee_id ?? null : null,
        entry.section_ids, entry.subject, entry.exam_title, entry.exam_type,
        entry.modality, entry.start_time, entry.end_time, entry.recurrence_pattern,
        entry.day_of_week, entry.day_of_month, entry.week_of_month, entry.custom_days, entry.notes
      )
    }

    logAudit({ entity_type: 'schedule_template', entity_id: id, department: data.source_department, action: 'CREATE', after_snapshot: data })
  })
  create()
  return getTemplate(id)
}

export function updateTemplate(data: { id: string; name?: string; description?: string | null }): ScheduleTemplate {
  const db = getDatabase()
  const existing = getTemplate(data.id)
  if (data.name && data.name !== existing.name) {
    const dup = db.prepare('SELECT id FROM schedule_templates WHERE name = ? AND id != ? AND is_active = 1').get(data.name, data.id)
    if (dup) throwError(ERROR_CODES.DUPLICATE_TEMPLATE_NAME, `Template "${data.name}" already exists.`)
  }
  db.prepare("UPDATE schedule_templates SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?").run(data.name ?? existing.name, data.description !== undefined ? data.description : existing.description, data.id)
  return getTemplate(data.id)
}

export function deleteTemplate(id: string): void {
  const db = getDatabase()
  const existing = getTemplate(id)
  const del = db.transaction(() => {
    db.prepare("UPDATE schedule_templates SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(id)
    db.prepare("UPDATE schedule_template_entries SET is_active = 0, updated_at = datetime('now') WHERE template_id = ?").run(id)
    logAudit({ entity_type: 'schedule_template', entity_id: id, action: 'DELETE', before_snapshot: existing })
  })
  del()
}

export function getTemplateEntries(templateId: string): ScheduleTemplateEntry[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM schedule_template_entries WHERE template_id = ? AND is_active = 1 ORDER BY start_time').all(templateId) as ScheduleTemplateEntry[]
}

export function updateTemplateEntry(data: { id: string; room_code?: string | null; employee_id?: string | null; start_time?: string; end_time?: string; notes?: string | null }): ScheduleTemplateEntry {
  const db = getDatabase()
  const existing = db.prepare('SELECT * FROM schedule_template_entries WHERE id = ? AND is_active = 1').get(data.id) as ScheduleTemplateEntry | undefined
  if (!existing) throwError(ERROR_CODES.NOT_FOUND, 'Template entry not found.')
  db.prepare("UPDATE schedule_template_entries SET room_code = ?, employee_id = ?, start_time = ?, end_time = ?, notes = ?, updated_at = datetime('now') WHERE id = ?").run(
    data.room_code !== undefined ? data.room_code : existing.room_code,
    data.employee_id !== undefined ? data.employee_id : existing.employee_id,
    data.start_time ?? existing.start_time, data.end_time ?? existing.end_time,
    data.notes !== undefined ? data.notes : existing.notes, data.id
  )
  return db.prepare('SELECT * FROM schedule_template_entries WHERE id = ?').get(data.id) as ScheduleTemplateEntry
}

export function deleteTemplateEntry(id: string): void {
  const db = getDatabase()
  db.prepare("UPDATE schedule_template_entries SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(id)
}

export function applyTemplate(data: { template_id: string; target_academic_year_id: string; target_semester_id: string }): TemplateApplication {
  const db = getDatabase()
  const template = getTemplate(data.template_id)
  const entries = getTemplateEntries(data.template_id)

  const appId = randomUUID()
  let entryCount = 0
  let conflictCount = 0

  const apply = db.transaction(() => {
    for (const te of entries) {
      // Resolve codes to IDs
      const roomId = te.room_code ? (db.prepare('SELECT id FROM rooms WHERE room_code = ? AND is_active = 1').get(te.room_code) as { id: string } | undefined)?.id ?? null : null
      const personnelId = te.employee_id ? (db.prepare('SELECT id FROM personnel WHERE employee_id = ? AND is_active = 1').get(te.employee_id) as { id: string } | undefined)?.id ?? null : null

      const entryId = randomUUID()
      db.prepare(
        `INSERT INTO schedule_entries (id, department, activity_type, room_id, personnel_id, section_ids, subject, exam_title, exam_type, modality, start_time, end_time, recurrence_pattern, recurrence_start_date, recurrence_end_date, day_of_week, day_of_month, week_of_month, custom_days, academic_year_id, semester_id, source_template_id, status, conflict_flags, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', '[]', ?, datetime('now'), datetime('now'))`
      ).run(
        entryId, template.source_department, te.activity_type, roomId, personnelId,
        te.section_codes ?? '[]', te.subject, te.exam_title, te.exam_type,
        te.modality, te.start_time, te.end_time, te.recurrence_pattern,
        (db.prepare('SELECT start_date FROM semesters WHERE id = ?').get(data.target_semester_id) as { start_date: string })?.start_date ?? new Date().toISOString().split('T')[0],
        te.day_of_week, te.day_of_month, te.week_of_month, te.custom_days,
        data.target_academic_year_id, data.target_semester_id, data.template_id, te.notes
      )
      entryCount++
    }

    db.prepare(
      `INSERT INTO schedule_template_applications (id, template_id, target_academic_year_id, target_semester_id, entry_count, conflict_count) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(appId, data.template_id, data.target_academic_year_id, data.target_semester_id, entryCount, conflictCount)

    logAudit({ entity_type: 'template_application', entity_id: appId, action: 'CREATE', after_snapshot: { ...data, entry_count: entryCount } })
  })

  apply()
  return db.prepare('SELECT * FROM schedule_template_applications WHERE id = ?').get(appId) as TemplateApplication
}

export function getTemplateApplications(templateId: string): TemplateApplication[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM schedule_template_applications WHERE template_id = ? ORDER BY applied_at DESC').all(templateId) as TemplateApplication[]
}
