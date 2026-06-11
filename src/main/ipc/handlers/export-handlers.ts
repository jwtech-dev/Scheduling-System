// Export Handlers — TASK-21
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { dialog, BrowserWindow, app } from 'electron'
import { writeFile } from 'fs/promises'
import { getDatabase } from '../../database/connection'
import { getSetting } from '../../services/settings-service'
import { SETTINGS_KEYS } from '../../../shared/constants'
import { readFileSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import type { Department } from '../../../shared/types'
import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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
const COLOR_CYAN_BG = 'FF00B0F0'         // Cyan/Sky Blue — exam period title row
const COLOR_GREEN_BG = 'FF92D050'         // Green — section row
const COLOR_YELLOW_BG = 'FFFFFF00'        // Yellow — left side headers
const COLOR_ORANGE_BG = 'FFED7D31'        // Orange — right side (UNIT/s onward)

/** Escape HTML special characters */
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Get array of {year, month} for each month in a date range */
function getMonthsInRange(startDate: string, endDate: string): Array<{ year: number; month: number }> {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  const result: Array<{ year: number; month: number }> = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cursor <= end) {
    result.push({ year: cursor.getFullYear(), month: cursor.getMonth() })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return result
}

/** Build complete HTML document for calendar PDF export */
function buildCalendarPdfHtml(params: {
  logoDataUri: string; instName: string; instAddress: string; instContact: string
  deptLabel: string; titleLine2: string
  months: Array<{ year: number; month: number }>
  events: Array<{ title: string; event_type: string; start_datetime: string; end_datetime: string }>
  semesterStartDate: string; semesterEndDate: string
}): string {
  const { logoDataUri, instName, instAddress, instContact, deptLabel, titleLine2,
    months, events, semesterStartDate, semesterEndDate } = params

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const MONTH_ABBRS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const fmtDt = (y: number, m: number, d: number): string =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  // Build set of all event dates for bolding in mini calendar
  const eventDateSet = new Set<string>()
  for (const ev of events) {
    const s = new Date(ev.start_datetime.slice(0, 10) + 'T00:00:00')
    const e = new Date(ev.end_datetime.slice(0, 10) + 'T00:00:00')
    const c = new Date(s)
    while (c <= e) {
      eventDateSet.add(fmtDt(c.getFullYear(), c.getMonth(), c.getDate()))
      c.setDate(c.getDate() + 1)
    }
  }

  const semStart = new Date(semesterStartDate + 'T00:00:00')
  const semEnd = new Date(semesterEndDate + 'T00:00:00')

  let bodyHtml = ''

  for (const { year, month } of months) {
    const lastDay = new Date(year, month + 1, 0).getDate()
    const monthStartStr = fmtDt(year, month, 1)
    const monthEndStr = fmtDt(year, month, lastDay)

    // Filter events for this month
    const monthEvents = events.filter(ev => {
      const evS = ev.start_datetime.slice(0, 10)
      const evE = ev.end_datetime.slice(0, 10)
      return evS <= monthEndStr && evE >= monthStartStr
    })

    // Build event list table rows
    let eventRows = ''
    let prevDateStr = ''
    for (const ev of monthEvents) {
      const evStartD = new Date(ev.start_datetime.slice(0, 10) + 'T00:00:00')
      const evEndD = new Date(ev.end_datetime.slice(0, 10) + 'T00:00:00')
      const dS = evStartD.getFullYear() === year && evStartD.getMonth() === month ? evStartD.getDate() : 1
      const dE = evEndD.getFullYear() === year && evEndD.getMonth() === month ? evEndD.getDate() : lastDay
      const dateStr = dS === dE ? String(dS) : `${dS}-${dE}`

      const showDate = dateStr !== prevDateStr
      prevDateStr = dateStr

      const isHoliday = ev.event_type === 'HOLIDAY'
      const titleHtml = isHoliday ? `<i>${escapeHtml(ev.title)}</i>` : escapeHtml(ev.title)
      eventRows += `<tr><td class="dc">${showDate ? dateStr : ''}</td><td>${titleHtml}</td></tr>\n`
    }
    if (monthEvents.length === 0) {
      eventRows = '<tr><td class="dc"></td><td style="color:#999;font-style:italic">No events</td></tr>'
    }

    // Build mini calendar grid
    const firstDow = new Date(year, month, 1).getDay()
    let calRows = ''
    let dayNum = 1
    let rowIdx = 0

    while (dayNum <= lastDay) {
      let rh = '<tr>'
      let satDate: Date | null = null
      for (let col = 0; col < 7; col++) {
        if ((rowIdx === 0 && col < firstDow) || dayNum > lastDay) {
          rh += '<td></td>'
        } else {
          const dk = fmtDt(year, month, dayNum)
          rh += eventDateSet.has(dk) ? `<td class="eb">${dayNum}</td>` : `<td>${dayNum}</td>`
          if (col === 6) satDate = new Date(year, month, dayNum)
          dayNum++
        }
      }
      // Week number — only on rows where Saturday has a valid date within the semester
      let wk = ''
      if (satDate && satDate >= semStart && satDate <= semEnd) {
        const diff = Math.floor((satDate.getTime() - semStart.getTime()) / 86400000)
        const wn = Math.floor(diff / 7) + 1
        if (wn >= 1) wk = String(wn)
      }
      rh += `<td class="wk">${wk}</td></tr>\n`
      calRows += rh
      rowIdx++
    }

    bodyHtml += `
    <div class="mb">
      <div class="el">
        <div class="mh">${MONTH_NAMES[month]} ${year}</div>
        <table class="et">${eventRows}</table>
      </div>
      <div class="cs">
        <table class="ct">
          <tr><th colspan="7" class="ch">${MONTH_ABBRS[month]}</th><th class="wh">Week</th></tr>
          <tr class="dh"><th>S</th><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th><th></th></tr>
          ${calRows}
        </table>
      </div>
    </div>`
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@page { size: 8.5in 14in; margin: 0.4in 0.5in; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; font-size: 9pt; color: #000; }
.hdr { text-align: center; margin-bottom: 4px; }
.hdr img { height: 60px; }
.hdr .nm { font-weight: bold; color: #a00; font-size: 11pt; letter-spacing: 0.5px; }
.hdr .ad, .hdr .cn { font-size: 8pt; margin-top: 1px; }
.ttl { text-align: center; font-weight: bold; font-size: 10pt; margin: 6px 0 10px; line-height: 1.5; }
.mb { display: flex; gap: 8px; margin-bottom: 4px; page-break-inside: avoid; }
.el { flex: 1; }
.mh { font-weight: bold; font-size: 9pt; padding: 1px 0; border-bottom: 1.5px solid #000; }
.et { width: 100%; border-collapse: collapse; font-size: 8pt; }
.et td { padding: 1px 4px; border: 1px solid #999; vertical-align: top; }
.dc { width: 36px; text-align: center; font-weight: bold; }
.cs { width: 210px; flex-shrink: 0; }
.ct { width: 100%; border-collapse: collapse; font-size: 8pt; text-align: center; }
.ct th, .ct td { padding: 1px 2px; border: 1px solid #999; }
.ch { font-weight: bold; background: #eee; }
.wh { font-weight: bold; font-size: 7pt; }
.dh th { font-weight: bold; font-size: 7pt; }
.eb { font-weight: bold; }
.wk { font-weight: bold; }
</style>
</head>
<body>
  <div class="hdr">
    ${logoDataUri ? `<img src="${logoDataUri}"><br>` : ''}
    <div class="nm">${escapeHtml(instName)}</div>
    ${instAddress ? `<div class="ad">${escapeHtml(instAddress)}</div>` : ''}
    ${instContact ? `<div class="cn">${escapeHtml(instContact)}</div>` : ''}
  </div>
  <div class="ttl">${escapeHtml(deptLabel)}<br>${escapeHtml(titleLine2)}</div>
  ${bodyHtml}
</body>
</html>`
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

      // Row 1: Institution name — RED, bold, Times New Roman, centered over B-H
      ws.mergeCells(r, 2, r, COL_COUNT)
      const nameCell = ws.getCell(r, 2)
      nameCell.value = institutionName.toUpperCase()
      nameCell.font = { bold: true, size: 14, name: 'Times New Roman', color: { argb: 'FFFF0000' } }
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

      // Row: Exam period title (blue background, white text)
      const examTypeLabel = formatExamType(firstEntry.exam_type)
      const examPeriod = dateRangeLabel
        ? `${examTypeLabel} ${dateRangeLabel}`
        : examTypeLabel
      ws.mergeCells(r, 1, r, COL_COUNT)
      const examPeriodCell = ws.getCell(r, 1)
      examPeriodCell.value = examPeriod
      examPeriodCell.font = { bold: true, size: 10, name: 'Arial', color: { argb: 'FF000000' } }
      examPeriodCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_CYAN_BG } }
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

      // Row: Semester (split: left yellow, UNIT/s onward beige)
      ws.mergeCells(r, 1, r, 2)
      const semCell = ws.getCell(r, 1)
      semCell.value = formatSemester(firstEntry.semester_type, firstEntry.ay_label)
      semCell.font = { bold: true, size: 10, name: 'Arial' }
      semCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_YELLOW_BG } }
      semCell.border = THIN_BORDER

      ws.mergeCells(r, 3, r, 4)
      const unitCell = ws.getCell(r, 3)
      unitCell.value = 'UNIT/s'
      unitCell.font = { bold: true, size: 10, name: 'Arial' }
      unitCell.alignment = { horizontal: 'center' }
      unitCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ORANGE_BG } }
      unitCell.border = THIN_BORDER

      for (let c = 5; c <= COL_COUNT; c++) {
        const cell = ws.getCell(r, c)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ORANGE_BG } }
        cell.border = THIN_BORDER
      }
      r++

      // ── Column headers (CODE+SUBJECT yellow, rest beige) ──
      const colHeaders = ['CODE', 'SUBJECT/s', 'LEC', 'LAB', 'DAY', 'TIME', 'ROOM', 'PROCTOR']
      for (let c = 0; c < colHeaders.length; c++) {
        const cell = ws.getCell(r, c + 1)
        cell.value = colHeaders[c]
        cell.font = { bold: true, size: 10, name: 'Arial' }
        cell.alignment = { horizontal: c >= 2 && c <= 4 ? 'center' : 'left', vertical: 'middle' }
        cell.border = THIN_BORDER
        // CODE (0) and SUBJECT/s (1) = yellow, rest = beige
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c <= 1 ? COLOR_YELLOW_BG : COLOR_ORANGE_BG } }
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
    const { department, semester_id, section_id, signatories } = args as {
      department?: Department
      semester_id?: string
      section_id?: string
      signatories?: Array<{ label: string; entries: Array<{ name: string; position: string }> }>
    }

    if (!semester_id) {
      const err = new Error('Semester ID is required for export')
      ;(err as Error & { code: string }).code = 'VALIDATION_ERROR'
      throw err
    }

    const db = getDatabase()

    // 1. Fetch semester and academic year info
    const sem = db.prepare(
      'SELECT sem.*, ay.label as ay_label FROM semesters sem JOIN academic_years ay ON sem.academic_year_id = ay.id WHERE sem.id = ?'
    ).get(semester_id) as { semester_type: string; ay_label: string } | undefined

    if (!sem) {
      const err = new Error('Semester not found')
      ;(err as Error & { code: string }).code = 'NOT_FOUND'
      throw err
    }

    // 2. Fetch section(s)
    let sections: Array<{ id: string; section_code: string; section_name: string | null; strand_track: string | null; course_program: string | null; year_level: string | null; student_count: number }> = []

    if (section_id) {
      const s = db.prepare('SELECT * FROM sections WHERE id = ? AND is_active = 1').get(section_id)
      if (s) sections.push(s as any)
    } else {
      const deptCond = department ? 'AND department = ?' : ''
      const params = department ? [semester_id, department] : [semester_id]
      sections = db.prepare(
        `SELECT * FROM sections WHERE semester_id = ? AND is_active = 1 ${deptCond} ORDER BY section_code`
      ).all(...params) as any[]
    }

    if (sections.length === 0) {
      const err = new Error('No sections found to export')
      ;(err as Error & { code: string }).code = 'NOT_FOUND'
      throw err
    }

    // 3. Setup jsPDF landscape A4
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    const logo = loadInstitutionLogo()
    let logoBase64: string | null = null
    let logoExt = 'PNG'
    if (logo) {
      const mime = logo.extension === 'png' ? 'image/png' : logo.extension === 'jpeg' ? 'image/jpeg' : 'image/gif'
      logoBase64 = `data:${mime};base64,${logo.buffer.toString('base64')}`
      logoExt = logo.extension.toUpperCase()
    }

    const instName = getSetting(SETTINGS_KEYS.INSTITUTION_NAME) ?? ''
    const instAddress = getSetting(SETTINGS_KEYS.INSTITUTION_ADDRESS) ?? ''
    const instContact = getSetting(SETTINGS_KEYS.INSTITUTION_CONTACT) ?? ''
    const footerCredit = getSetting(SETTINGS_KEYS.FOOTER_CREDIT) ?? ''

    // Time slot configurations
    const activeDept = department || (sections[0]?.department as Department)
    const isSHS = activeDept === 'SHS'
    const timeSlotStartStr = getSetting(isSHS ? SETTINGS_KEYS.SHS_TIME_SLOT_START : SETTINGS_KEYS.COLLEGE_TIME_SLOT_START) ?? '07:00'
    const timeSlotEndStr = getSetting(isSHS ? SETTINGS_KEYS.SHS_TIME_SLOT_END : SETTINGS_KEYS.COLLEGE_TIME_SLOT_END) ?? '21:00'
    const periodLen = Number(getSetting(isSHS ? SETTINGS_KEYS.SHS_PERIOD_LENGTH : SETTINGS_KEYS.COLLEGE_PERIOD_LENGTH)) || 60

    const parseTimeToMinutes = (t: string): number => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + (m || 0)
    }

    const startMinutes = parseTimeToMinutes(timeSlotStartStr)
    const endMinutes = parseTimeToMinutes(timeSlotEndStr)

    const formatMinutesToTime = (m: number): string => {
      const h = Math.floor(m / 60)
      const min = m % 60
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
      const ampm = h >= 12 ? 'PM' : 'AM'
      return `${String(hour12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`
    }

    for (let idx = 0; idx < sections.length; idx++) {
      const section = sections[idx]
      if (idx > 0) doc.addPage()

      let currentY = 12

      if (logoBase64) {
        doc.addImage(logoBase64, logoExt, 14, currentY, 20, 10)
      }

      doc.setFont('Times', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(170, 0, 0)
      doc.text(instName.toUpperCase(), 36, currentY + 3)

      doc.setFont('Arial', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(0, 0, 0)
      doc.text(instAddress, 36, currentY + 7)
      doc.text(instContact, 36, currentY + 10)

      currentY += 15

      doc.setFont('Arial', 'bold')
      doc.setFontSize(10)
      const deptLabel = section.department === 'SHS' ? 'SENIOR HIGH SCHOOL DEPARTMENT' : 'COLLEGE DEPARTMENT'
      const semLabel = sem.semester_type.replace(/_/g, ' ')
      doc.text(`${deptLabel} - ${semLabel} (A.Y. ${sem.ay_label})`, 14, currentY)
      doc.text(`WEEKLY TIMETABLE FOR SECTION: ${section.section_code}`, 14, currentY + 4)

      const entries = db.prepare(
        `SELECT se.*, r.room_code, p.first_name || ' ' || p.last_name as personnel_name
         FROM schedule_entries se
         LEFT JOIN rooms r ON se.room_id = r.id
         LEFT JOIN personnel p ON se.personnel_id = p.id
         WHERE se.is_active = 1 AND se.semester_id = ?
         AND (',' || REPLACE(REPLACE(REPLACE(se.section_ids, '[', ''), ']', ''), '"', '') || ',') LIKE ('%,' || ? || ',%')`
      ).all(semester_id, section.id) as Array<{
        id: string; activity_type: string; subject: string | null; modality: string; start_time: string; end_time: string;
        day_of_week: number; room_code: string | null; personnel_name: string | null; status: string
      }>

      const tableRows: any[] = []
      let cursor = startMinutes

      while (cursor + periodLen <= endMinutes) {
        const slotStart = cursor
        const slotEnd = cursor + periodLen
        const timeLabel = `${formatMinutesToTime(slotStart)} - ${formatMinutesToTime(slotEnd)}`

        const rowData = [timeLabel]

        for (let dayIdx = 1; dayIdx <= 6; dayIdx++) {
          const matching = entries.filter(e => {
            if (e.day_of_week !== dayIdx) return false
            const eStart = parseTimeToMinutes(e.start_time)
            const eEnd = parseTimeToMinutes(e.end_time)
            return eStart < slotEnd && eEnd > slotStart
          })

          if (matching.length > 0) {
            rowData.push(matching.map(m => {
              const label = m.subject ?? 'CLASS'
              const room = m.room_code ? ` [${m.room_code}]` : ''
              const faculty = m.personnel_name ? `\n(${m.personnel_name})` : ''
              const statusStr = m.status === 'DRAFT' ? ' *DRAFT*' : ''
              return `${label}${room}${statusStr}${faculty}`
            }).join('\n---\n'))
          } else {
            rowData.push('')
          }
        }

        tableRows.push(rowData)
        cursor += periodLen
      }

      autoTable(doc, {
        startY: currentY + 7,
        head: [['TIME', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5, halign: 'center', valign: 'middle', overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 32, fontStyle: 'bold', fillColor: [240, 240, 240] }
        },
        headStyles: { fillColor: [0, 176, 240], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        didDrawPage: () => {
          if (footerCredit) {
            doc.setFont('Arial', 'normal')
            doc.setFontSize(7)
            doc.setTextColor(120, 120, 120)
            doc.text(footerCredit, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' })
          }
        }
      })

      // @ts-ignore
      const finalY = doc.lastAutoTable.finalY + 10
      const sigGroups = signatories ?? []

      if (sigGroups.length > 0 && finalY + 20 < doc.internal.pageSize.getHeight()) {
        let sigX = 14
        const pageW = doc.internal.pageSize.getWidth() - 28
        const colW = pageW / sigGroups.length

        doc.setFont('Arial', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(0, 0, 0)

        for (const group of sigGroups) {
          doc.text(`${group.label}:`, sigX, finalY)
          
          let entryY = finalY + 12
          for (const entry of group.entries) {
            doc.line(sigX, entryY, sigX + colW - 10, entryY)
            doc.setFont('Arial', 'bold')
            doc.text(entry.name, sigX, entryY + 4)
            doc.setFont('Arial', 'normal')
            doc.text(entry.position, sigX, entryY + 8)
            entryY += 15
          }

          sigX += colW
        }
      }
    }

    const saveResult = await dialog.showSaveDialog({
      title: 'Export Section Schedule PDF',
      defaultPath: `section_schedule_${new Date().toISOString().split('T')[0]}.pdf`,
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
    })

    if (saveResult.canceled || !saveResult.filePath) return { success: false }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    await writeFile(saveResult.filePath, pdfBuffer)
    return { success: true, path: saveResult.filePath }
  })

  // ── Calendar PDF Export ──────────────────────────────────────
  registerHandler(IPC_CHANNELS.EXPORTS_CALENDAR_PDF, async (args) => {
    const { department, academic_year_id, semester_id } = args as {
      department: string; academic_year_id: string; semester_id?: string
    }
    if (!academic_year_id) {
      const err = new Error('Academic year is required for PDF export')
      ;(err as Error & { code: string }).code = 'VALIDATION_ERROR'
      throw err
    }

    const db = getDatabase()

    // Load academic year
    const ay = db.prepare('SELECT * FROM academic_years WHERE id = ?').get(academic_year_id) as
      { id: string; label: string; start_date: string; end_date: string } | undefined
    if (!ay) {
      const err = new Error('Academic year not found')
      ;(err as Error & { code: string }).code = 'NOT_FOUND'
      throw err
    }

    // Load semesters for this AY
    const aySmtrs = db.prepare(
      'SELECT * FROM semesters WHERE academic_year_id = ? ORDER BY start_date'
    ).all(academic_year_id) as Array<{ id: string; semester_type: string; start_date: string; end_date: string }>

    const selectedSem = semester_id ? aySmtrs.find(s => s.id === semester_id) ?? null : null
    const rangeStart = selectedSem?.start_date ?? ay.start_date
    const rangeEnd = selectedSem?.end_date ?? ay.end_date

    // Load events overlapping the date range
    const evRows = db.prepare(`
      SELECT * FROM calendar_events
      WHERE is_active = 1
      AND (department = ? OR department IS NULL)
      AND substr(start_datetime, 1, 10) <= ?
      AND substr(end_datetime, 1, 10) >= ?
      ORDER BY start_datetime
    `).all(department, rangeEnd, rangeStart) as Array<{
      title: string; event_type: string; start_datetime: string; end_datetime: string
    }>

    // Load institution settings
    const logo = loadInstitutionLogo()
    const instName = getSetting(SETTINGS_KEYS.INSTITUTION_NAME) ?? ''
    const instAddress = getSetting(SETTINGS_KEYS.INSTITUTION_ADDRESS) ?? ''
    const instContact = getSetting(SETTINGS_KEYS.INSTITUTION_CONTACT) ?? ''

    let logoDataUri = ''
    if (logo) {
      const mime = logo.extension === 'png' ? 'image/png' : logo.extension === 'jpeg' ? 'image/jpeg' : 'image/gif'
      logoDataUri = `data:${mime};base64,${logo.buffer.toString('base64')}`
    }

    const deptLabel = department === 'SHS' ? 'SENIOR HIGH SCHOOL DEPARTMENT' : 'COLLEGE DEPARTMENT'
    const semMap: Record<string, string> = { '1ST_SEMESTER': 'FIRST SEMESTER', '2ND_SEMESTER': 'SECOND SEMESTER', SUMMER: 'SUMMER' }
    const semLabel = selectedSem ? (semMap[selectedSem.semester_type] ?? selectedSem.semester_type.replace(/_/g, ' ')) : null
    const titleLine2 = semLabel ? `${semLabel}, A.Y. ${ay.label}` : `A.Y. ${ay.label}`

    const months = getMonthsInRange(rangeStart, rangeEnd)
    const semStartDate = selectedSem?.start_date ?? aySmtrs[0]?.start_date ?? rangeStart
    const semEndDate = selectedSem?.end_date ?? aySmtrs[aySmtrs.length - 1]?.end_date ?? rangeEnd

    const html = buildCalendarPdfHtml({
      logoDataUri, instName, instAddress, instContact, deptLabel, titleLine2,
      months, events: evRows, semesterStartDate: semStartDate, semesterEndDate: semEndDate
    })

    // Generate PDF via hidden BrowserWindow
    const tmpPath = join(app.getPath('temp'), `cal-pdf-${Date.now()}.html`)
    await writeFile(tmpPath, html, 'utf-8')

    const win = new BrowserWindow({ show: false, width: 816, height: 1344 })
    try {
      await win.loadFile(tmpPath)

      const pdfBuffer = await win.webContents.printToPDF({
        preferCSSPageSize: true,
        printBackground: true
      })

      const defaultName = `calendar_${ay.label.replace(/[^a-zA-Z0-9-]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      const saveResult = await dialog.showSaveDialog({
        title: 'Export Calendar PDF',
        defaultPath: defaultName,
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
      })
      if (saveResult.canceled || !saveResult.filePath) return { success: false }

      await writeFile(saveResult.filePath, pdfBuffer)
      return { success: true, path: saveResult.filePath }
    } finally {
      win.destroy()
      try { unlinkSync(tmpPath) } catch { /* ignore cleanup errors */ }
    }
  })
}
