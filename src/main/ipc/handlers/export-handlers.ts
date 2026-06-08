// Export Handlers — TASK-21
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { dialog } from 'electron'
import { writeFile } from 'fs/promises'
import { getDatabase } from '../../database/connection'
import { getSetting } from '../../services/settings-service'
import { SETTINGS_KEYS } from '../../../shared/constants'
import { readFileSync, existsSync } from 'fs'
import type { Department } from '../../../shared/types'
import ExcelJS from 'exceljs'

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const escape = (v: unknown): string => {
    const s = String(v ?? '')
    // Handle commas, quotes, newlines (\n), and carriage returns (\r)
    return s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','))
  }
  return lines.join('\r\n') // Use CRLF for better cross-platform CSV compatibility
}

async function saveCSV(data: string, defaultName: string): Promise<{ success: boolean; path?: string }> {
  const result = await dialog.showSaveDialog({
    title: 'Export CSV',
    defaultPath: defaultName,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  })
  if (result.canceled || !result.filePath) return { success: false }
  // Use async writeFile to avoid blocking main thread
  await writeFile(result.filePath, '\ufeff' + data, 'utf-8') // BOM for Excel
  return { success: true, path: result.filePath }
}

// ── Shared Excel helpers ──────────────────────────────────────

/** Detect image type from file extension for ExcelJS */
function getImageExtension(filePath: string): 'png' | 'jpeg' | 'gif' | undefined {
  const lower = filePath.toLowerCase()
  if (lower.endsWith('.png')) return 'png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'jpeg'
  if (lower.endsWith('.gif')) return 'gif'
  return undefined
}

/** Load institution logo from settings and return image buffer + extension, or null */
function loadInstitutionLogo(): { buffer: Buffer; extension: 'png' | 'jpeg' | 'gif' } | null {
  const logoPath = getSetting(SETTINGS_KEYS.INSTITUTION_LOGO)
  if (!logoPath || !existsSync(logoPath)) return null
  const ext = getImageExtension(logoPath)
  if (!ext) return null // SVG not supported by ExcelJS
  return { buffer: readFileSync(logoPath), extension: ext }
}

