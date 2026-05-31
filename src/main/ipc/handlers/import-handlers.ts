// Import Handlers — TASK-19 (CSV Import)
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { dialog } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import { getDatabase } from '../../database/connection'
import { logAudit } from '../../services/audit-service'
import { randomUUID } from 'crypto'
import { ERROR_CODES, DEFAULTS } from '../../../shared/constants'
import type { ImportTarget } from '../../../shared/types'

const TEMPLATES: Record<string, string> = {
  PERSONNEL: 'employee_id,first_name,last_name,email,department,personnel_type,specializations,max_weekly_hours\n',
  SECTIONS: 'section_code,section_name,department,strand_track,subject,course_program,year_level,student_count\n',
  ROOMS: 'room_code,room_name,building,floor,capacity,room_type,department_availability\n',
  CALENDAR_EVENTS: 'title,event_type,is_blocking,is_all_day,start_datetime,end_datetime,description\n'
}

function throwError(code: string, message: string): never {
  const err = new Error(message); (err as Error & { code: string }).code = code; throw err
}

export function registerImportHandlers(): void {
  // Download CSV template
  registerHandler(IPC_CHANNELS.IMPORTS_DOWNLOAD_TEMPLATE, async (args) => {
    const { target } = args as { target: ImportTarget }
    const template = TEMPLATES[target]
    if (!template) throwError(ERROR_CODES.VALIDATION_ERROR, `Unknown import target: ${target}`)

    const result = await dialog.showSaveDialog({
      title: 'Save Import Template',
      defaultPath: `${target.toLowerCase()}_template.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })
    if (result.canceled || !result.filePath) return { success: false }

    writeFileSync(result.filePath, template, 'utf-8')
    return { success: true, path: result.filePath }
  })

  // Upload and parse CSV
  registerHandler(IPC_CHANNELS.IMPORTS_UPLOAD, async (args) => {
    const { target, department, academic_year_id, semester_id } = args as {
      target: ImportTarget; department?: string; academic_year_id?: string; semester_id?: string
    }

    const result = await dialog.showOpenDialog({
      title: `Import ${target}`,
      filters: [{ name: 'CSV', extensions: ['csv'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return { success: false }

    const filePath = result.filePaths[0]
    const content = readFileSync(filePath, 'utf-8')

    if (content.length > DEFAULTS.IMPORT_MAX_FILE_SIZE) {
      throwError(ERROR_CODES.FILE_TOO_LARGE, `File exceeds ${DEFAULTS.IMPORT_MAX_FILE_SIZE / 1024 / 1024}MB limit.`)
    }

    const lines = content.trim().split('\n')
    if (lines.length < 2) throwError(ERROR_CODES.VALIDATION_ERROR, 'File has no data rows.')
    if (lines.length - 1 > DEFAULTS.IMPORT_MAX_ROWS) throwError(ERROR_CODES.ROW_LIMIT_EXCEEDED, `File has ${lines.length - 1} rows (max ${DEFAULTS.IMPORT_MAX_ROWS}).`)

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const expectedHeaders = TEMPLATES[target].trim().split(',').map((h) => h.trim().toLowerCase())

    // Validate headers
    for (const eh of expectedHeaders) {
      if (!headers.includes(eh)) throwError(ERROR_CODES.INVALID_HEADERS, `Missing required header: ${eh}`)
    }

    // Parse rows into objects
    const rows = lines.slice(1).map((line, i) => {
      const values = line.split(',').map((v) => v.trim())
      const row: Record<string, string> = {}
      headers.forEach((h, j) => { row[h] = values[j] ?? '' })
      return { row_number: i + 2, ...row }
    })

    return {
      success: true,
      target,
      file_name: filePath.split(/[/\\]/).pop() ?? '',
      total_rows: rows.length,
      preview: rows.slice(0, 10),
      headers,
      department, academic_year_id, semester_id,
      parsed: rows
    }
  })

  // Commit import
  registerHandler(IPC_CHANNELS.IMPORTS_COMMIT, (args) => {
    const { target, parsed, file_name, department, academic_year_id, semester_id } = args as {
      target: ImportTarget; parsed: Record<string, string>[]
      file_name: string; department?: string; academic_year_id?: string; semester_id?: string
    }

    const db = getDatabase()
    let created = 0, updated = 0, skipped = 0
    const errors: string[] = []

    const commit = db.transaction(() => {
      for (const row of parsed) {
        try {
          if (target === 'ROOMS') {
            const existing = db.prepare('SELECT id FROM rooms WHERE room_code = ? AND is_active = 1').get(row.room_code)
            if (existing) {
              db.prepare("UPDATE rooms SET room_name = ?, building = ?, floor = ?, capacity = ?, room_type = ?, department_availability = ?, updated_at = datetime('now') WHERE room_code = ? AND is_active = 1").run(
                row.room_name, row.building || null, row.floor || null, parseInt(row.capacity) || 30, row.room_type || null, row.department_availability || 'SHARED', row.room_code
              )
              updated++
            } else {
              db.prepare("INSERT INTO rooms (id, room_code, room_name, building, floor, capacity, room_type, department_availability, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))").run(
                randomUUID(), row.room_code, row.room_name, row.building || null, row.floor || null, parseInt(row.capacity) || 30, row.room_type || null, row.department_availability || 'SHARED'
              )
              created++
            }
          } else if (target === 'PERSONNEL') {
            const existing = db.prepare('SELECT id FROM personnel WHERE employee_id = ? AND is_active = 1').get(row.employee_id)
            if (existing) { updated++ } else {
              db.prepare("INSERT INTO personnel (id, employee_id, first_name, last_name, email, department, personnel_type, specializations, max_weekly_hours, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))").run(
                randomUUID(), row.employee_id, row.first_name, row.last_name, row.email, row.department || department || 'SHS', row.personnel_type || 'FACULTY', row.specializations || '[]', parseInt(row.max_weekly_hours) || 40
              )
              created++
            }
          } else if (target === 'SECTIONS') {
            if (!academic_year_id || !semester_id) { skipped++; continue }
            db.prepare("INSERT INTO sections (id, department, section_code, section_name, strand_track, subject, course_program, year_level, student_count, academic_year_id, semester_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))").run(
              randomUUID(), row.department || department || 'SHS', row.section_code, row.section_name || null, row.strand_track || null, row.subject || null, row.course_program || null, row.year_level || null, parseInt(row.student_count) || 0, academic_year_id, semester_id
            )
            created++
          } else if (target === 'CALENDAR_EVENTS') {
            db.prepare("INSERT INTO calendar_events (id, title, event_type, is_blocking, is_all_day, start_datetime, end_datetime, description, academic_year_id, semester_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))").run(
              randomUUID(), row.title, row.event_type || 'CUSTOM', row.is_blocking === 'true' || row.is_blocking === '1' ? 1 : 0, row.is_all_day === 'true' || row.is_all_day === '1' ? 1 : 0, row.start_datetime, row.end_datetime, row.description || null, academic_year_id ?? null, semester_id ?? null
            )
            created++
          }
        } catch (err) {
          errors.push(`Row ${row.row_number}: ${(err as Error).message}`)
          skipped++
        }
      }

      // Log the import job
      db.prepare("INSERT INTO import_jobs (id, target, department, file_name, total_rows, rows_created, rows_updated, rows_skipped, error_details, academic_year_id, semester_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))").run(
        randomUUID(), target, department ?? null, file_name, parsed.length, created, updated, skipped, errors.length > 0 ? JSON.stringify(errors) : null, academic_year_id ?? null, semester_id ?? null
      )
    })

    commit()
    return { success: true, created, updated, skipped, errors }
  })

  // List import jobs
  registerHandler(IPC_CHANNELS.IMPORTS_LIST_JOBS, () => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM import_jobs ORDER BY created_at DESC LIMIT 50').all()
  })

  // Get import job
  registerHandler(IPC_CHANNELS.IMPORTS_GET_JOB, (args) => {
    const { id } = args as { id: string }
    const db = getDatabase()
    return db.prepare('SELECT * FROM import_jobs WHERE id = ?').get(id)
  })
}
