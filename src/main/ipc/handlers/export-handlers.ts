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

/** Format a sorted array of ISO date strings into institutional format.
 *  e.g. ['2026-04-24', '2026-04-25'] → 'APRIL 24-25, 2026'
 *       ['2026-04-24'] → 'APRIL 24, 2026'
 *       ['2026-03-28', '2026-04-02'] → 'MARCH 28 - APRIL 02, 2026'
 */
function formatDateRange(dates: string[]): string {
  if (dates.length === 0) return ''
  const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']

  const first = new Date(dates[0] + 'T00:00:00')
  const last = new Date(dates[dates.length - 1] + 'T00:00:00')

  const fMonth = MONTHS[first.getMonth()]
  const fDay = first.getDate()
  const fYear = first.getFullYear()

  if (dates.length === 1) return `${fMonth} ${fDay}, ${fYear}`

  const lMonth = MONTHS[last.getMonth()]
  const lDay = last.getDate()
  const lYear = last.getFullYear()

  if (fYear === lYear && fMonth === lMonth) {
    // Same month: "APRIL 24-25, 2026"
    return `${fMonth} ${fDay}-${lDay}, ${fYear}`
  }
  if (fYear === lYear) {
    // Different months, same year: "MARCH 28 - APRIL 02, 2026"
    return `${fMonth} ${fDay} - ${lMonth} ${lDay}, ${fYear}`
  }
  // Different years (rare): "DECEMBER 28, 2025 - JANUARY 02, 2026"
  return `${fMonth} ${fDay}, ${fYear} - ${lMonth} ${lDay}, ${lYear}`
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
const COLOR_GREEN_BG = 'FF92D050'     // Green — section row
const COLOR_YELLOW_BG = 'FFFFFF00'    // Yellow — exam period, column headers, ROOM cells

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
    const { department, semester_id, signatories } = args as { department?: Department; semester_id?: string; signatories?: Array<{ label: string; entries: Array<{ name: string; position: string }> }> }
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

    // Load logo and institution settings
    const logo = loadInstitutionLogo()
    const institutionName = getSetting(SETTINGS_KEYS.INSTITUTION_NAME) ?? ''
    const institutionAddress = getSetting(SETTINGS_KEYS.INSTITUTION_ADDRESS) ?? ''
    const institutionContact = getSetting(SETTINGS_KEYS.INSTITUTION_CONTACT) ?? ''
    const institutionEmail = getSetting(SETTINGS_KEYS.INSTITUTION_EMAIL) ?? ''

    // Create workbook
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Schedule Management System'
    wb.created = new Date()

    // 8 columns: CODE, SUBJECT/s, LEC, LAB, DAY, TIME, ROOM, PROCTOR
    const COL_COUNT = 8

    for (const [sectionId, entries] of sectionGroups) {
      const sec = sectionMap.get(sectionId)
      const sectionCode = sec ? sec.section_code : (sectionId === '__UNASSIGNED__' ? 'UNASSIGNED' : sectionId)
      const sheetName = sectionCode.substring(0, 31).replace(/[\\/*?[\]:]/g, '_')

      const ws = wb.addWorksheet(sheetName)

      // Column widths matching the reference document layout
      ws.columns = [
        { width: 12 },  // A — CODE
        { width: 40 },  // B — SUBJECT/s
        { width: 5 },   // C — LEC
        { width: 5 },   // D — LAB
        { width: 5 },   // E — DAY
        { width: 11 },  // F — TIME
        { width: 8 },   // G — ROOM
        { width: 34 },  // H — PROCTOR
      ]

      let r = 1 // current row pointer

      // ── Logo + Institution Header ──────────────────────────
      // Logo spans rows 1-6 in column A, institution text starts at col B
      const HEADER_ROWS = 6

      if (logo) {
        const imgId = wb.addImage({ buffer: logo.buffer, extension: logo.extension })
        // Place logo in cell A1, spanning ~6 rows high
        ws.addImage(imgId, {
          tl: { col: 0, row: 0 },
          ext: { width: 85, height: 85 }
        })
      }

      // Row 1: Institution name (Times New Roman, bold, centered over B-H)
      ws.mergeCells(r, 2, r, COL_COUNT)
      const nameCell = ws.getCell(r, 2)
      nameCell.value = institutionName
      nameCell.font = { bold: true, size: 14, name: 'Times New Roman' }
      nameCell.alignment = { horizontal: 'center', vertical: 'middle' }
      r++

      // Row 2: Address (centered, underlined over B-H)
      ws.mergeCells(r, 2, r, COL_COUNT)
      const addrCell = ws.getCell(r, 2)
      addrCell.value = institutionAddress
      addrCell.font = { size: 9, name: 'Arial', underline: true }
      addrCell.alignment = { horizontal: 'center', vertical: 'middle' }
      r++

      // Row 3: Contact info (centered, underlined over B-H)
      ws.mergeCells(r, 2, r, COL_COUNT)
      const contactCell = ws.getCell(r, 2)
      contactCell.value = institutionContact
      contactCell.font = { size: 9, name: 'Arial', underline: true }
      contactCell.alignment = { horizontal: 'center', vertical: 'middle' }
      r++

      // Row 4: Email (centered, blue hyperlink style over B-H)
      ws.mergeCells(r, 2, r, COL_COUNT)
      const emailCell = ws.getCell(r, 2)
      emailCell.value = institutionEmail ? `Email: ${institutionEmail}` : ''
      emailCell.font = { size: 9, name: 'Arial', color: { argb: 'FF0563C1' }, underline: true }
      emailCell.alignment = { horizontal: 'center', vertical: 'middle' }
      r++

      // Row 5: empty spacer
      r++

      // Row 6: "ACADEMIC AFFAIRS OFFICE" centered (full width)
      ws.mergeCells(r, 1, r, COL_COUNT)
      const officeCell = ws.getCell(r, 1)
      officeCell.value = 'ACADEMIC AFFAIRS OFFICE'
      officeCell.font = { bold: true, size: 12, name: 'Arial' }
      officeCell.alignment = { horizontal: 'center', vertical: 'middle' }
      r++

      // Row 7: spacer
      r++

      // Set header row heights
      for (let hr = 1; hr <= HEADER_ROWS; hr++) {
        ws.getRow(hr).height = 18
      }

      // ── Exam period header rows ────────────────────────────
      const firstEntry = entries[0]
      const dates = entries.map(e => String(e.exam_date ?? '')).filter(Boolean).sort()
      const totalLec = entries.reduce((sum, e) => sum + (Number(e.lec_units) || 0), 0)
      const totalLab = entries.reduce((sum, e) => sum + (Number(e.lab_units) || 0), 0)
      const totalUnits = totalLec + totalLab

      // Format date range as "MONTH DAY-DAY, YEAR" (e.g. "APRIL 24-25, 2026")
      const dateRangeLabel = formatDateRange(dates)

      // Row: Exam period title (yellow background)
      const examTypeLabel = formatExamType(firstEntry.exam_type)
      const examPeriod = dateRangeLabel
        ? `${examTypeLabel} ${dateRangeLabel}`
        : examTypeLabel
      ws.mergeCells(r, 1, r, COL_COUNT)
      const examPeriodCell = ws.getCell(r, 1)
      examPeriodCell.value = examPeriod
      examPeriodCell.font = { bold: true, size: 10, name: 'Arial' }
      examPeriodCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_YELLOW_BG } }
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

      // Row: Course/Program + Year Level + Units (no background)
      const courseYear = sec
        ? `${sec.course_program ?? ''} ${sec.year_level ?? ''} (${totalUnits} UNITS)`.trim()
        : `(${totalUnits} UNITS)`
      ws.mergeCells(r, 1, r, COL_COUNT)
      const courseCell = ws.getCell(r, 1)
      courseCell.value = courseYear
      courseCell.font = { bold: true, size: 10, name: 'Arial' }
      courseCell.border = THIN_BORDER
      r++

      // Row: Semester (split layout matching reference document)
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
      unitCell.border = THIN_BORDER

      for (let c = 5; c <= COL_COUNT; c++) {
        const cell = ws.getCell(r, c)
        cell.border = THIN_BORDER
      }
      r++

      // ── Column headers (all yellow background) ──
      const colHeaders = ['CODE', 'SUBJECT/s', 'LEC', 'LAB', 'DAY', 'TIME', 'ROOM', 'PROCTOR']
      for (let c = 0; c < colHeaders.length; c++) {
        const cell = ws.getCell(r, c + 1)
        cell.value = colHeaders[c]
        cell.font = { bold: true, size: 10, name: 'Arial' }
        cell.alignment = { horizontal: c >= 2 && c <= 4 ? 'center' : 'left', vertical: 'middle' }
        cell.border = THIN_BORDER
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_YELLOW_BG } }
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
          cell.alignment = { horizontal: c >= 2 && c <= 4 ? 'center' : 'left', vertical: 'middle', wrapText: true }
          // Only ROOM column (index 6) gets yellow background
          if (c === 6) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_YELLOW_BG } }
          }
        }
        r++
      }

      // ── Dynamic signatory footer ─────────────────────────────
      const sigGroups = signatories ?? []
      if (sigGroups.length > 0) {
        r += 3 // 3 blank rows for spacing (signature area)

        if (sigGroups.length === 2) {
          // Side-by-side layout for exactly 2 groups (common: Prepared by / Received by)
          const leftGroup = sigGroups[0]
          const rightGroup = sigGroups[1]

          // Labels row
          ws.getCell(r, 1).value = `${leftGroup.label}:`
          ws.getCell(r, 1).font = { size: 10, name: 'Arial' }
          ws.getCell(r, 5).value = `${rightGroup.label}:`
          ws.getCell(r, 5).font = { size: 10, name: 'Arial' }

          // Render entries for each side
          const maxEntries = Math.max(leftGroup.entries.length, rightGroup.entries.length)
          for (let ei = 0; ei < maxEntries; ei++) {
            r += 3 // space for signature between entries

            // Left side entry
            if (ei < leftGroup.entries.length) {
              const entry = leftGroup.entries[ei]
              ws.mergeCells(r, 1, r, 3)
              const nameCell = ws.getCell(r, 1)
              nameCell.value = entry.name
              nameCell.font = { bold: true, size: 10, name: 'Arial' }
              nameCell.border = { bottom: { style: 'thin' } }

              ws.mergeCells(r + 1, 1, r + 1, 3)
              const titleCell = ws.getCell(r + 1, 1)
              titleCell.value = entry.position
              titleCell.font = { size: 10, name: 'Arial' }
            }

            // Right side entry
            if (ei < rightGroup.entries.length) {
              const entry = rightGroup.entries[ei]
              ws.mergeCells(r, 5, r, COL_COUNT)
              const nameCell = ws.getCell(r, 5)
              nameCell.value = entry.name
              nameCell.font = { bold: true, size: 10, name: 'Arial' }
              nameCell.border = { bottom: { style: 'thin' } }

              ws.mergeCells(r + 1, 5, r + 1, COL_COUNT)
              const titleCell = ws.getCell(r + 1, 5)
              titleCell.value = entry.position
              titleCell.font = { size: 10, name: 'Arial' }
            }

            r += 2 // move past name + title rows
          }
        } else {
          // Stacked layout for 1 or 3+ groups
          for (const group of sigGroups) {
            // Label
            ws.getCell(r, 1).value = `${group.label}:`
            ws.getCell(r, 1).font = { size: 10, name: 'Arial' }

            for (const entry of group.entries) {
              r += 3 // space for signature

              // Name (bold, underlined)
              ws.mergeCells(r, 1, r, 4)
              const nameCell = ws.getCell(r, 1)
              nameCell.value = entry.name
              nameCell.font = { bold: true, size: 10, name: 'Arial' }
              nameCell.border = { bottom: { style: 'thin' } }
              r++

              // Position
              ws.mergeCells(r, 1, r, 4)
              const titleCell = ws.getCell(r, 1)
              titleCell.value = entry.position
              titleCell.font = { size: 10, name: 'Arial' }
              r++
            }

            r += 2 // spacing between groups
          }
        }
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
