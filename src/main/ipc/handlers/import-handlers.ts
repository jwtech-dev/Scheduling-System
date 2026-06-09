// Import Handlers — CSV / Excel / DOCX / PDF Import
import Papa from 'papaparse'
import ExcelJS from 'exceljs'
import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { dialog } from 'electron'
import { readFileSync, statSync, writeFileSync } from 'fs'
import { getDatabase } from '../../database/connection'
import { logAudit } from '../../services/audit-service'
import { randomUUID } from 'crypto'
import { ERROR_CODES, DEFAULTS } from '../../../shared/constants'
import type { ImportTarget } from '../../../shared/types'

const TEMPLATES: Record<string, string> = {
  PERSONNEL: 'employee_id,first_name,last_name,email,department,personnel_type,specializations,max_weekly_hours\n',
  SECTIONS: 'section_code,section_name,department,strand_track,subject,course_program,year_level,student_count\n',
  ROOMS: 'room_code,room_name,building,floor,capacity,room_type,department_availability\n',
  CALENDAR_EVENTS: 'title,event_type,is_blocking,is_all_day,start_datetime,end_datetime,description\n',
  SUBJECT_BANK: 'subject_code,subject_name,course_program,year_level,semester_type,lec_units,lab_units,pre_requisites,description\n'
}

function throwError(code: string, message: string): never {
  const err = new Error(message); (err as Error & { code: string }).code = code; throw err
}

/** Strip UTF-8 BOM (U+FEFF) from the start of file content. */
function stripBom(content: string): string {
  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content
}

/** Parse CSV content using papaparse, returning header array and row objects. */
function parseCsv(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase()
  })

  if (result.errors.length > 0) {
    const first = result.errors[0]
    throwError(ERROR_CODES.VALIDATION_ERROR, `CSV parse error at row ${(first.row ?? 0) + 2}: ${first.message}`)
  }

  const headers = result.meta.fields ?? []
  // Trim all cell values
  const rows = result.data.map((row) => {
    const trimmed: Record<string, string> = {}
    for (const key of Object.keys(row)) {
      trimmed[key] = (row[key] ?? '').trim()
    }
    return trimmed
  })

  return { headers, rows }
}

/** Parse Excel file (xlsx/xls), returning header array and row objects from the first sheet. */
async function parseExcel(filePath: string): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(filePath)
  const ws = wb.worksheets[0]
  if (!ws || ws.rowCount < 2) throwError(ERROR_CODES.VALIDATION_ERROR, 'Excel file has no data rows.')

  // First row = headers
  const headerRow = ws.getRow(1)
  const headers: string[] = []
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? '').trim().toLowerCase()
  })
  // Remove trailing empty headers
  while (headers.length > 0 && !headers[headers.length - 1]) headers.pop()

  // Data rows
  const rows: Record<string, string>[] = []
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    // Skip fully empty rows
    let hasData = false
    const obj: Record<string, string> = {}
    for (let c = 0; c < headers.length; c++) {
      const cell = row.getCell(c + 1)
      const val = cell.value
      // Handle rich text, formulas, dates
      let str = ''
      if (val === null || val === undefined) {
        str = ''
      } else if (typeof val === 'object' && 'richText' in (val as object)) {
        str = ((val as { richText: Array<{ text: string }> }).richText || []).map(rt => rt.text).join('')
      } else if (typeof val === 'object' && 'result' in (val as object)) {
        str = String((val as { result: unknown }).result ?? '')
      } else if (val instanceof Date) {
        str = val.toISOString().split('T')[0]
      } else {
        str = String(val)
      }
      obj[headers[c]] = str.trim()
      if (str.trim()) hasData = true
    }
    if (hasData) rows.push(obj)
  }

  return { headers, rows }
}

