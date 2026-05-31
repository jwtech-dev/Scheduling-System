// Export Handlers — TASK-21
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { dialog } from 'electron'
import { writeFileSync } from 'fs'
import { getDatabase } from '../../database/connection'
import type { Department } from '../../../shared/types'

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const escape = (v: unknown): string => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','))
  }
  return lines.join('\n')
}

async function saveCSV(data: string, defaultName: string): Promise<{ success: boolean; path?: string }> {
  const result = await dialog.showSaveDialog({
    title: 'Export CSV',
    defaultPath: defaultName,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  })
  if (result.canceled || !result.filePath) return { success: false }
  writeFileSync(result.filePath, '\ufeff' + data, 'utf-8') // BOM for Excel
  return { success: true, path: result.filePath }
}

export function registerExportHandlers(): void {
  registerHandler(IPC_CHANNELS.EXPORTS_SCHEDULE, async (args) => {
    const { department, semester_id, status } = args as { department?: Department; semester_id?: string; status?: string }
    const db = getDatabase()
    const conditions: string[] = ['se.is_active = 1']
    const params: unknown[] = []
    if (department) { conditions.push('se.department = ?'); params.push(department) }
    if (semester_id) { conditions.push('se.semester_id = ?'); params.push(semester_id) }
    if (status) { conditions.push('se.status = ?'); params.push(status) }

    const rows = db.prepare(
      `SELECT se.*, r.room_code, r.room_name, p.employee_id, p.first_name || ' ' || p.last_name as personnel_name
       FROM schedule_entries se
       LEFT JOIN rooms r ON se.room_id = r.id
       LEFT JOIN personnel p ON se.personnel_id = p.id
       WHERE ${conditions.join(' AND ')} ORDER BY se.start_time`
    ).all(...params) as Record<string, unknown>[]

    const csv = toCsv(['department', 'activity_type', 'subject', 'room_code', 'room_name', 'personnel_name', 'employee_id', 'modality', 'start_time', 'end_time', 'recurrence_pattern', 'recurrence_start_date', 'recurrence_end_date', 'status', 'conflict_flags', 'notes'], rows)
    return saveCSV(csv, `schedule_export_${new Date().toISOString().split('T')[0]}.csv`)
  })

  registerHandler(IPC_CHANNELS.EXPORTS_PERSONNEL_LOAD, async (args) => {
    const { department } = args as { department?: Department }
    const db = getDatabase()
    const conditions = department ? 'AND p.department = ?' : ''
    const params = department ? [department] : []
    const rows = db.prepare(
      `SELECT p.employee_id, p.first_name, p.last_name, p.department, p.max_weekly_hours,
       COUNT(se.id) as entry_count
       FROM personnel p
       LEFT JOIN schedule_entries se ON se.personnel_id = p.id AND se.is_active = 1
       WHERE p.is_active = 1 ${conditions}
       GROUP BY p.id ORDER BY p.last_name`
    ).all(...params) as Record<string, unknown>[]
    const csv = toCsv(['employee_id', 'first_name', 'last_name', 'department', 'max_weekly_hours', 'entry_count'], rows)
    return saveCSV(csv, `personnel_load_${new Date().toISOString().split('T')[0]}.csv`)
  })

  registerHandler(IPC_CHANNELS.EXPORTS_ROOM_UTILIZATION, async (args) => {
    const db = getDatabase()
    const rows = db.prepare(
      `SELECT r.room_code, r.room_name, r.building, r.capacity, r.department_availability, r.status,
       COUNT(se.id) as entry_count
       FROM rooms r LEFT JOIN schedule_entries se ON se.room_id = r.id AND se.is_active = 1
       WHERE r.is_active = 1 GROUP BY r.id ORDER BY r.room_code`
    ).all() as Record<string, unknown>[]
    const csv = toCsv(['room_code', 'room_name', 'building', 'capacity', 'department_availability', 'status', 'entry_count'], rows)
    return saveCSV(csv, `room_utilization_${new Date().toISOString().split('T')[0]}.csv`)
  })

  registerHandler(IPC_CHANNELS.EXPORTS_EXAM_SCHEDULE, async (args) => {
    const { department, semester_id } = args as { department?: Department; semester_id?: string }
    const db = getDatabase()
    const conditions: string[] = ["se.activity_type = 'EXAM'", 'se.is_active = 1']
    const params: unknown[] = []
    if (department) { conditions.push('se.department = ?'); params.push(department) }
    if (semester_id) { conditions.push('se.semester_id = ?'); params.push(semester_id) }
    const rows = db.prepare(
      `SELECT se.exam_title, se.exam_type, se.department, r.room_code, r.room_name,
       p.first_name || ' ' || p.last_name as proctor, se.start_time, se.end_time,
       se.recurrence_start_date as exam_date, se.section_ids, se.status
       FROM schedule_entries se LEFT JOIN rooms r ON se.room_id = r.id LEFT JOIN personnel p ON se.personnel_id = p.id
       WHERE ${conditions.join(' AND ')} ORDER BY se.recurrence_start_date, se.start_time`
    ).all(...params) as Record<string, unknown>[]
    const csv = toCsv(['exam_title', 'exam_type', 'department', 'room_code', 'room_name', 'proctor', 'start_time', 'end_time', 'exam_date', 'status'], rows)
    return saveCSV(csv, `exam_schedule_${new Date().toISOString().split('T')[0]}.csv`)
  })

  // Calendar and section exports follow same pattern
  registerHandler(IPC_CHANNELS.EXPORTS_CALENDAR, async () => {
    const db = getDatabase()
    const rows = db.prepare('SELECT * FROM calendar_events WHERE is_active = 1 ORDER BY start_datetime').all() as Record<string, unknown>[]
    const csv = toCsv(['title', 'event_type', 'is_blocking', 'is_all_day', 'start_datetime', 'end_datetime', 'description'], rows)
    return saveCSV(csv, `calendar_${new Date().toISOString().split('T')[0]}.csv`)
  })

  registerHandler(IPC_CHANNELS.EXPORTS_SECTION_SCHEDULE, async (args) => {
    const { department, semester_id } = args as { department?: Department; semester_id?: string }
    const db = getDatabase()
    const conditions: string[] = ['s.is_active = 1']
    const params: unknown[] = []
    if (department) { conditions.push('s.department = ?'); params.push(department) }
    if (semester_id) { conditions.push('s.semester_id = ?'); params.push(semester_id) }
    const rows = db.prepare(
      `SELECT s.section_code, s.section_name, s.department, s.student_count,
       COUNT(se.id) as entry_count
       FROM sections s LEFT JOIN schedule_entries se ON se.section_ids LIKE '%' || s.id || '%' AND se.is_active = 1
       WHERE ${conditions.join(' AND ')} GROUP BY s.id ORDER BY s.section_code`
    ).all(...params) as Record<string, unknown>[]
    const csv = toCsv(['section_code', 'section_name', 'department', 'student_count', 'entry_count'], rows)
    return saveCSV(csv, `section_schedule_${new Date().toISOString().split('T')[0]}.csv`)
  })
}