/** Format time to 12h (e.g. "13:00" → "1PM") */
function to12h(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, '0')}${period}`
}

/** Format proctor name (e.g. "Mr. JOHN JASON ABONALLA, LPT") */
function formatProctor(row: Record<string, unknown>): string {
  if (!row.p_last) return ''
  const parts: string[] = []
  if (row.p_honorific) parts.push(String(row.p_honorific))
  parts.push(`${String(row.p_first ?? '').toUpperCase()} ${String(row.p_last).toUpperCase()}`)
  let name = parts.join(' ')
  if (row.p_credentials) name += `, ${String(row.p_credentials)}`
  return name
}

/** Get day abbreviation from date string */
function getDayAbbr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()] ?? ''
}

/** Format exam type for display */
function formatExamType(et: unknown): string {
  const s = String(et ?? '')
  const map: Record<string, string> = {
    PRELIM: 'PRELIMINARY EXAMINATION',
    MIDTERM: 'MIDTERM EXAMINATION',
    PRE_FINALS: 'PRE-FINAL EXAMINATION',
    FINALS: 'FINAL EXAMINATION',
    Q1_EXAM: 'FIRST QUARTER EXAMINATION',
    Q2_EXAM: 'SECOND QUARTER EXAMINATION',
    Q3_EXAM: 'THIRD QUARTER EXAMINATION',
    Q4_EXAM: 'FOURTH QUARTER EXAMINATION'
  }
  return map[s] ?? s.replace(/_/g, ' ') + ' EXAMINATION'
}

/** Format semester type for display */
function formatSemester(st: unknown, ayLabel: unknown): string {
  const semMap: Record<string, string> = {
    '1ST_SEMESTER': 'FIRST SEMESTER',
    '2ND_SEMESTER': 'SECOND SEMESTER',
    'SUMMER': 'SUMMER'
  }
  const semStr = semMap[String(st ?? '')] ?? String(st ?? '')
  return ayLabel ? `${semStr} (${ayLabel})` : semStr
}

// ── Shared style constants ────────────────────────────────────

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  bottom: { style: 'thin' },
  left: { style: 'thin' },
  right: { style: 'thin' }
}

const DATA_FONT: Partial<ExcelJS.Font> = { size: 10, name: 'Arial' }

// Colors matching the reference document
const COLOR_RED_BG = 'FFFF0000'       // Red — exam period title row
const COLOR_GREEN_BG = 'FF92D050'     // Green — section row
const COLOR_YELLOW_BG = 'FFFFDD00'    // Yellow — course/year row & column headers
const COLOR_CYAN_BG = 'FF00B0F0'      // Cyan — UNIT/s header area
const COLOR_ORANGE_BG = 'FFFFC000'    // Orange — ROOM / PROCTOR header & data

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

  registerHandler(IPC_CHANNELS.EXPORTS_ROOM_UTILIZATION, async () => {
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

  // ── Exam Schedule Excel Export ─────────────────────────────
  registerHandler(IPC_CHANNELS.EXPORTS_EXAM_SCHEDULE, async (args) => {
    const { department, semester_id } = args as { department?: Department; semester_id?: string }
    const db = getDatabase()
    const conditions: string[] = ["se.activity_type = 'EXAM'", 'se.is_active = 1']
    const params: unknown[] = []
    if (department) { conditions.push('se.department = ?'); params.push(department) }
    if (semester_id) { conditions.push('se.semester_id = ?'); params.push(semester_id) }

    const rows = db.prepare(
      `SELECT se.id, se.exam_title, se.exam_type, se.department, se.subject, se.subject_code,
       se.lec_units, se.lab_units, se.start_time, se.end_time,
       se.recurrence_start_date as exam_date, se.section_ids, se.status,
       r.room_code,
       p.first_name as p_first, p.last_name as p_last, p.honorific as p_honorific, p.credentials as p_credentials,
       sem.semester_type, ay.label as ay_label
       FROM schedule_entries se
       LEFT JOIN rooms r ON se.room_id = r.id
       LEFT JOIN personnel p ON se.personnel_id = p.id
       LEFT JOIN semesters sem ON se.semester_id = sem.id
       LEFT JOIN academic_years ay ON se.academic_year_id = ay.id
       WHERE ${conditions.join(' AND ')} ORDER BY se.recurrence_start_date, se.start_time`
    ).all(...params) as Record<string, unknown>[]

    const allSections = db.prepare(
      'SELECT id, section_code, course_program, year_level FROM sections WHERE is_active = 1'
    ).all() as Array<{ id: string; section_code: string; course_program: string | null; year_level: string | null }>
    const sectionMap = new Map(allSections.map(s => [s.id, s]))

    // Group entries by section
    type EntryRow = Record<string, unknown>
    const sectionGroups = new Map<string, EntryRow[]>()
    for (const row of rows) {
      let sectionIds: string[] = []
      try { sectionIds = JSON.parse(String(row.section_ids ?? '[]')) } catch { sectionIds = [] }
      if (sectionIds.length === 0) {
        const key = '__UNASSIGNED__'
        if (!sectionGroups.has(key)) sectionGroups.set(key, [])
        sectionGroups.get(key)!.push(row)
      } else {
        for (const sid of sectionIds) {
          if (!sectionGroups.has(sid)) sectionGroups.set(sid, [])
          sectionGroups.get(sid)!.push(row)
        }
      }
    }

    // Load logo
    const logo = loadInstitutionLogo()

    // Create workbook
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Schedule Management System'
    wb.created = new Date()

    // 8 columns: CODE, SUBJECT/s, LEC, LAB, DAY, TIME, ROOM, PROCTOR
    const COL_COUNT = 8

    for (const [sectionId, entries] of sectionGroups) {
      const sec = sectionMap.get(sectionId)
      const sectionCode = sec ? sec.section_code : (sectionId === '__UNASSIGNED__' ? 'UNASSIGNED' : sectionId)
      // Sheet names max 31 chars, no special characters
      const sheetName = sectionCode.substring(0, 31).replace(/[\\/*?[\]:]/g, '_')

      const ws = wb.addWorksheet(sheetName)

      // Set column widths to match document layout
      ws.columns = [
        { width: 14 },  // A — CODE
        { width: 42 },  // B — SUBJECT/s
        { width: 6 },   // C — LEC
        { width: 6 },   // D — LAB
        { width: 6 },   // E — DAY
        { width: 12 },  // F — TIME
        { width: 8 },   // G — ROOM
        { width: 36 },  // H — PROCTOR
      ]

      let r = 1 // current row pointer

      // ── Logo + Institution Header ──────────────────────────
      if (logo) {
        const imgId = wb.addImage({ buffer: logo.buffer, extension: logo.extension })
        ws.addImage(imgId, {
          tl: { col: 0, row: 0 },
          ext: { width: 90, height: 90 }
        })
      }

      // Institution header — merged across columns, centered
      ws.mergeCells(r, 1, r, COL_COUNT)
      const instCell = ws.getCell(r, 1)
      instCell.value = 'ACADEMIC AFFAIRS OFFICE'
      instCell.font = { bold: true, size: 12, name: 'Arial' }
      instCell.alignment = { horizontal: 'center', vertical: 'middle' }
      r++

      // Spacer row
      r++

      // ── Exam period header rows ────────────────────────────
      const firstEntry = entries[0]
      const dates = entries.map(e => String(e.exam_date ?? '')).filter(Boolean).sort()
      const dateRange = dates.length > 0
        ? dates.length === 1 ? dates[0] : `${dates[0]} to ${dates[dates.length - 1]}`
        : ''
      const totalLec = entries.reduce((sum, e) => sum + (Number(e.lec_units) || 0), 0)
      const totalLab = entries.reduce((sum, e) => sum + (Number(e.lab_units) || 0), 0)
      const totalUnits = totalLec + totalLab

      // Row: Exam period title (red background)
      const examTypeLabel = formatExamType(firstEntry.exam_type)
      const examPeriod = dateRange
        ? `${examTypeLabel} ${dateRange}`
        : examTypeLabel
      ws.mergeCells(r, 1, r, COL_COUNT)
      const examPeriodCell = ws.getCell(r, 1)
      examPeriodCell.value = examPeriod
      examPeriodCell.font = { bold: true, size: 10, name: 'Arial' }
      examPeriodCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_RED_BG } }
      examPeriodCell.border = THIN_BORDER
      r++

      // Row: Section (green background)
      ws.mergeCells(r, 1, r, COL_COUNT)
      const secCell = ws.getCell(r, 1)
      secCell.value = `SECTION - ${sectionCode}`
      secCell.font = { bold: true, size: 10, name: 'Arial' }
      secCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_GREEN_BG } }
      secCell.border = THIN_BORDER
      r++

      // Row: Course/Program + Year Level + Units (yellow background)
      const courseYear = sec
        ? `${sec.course_program ?? ''} ${sec.year_level ?? ''} (${totalUnits} UNITS)`.trim()
        : `(${totalUnits} UNITS)`
      ws.mergeCells(r, 1, r, COL_COUNT)
      const courseCell = ws.getCell(r, 1)
      courseCell.value = courseYear
      courseCell.font = { bold: true, size: 10, name: 'Arial' }
      courseCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_YELLOW_BG } }
      courseCell.border = THIN_BORDER
      r++

      // Row: Semester (split layout matching reference document)
      // Cols A-B: semester label, Cols C-D: UNIT/s, Cols E-H: cyan fill
      ws.mergeCells(r, 1, r, 2)
      const semCell = ws.getCell(r, 1)
      semCell.value = formatSemester(firstEntry.semester_type, firstEntry.ay_label)
      semCell.font = { bold: true, size: 10, name: 'Arial' }
      semCell.border = THIN_BORDER

      ws.mergeCells(r, 3, r, 4)
      const unitCell = ws.getCell(r, 3)
      unitCell.value = 'UNIT/s'
      unitCell.font = { bold: true, size: 10, name: 'Arial' }
      unitCell.alignment = { horizontal: 'center' }
      unitCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_CYAN_BG } }
      unitCell.border = THIN_BORDER

      for (let c = 5; c <= COL_COUNT; c++) {
        const cell = ws.getCell(r, c)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_CYAN_BG } }
        cell.border = THIN_BORDER
      }
      r++

      // ── Column headers (yellow bg, orange for ROOM/PROCTOR) ──
      const colHeaders = ['CODE', 'SUBJECT/s', 'LEC', 'LAB', 'DAY', 'TIME', 'ROOM', 'PROCTOR']
      for (let c = 0; c < colHeaders.length; c++) {
        const cell = ws.getCell(r, c + 1)
        cell.value = colHeaders[c]
        cell.font = { bold: true, size: 10, name: 'Arial' }
        cell.alignment = { horizontal: c >= 2 && c <= 4 ? 'center' : 'left', vertical: 'middle' }
        cell.border = THIN_BORDER
        if (c >= 6) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ORANGE_BG } }
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_YELLOW_BG } }
        }
      }
      r++

      // ── Data rows ─────────────────────────────────────────
      for (const entry of entries) {
        const rowData = [
          String(entry.subject_code ?? ''),
          String(entry.subject ?? entry.exam_title ?? ''),
          Number(entry.lec_units) || '',
          Number(entry.lab_units) || '',
          getDayAbbr(String(entry.exam_date ?? '')),
          `${to12h(String(entry.start_time))}-${to12h(String(entry.end_time))}`,
          String(entry.room_code ?? ''),
          formatProctor(entry)
        ]

        for (let c = 0; c < rowData.length; c++) {
          const cell = ws.getCell(r, c + 1)
          cell.value = rowData[c]
          cell.font = DATA_FONT
          cell.border = THIN_BORDER
          cell.alignment = { horizontal: c >= 2 && c <= 4 ? 'center' : 'left', vertical: 'middle' }
          if (c >= 6) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ORANGE_BG } }
          }
        }
        r++
      }

      // ── Print settings ─────────────────────────────────────
      ws.pageSetup = {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
      }
    }

    // If no sections at all, create an empty sheet
    if (sectionGroups.size === 0) {
      const ws = wb.addWorksheet('No Data')
      ws.getCell('A1').value = 'No exam entries found.'
      ws.getCell('A1').font = { size: 12, name: 'Arial' }
    }

    // Save dialog
    const saveResult = await dialog.showSaveDialog({
      title: 'Export Exam Schedule',
      defaultPath: `exam_schedule_${new Date().toISOString().split('T')[0]}.xlsx`,
      filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
    })
    if (saveResult.canceled || !saveResult.filePath) return { success: false }

    const buffer = await wb.xlsx.writeBuffer()
    await writeFile(saveResult.filePath, Buffer.from(buffer))
    return { success: true, path: saveResult.filePath }
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

    // Use JSON extraction for precise section_ids matching instead of LIKE '%id%'
    // which can produce false positives when one ID is a substring of another
    const rows = db.prepare(
      `SELECT s.section_code, s.section_name, s.department, s.student_count,
       (SELECT COUNT(*) FROM schedule_entries se
        WHERE se.is_active = 1
        AND (',' || REPLACE(REPLACE(REPLACE(se.section_ids, '[', ''), ']', ''), '"', '') || ',')
        LIKE ('%,' || s.id || ',%')
       ) as entry_count
       FROM sections s
       WHERE ${conditions.join(' AND ')} ORDER BY s.section_code`
    ).all(...params) as Record<string, unknown>[]
    const csv = toCsv(['section_code', 'section_name', 'department', 'student_count', 'entry_count'], rows)
    return saveCSV(csv, `section_schedule_${new Date().toISOString().split('T')[0]}.csv`)
  })
}