/** Parse DOCX file — extracts the first table found in the document. */
async function parseDocx(filePath: string): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const buffer = readFileSync(filePath)
  const result = await mammoth.convertToHtml({ buffer })
  const html = result.value

  // Extract first <table> from the HTML
  const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i)
  if (!tableMatch) {
    // Fallback: try line-based parsing from raw text
    const textResult = await mammoth.extractRawText({ buffer })
    return parseTextLines(textResult.value)
  }

  const tableHtml = tableMatch[1]
  // Extract all rows
  const rowMatches = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
  if (rowMatches.length < 2) throwError(ERROR_CODES.VALIDATION_ERROR, 'DOCX table has no data rows.')

  const extractCells = (rowHtml: string): string[] => {
    const cells = [...rowHtml.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)]
    return cells.map(m => m[1].replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim())
  }

  const headers = extractCells(rowMatches[0][1]).map(h => h.toLowerCase())
  const rows: Record<string, string>[] = []
  for (let i = 1; i < rowMatches.length; i++) {
    const cells = extractCells(rowMatches[i][1])
    const obj: Record<string, string> = {}
    let hasData = false
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = (cells[c] ?? '').trim()
      if (obj[headers[c]]) hasData = true
    }
    if (hasData) rows.push(obj)
  }

  return { headers, rows }
}

/** Parse PDF file — extracts text and tries to parse as tabular data. */
async function parsePdf(filePath: string): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const buffer = readFileSync(filePath)
  const data = await pdfParse(buffer)
  return parseTextLines(data.text)
}

/** Shared helper: parse raw text lines as tab-delimited or comma-delimited data. */
function parseTextLines(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) throwError(ERROR_CODES.VALIDATION_ERROR, 'File has no data rows.')

  // Detect delimiter: tab first, then comma, then 2+ spaces
  const firstLine = lines[0]
  let delimiter: string | RegExp = '\t'
  if (firstLine.includes('\t')) {
    delimiter = '\t'
  } else if (firstLine.includes(',')) {
    delimiter = ','
  } else {
    delimiter = /\s{2,}/
  }

  const splitLine = (line: string): string[] => {
    if (typeof delimiter === 'string') return line.split(delimiter).map(s => s.trim())
    return line.split(delimiter).map(s => s.trim())
  }

  const headers = splitLine(lines[0]).map(h => h.toLowerCase())
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i])
    const obj: Record<string, string> = {}
    let hasData = false
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = (cells[c] ?? '').trim()
      if (obj[headers[c]]) hasData = true
    }
    if (hasData) rows.push(obj)
  }

  return { headers, rows }
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

   // Upload and parse file (CSV or Excel)
  registerHandler(IPC_CHANNELS.IMPORTS_UPLOAD, async (args) => {
    const { target, department, academic_year_id, semester_id } = args as {
      target: ImportTarget; department?: string; academic_year_id?: string; semester_id?: string
    }

    const result = await dialog.showOpenDialog({
      title: `Import ${target}`,
      filters: [
        { name: 'All Supported', extensions: ['csv', 'xlsx', 'xls', 'docx', 'pdf'] },
        { name: 'CSV', extensions: ['csv'] },
        { name: 'Excel', extensions: ['xlsx', 'xls'] },
        { name: 'Word', extensions: ['docx'] },
        { name: 'PDF', extensions: ['pdf'] }
      ],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return { success: false }

    const filePath = result.filePaths[0]

    // Validate file size before reading content
    const stat = statSync(filePath)
    if (stat.size > DEFAULTS.IMPORT_MAX_FILE_SIZE) {
      throwError(ERROR_CODES.FILE_TOO_LARGE, `File exceeds ${DEFAULTS.IMPORT_MAX_FILE_SIZE / 1024 / 1024}MB limit.`)
    }

    const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
    let headers: string[]
    let rows: Record<string, string>[]

    if (ext === 'xlsx' || ext === 'xls') {
      const parsed = await parseExcel(filePath)
      headers = parsed.headers
      rows = parsed.rows
    } else if (ext === 'docx') {
      const parsed = await parseDocx(filePath)
      headers = parsed.headers
      rows = parsed.rows
    } else if (ext === 'pdf') {
      const parsed = await parsePdf(filePath)
      headers = parsed.headers
      rows = parsed.rows
    } else {
      const rawContent = readFileSync(filePath, 'utf-8')
      const content = stripBom(rawContent)
      const parsed = parseCsv(content)
      headers = parsed.headers
      rows = parsed.rows
    }

    if (rows.length === 0) throwError(ERROR_CODES.VALIDATION_ERROR, 'File has no data rows.')
    if (rows.length > DEFAULTS.IMPORT_MAX_ROWS) throwError(ERROR_CODES.ROW_LIMIT_EXCEEDED, `File has ${rows.length} rows (max ${DEFAULTS.IMPORT_MAX_ROWS}).`)

    const expectedHeaders = TEMPLATES[target].trim().split(',').map((h) => h.trim().toLowerCase())

    // Validate headers
    for (const eh of expectedHeaders) {
      if (!headers.includes(eh)) throwError(ERROR_CODES.INVALID_HEADERS, `Missing required header: ${eh}`)
    }

    // Add row_number to each row for error reporting
    const numberedRows = rows.map((row, i) => ({ row_number: i + 2, ...row }))

    return {
      success: true,
      target,
      file_name: filePath.split(/[/\\]/).pop() ?? '',
      total_rows: numberedRows.length,
      preview: numberedRows.slice(0, 10),
      headers,
      department, academic_year_id, semester_id,
      parsed: numberedRows
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
    const jobId = randomUUID()

    const commit = db.transaction(() => {
      for (const row of parsed) {
        try {
          if (target === 'ROOMS') {
            const existing = db.prepare('SELECT id FROM rooms WHERE room_code = ? AND is_active = 1').get(row.room_code) as { id: string } | undefined
            if (existing) {
              db.prepare("UPDATE rooms SET room_name = ?, building = ?, floor = ?, capacity = ?, room_type = ?, department_availability = ?, updated_at = datetime('now') WHERE room_code = ? AND is_active = 1").run(
                row.room_name, row.building || null, row.floor || null, parseInt(row.capacity, 10) || 30, row.room_type || null, row.department_availability || 'SHARED', row.room_code
              )
              updated++
            } else {
              db.prepare("INSERT INTO rooms (id, room_code, room_name, building, floor, capacity, room_type, department_availability, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))").run(
                randomUUID(), row.room_code, row.room_name, row.building || null, row.floor || null, parseInt(row.capacity, 10) || 30, row.room_type || null, row.department_availability || 'SHARED'
              )
              created++
            }
          } else if (target === 'PERSONNEL') {
            const existing = db.prepare('SELECT id FROM personnel WHERE employee_id = ? AND is_active = 1').get(row.employee_id) as { id: string } | undefined
            if (existing) {
              db.prepare("UPDATE personnel SET first_name = ?, last_name = ?, email = ?, department = ?, personnel_type = ?, specializations = ?, max_weekly_hours = ?, updated_at = datetime('now') WHERE employee_id = ? AND is_active = 1").run(
                row.first_name, row.last_name, row.email, row.department || department || 'SHS', row.personnel_type || 'FACULTY', row.specializations || '[]', parseInt(row.max_weekly_hours, 10) || 40, row.employee_id
              )
              updated++
            } else {
              db.prepare("INSERT INTO personnel (id, employee_id, first_name, last_name, email, department, personnel_type, specializations, max_weekly_hours, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))").run(
                randomUUID(), row.employee_id, row.first_name, row.last_name, row.email, row.department || department || 'SHS', row.personnel_type || 'FACULTY', row.specializations || '[]', parseInt(row.max_weekly_hours, 10) || 40
              )
              created++
            }
          } else if (target === 'SECTIONS') {
            if (!academic_year_id || !semester_id) { skipped++; continue }
            const existing = db.prepare('SELECT id FROM sections WHERE section_code = ? AND academic_year_id = ? AND semester_id = ? AND is_active = 1').get(row.section_code, academic_year_id, semester_id) as { id: string } | undefined
            if (existing) {
              db.prepare("UPDATE sections SET section_name = ?, department = ?, strand_track = ?, subject = ?, course_program = ?, year_level = ?, student_count = ?, updated_at = datetime('now') WHERE id = ?").run(
                row.section_name || null, row.department || department || 'SHS', row.strand_track || null, row.subject || null, row.course_program || null, row.year_level || null, parseInt(row.student_count, 10) || 0, existing.id
              )
              updated++
            } else {
              db.prepare("INSERT INTO sections (id, department, section_code, section_name, strand_track, subject, course_program, year_level, student_count, academic_year_id, semester_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))").run(
                randomUUID(), row.department || department || 'SHS', row.section_code, row.section_name || null, row.strand_track || null, row.subject || null, row.course_program || null, row.year_level || null, parseInt(row.student_count, 10) || 0, academic_year_id, semester_id
              )
              created++
            }
          } else if (target === 'CALENDAR_EVENTS') {
            const existing = db.prepare('SELECT id FROM calendar_events WHERE title = ? AND start_datetime = ? AND end_datetime = ? AND is_active = 1').get(row.title, row.start_datetime, row.end_datetime) as { id: string } | undefined
            if (existing) {
              skipped++
            } else {
              db.prepare("INSERT INTO calendar_events (id, title, event_type, is_blocking, is_all_day, start_datetime, end_datetime, description, academic_year_id, semester_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))").run(
                randomUUID(), row.title, row.event_type || 'CUSTOM', row.is_blocking === 'true' || row.is_blocking === '1' ? 1 : 0, row.is_all_day === 'true' || row.is_all_day === '1' ? 1 : 0, row.start_datetime, row.end_datetime, row.description || null, academic_year_id ?? null, semester_id ?? null
              )
              created++
            }
          } else if (target === 'SUBJECT_BANK') {
            const existing = db.prepare('SELECT id FROM subject_bank WHERE subject_code = ? AND course_program = ? AND year_level = ? AND semester_type = ? AND department = ? AND is_active = 1').get(
              row.subject_code, row.course_program, row.year_level, row.semester_type || '1ST', row.department || department || 'COLLEGE'
            ) as { id: string } | undefined
            if (existing) {
              db.prepare("UPDATE subject_bank SET subject_name = ?, description = ?, lec_units = ?, lab_units = ?, pre_requisites = ?, updated_at = datetime('now') WHERE id = ?").run(
                row.subject_name, row.description || null, parseInt(row.lec_units, 10) || 0, parseInt(row.lab_units, 10) || 0, row.pre_requisites || null, existing.id
              )
              updated++
            } else {
              db.prepare("INSERT INTO subject_bank (id, subject_code, subject_name, description, course_program, year_level, semester_type, lec_units, lab_units, pre_requisites, department, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))").run(
                randomUUID(), row.subject_code, row.subject_name, row.description || null, row.course_program, row.year_level, row.semester_type || '1ST', parseInt(row.lec_units, 10) || 0, parseInt(row.lab_units, 10) || 0, row.pre_requisites || null, row.department || department || 'COLLEGE'
              )
              created++
            }
          }
        } catch (err) {
          errors.push(`Row ${row.row_number}: ${(err as Error).message}`)
          skipped++
        }
      }

      // Log the import job
      db.prepare("INSERT INTO import_jobs (id, target, department, file_name, total_rows, rows_created, rows_updated, rows_skipped, error_details, academic_year_id, semester_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))").run(
        jobId, target, department ?? null, file_name, parsed.length, created, updated, skipped, errors.length > 0 ? JSON.stringify(errors) : null, academic_year_id ?? null, semester_id ?? null
      )

      // Audit log for the import operation
      logAudit({
        entity_type: 'import_job',
        entity_id: jobId,
        department: department ?? null,
        action: 'CREATE',
        after_snapshot: { target, file_name, total_rows: parsed.length, created, updated, skipped, error_count: errors.length }
      })
    })

    try {
      commit()
    } catch (err) {
      // Transaction auto-rolls back on throw; re-throw with context
      throwError(ERROR_CODES.INTERNAL_ERROR, `Import failed: ${(err as Error).message}`)
    }

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
