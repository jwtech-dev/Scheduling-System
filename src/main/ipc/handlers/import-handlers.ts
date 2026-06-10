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
import { fuzzyMatchHeaders, applyMappings, isCurriculumFormat, SUBJECT_BANK_FIELDS } from '../../services/header-mapper'
import type { ColumnMapping } from '../../services/header-mapper'

// ── Excel Template Definitions ────────────────────────────────
interface TemplateColumn {
  key: string
  header: string
  width: number
  required: boolean
  description: string
  validValues?: string[]
  example: string
}

const TEMPLATE_DEFS: Record<string, { title: string; columns: TemplateColumn[] }> = {
  ROOMS: {
    title: 'Room Import Template',
    columns: [
      { key: 'room_code', header: 'Room Code', width: 15, required: true, description: 'Unique identifier for the room (e.g., RM-101). Used for duplicate detection.', example: 'RM-101' },
      { key: 'room_name', header: 'Room Name', width: 25, required: true, description: 'Descriptive name of the room.', example: 'Computer Laboratory 1' },
      { key: 'building', header: 'Building', width: 20, required: false, description: 'Building where the room is located.', example: 'Main Building' },
      { key: 'floor', header: 'Floor', width: 10, required: false, description: 'Floor number or level.', example: '2nd Floor' },
      { key: 'capacity', header: 'Capacity', width: 12, required: false, description: 'Maximum number of students. Defaults to 30 if empty.', example: '40' },
      { key: 'room_type', header: 'Room Type', width: 18, required: false, description: 'Type of room (free text). Examples: Lecture Hall, Computer Lab, Science Lab, Gymnasium, etc.', example: 'Computer Lab' },
      { key: 'department_availability', header: 'Dept. Availability', width: 20, required: false, description: 'Which department can use this room. Defaults to SHARED.', validValues: ['SHS_ONLY', 'COLLEGE_ONLY', 'SHARED'], example: 'SHARED' }
    ]
  },
  PERSONNEL: {
    title: 'Personnel Import Template',
    columns: [
      { key: 'employee_id', header: 'Employee ID', width: 16, required: true, description: 'Unique employee identifier. Used for duplicate detection.', example: 'EMP-001' },
      { key: 'first_name', header: 'First Name', width: 18, required: true, description: 'First name of the employee.', example: 'Juan' },
      { key: 'last_name', header: 'Last Name', width: 18, required: true, description: 'Last name of the employee.', example: 'Dela Cruz' },
      { key: 'email', header: 'Email', width: 28, required: false, description: 'Email address of the employee.', example: 'juan.delacruz@school.edu.ph' },
      { key: 'department', header: 'Department', width: 14, required: false, description: 'Department assignment. Defaults to SHS if empty.', validValues: ['SHS', 'COLLEGE'], example: 'COLLEGE' },
      { key: 'personnel_type', header: 'Personnel Type', width: 16, required: false, description: 'Employment type. Defaults to FACULTY if empty.', validValues: ['FACULTY', 'STAFF', 'ADMIN'], example: 'FACULTY' },
      { key: 'specializations', header: 'Specializations', width: 30, required: false, description: 'JSON array of specializations. Leave empty or use format: ["Math","Science"]', example: '["Mathematics","Physics"]' },
      { key: 'max_weekly_hours', header: 'Max Weekly Hours', width: 18, required: false, description: 'Maximum teaching hours per week. Defaults to 40 if empty.', example: '40' }
    ]
  },
  SECTIONS: {
    title: 'Section Import Template',
    columns: [
      { key: 'section_code', header: 'Section Code', width: 16, required: true, description: 'Unique section identifier (e.g., BSIT-1A). Used for duplicate detection.', example: 'BSIT-1A' },
      { key: 'section_name', header: 'Section Name', width: 22, required: false, description: 'Display name for the section.', example: 'BSIT 1st Year Section A' },
      { key: 'department', header: 'Department', width: 14, required: false, description: 'Department. Defaults to active department context if empty.', validValues: ['SHS', 'COLLEGE'], example: 'COLLEGE' },
      { key: 'strand_track', header: 'Strand/Track', width: 16, required: false, description: 'SHS strand or track. Only applicable for SHS sections.', validValues: ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL-ICT', 'TVL-HE', 'TVL-AFA', 'TVL-IA', 'SPORTS', 'ARTS_DESIGN', 'MARITIME'], example: 'STEM' },
      { key: 'subject', header: 'Subject', width: 22, required: false, description: 'Assigned subject for this section.', example: 'General Mathematics' },
      { key: 'course_program', header: 'Course/Program', width: 20, required: false, description: 'College course or program code.', example: 'BSIT' },
      { key: 'year_level', header: 'Year Level', width: 14, required: false, description: 'Year or grade level.', validValues: ['Grade 11', 'Grade 12', '1st Year', '2nd Year', '3rd Year', '4th Year'], example: '1st Year' },
      { key: 'student_count', header: 'Student Count', width: 15, required: false, description: 'Number of enrolled students. Defaults to 0 if empty.', example: '35' }
    ]
  },
  SUBJECT_BANK: {
    title: 'Subject Bank Import Template',
    columns: [
      { key: 'subject_code', header: 'Subject Code', width: 16, required: false, description: 'Subject code identifier (e.g., IT101). Optional.', example: 'IT101' },
      { key: 'subject_name', header: 'Subject Name', width: 32, required: true, description: 'Full name of the subject. Required field.', example: 'Introduction to Computing' },
      { key: 'course_program', header: 'Course/Program', width: 18, required: false, description: 'Course or program this subject belongs to.', example: 'BSIT' },
      { key: 'year_level', header: 'Year Level', width: 14, required: false, description: 'Year level for this subject.', validValues: ['Grade 11', 'Grade 12', '1st Year', '2nd Year', '3rd Year', '4th Year'], example: '1st Year' },
      { key: 'semester_type', header: 'Semester', width: 12, required: false, description: 'Which semester this subject is offered.', validValues: ['1ST', '2ND', 'SUMMER'], example: '1ST' },
      { key: 'lec_units', header: 'Lec Units', width: 12, required: false, description: 'Number of lecture units. Defaults to 0.', example: '3' },
      { key: 'lab_units', header: 'Lab Units', width: 12, required: false, description: 'Number of laboratory units. Defaults to 0.', example: '1' },
      { key: 'pre_requisites', header: 'Pre-requisites', width: 24, required: false, description: 'Pre-requisite subjects (comma-separated or free text).', example: 'None' }
    ]
  },
  CALENDAR_EVENTS: {
    title: 'Calendar Events Import Template',
    columns: [
      { key: 'title', header: 'Title', width: 28, required: true, description: 'Name/title of the calendar event.', example: 'Midterm Examination Week' },
      { key: 'event_type', header: 'Event Type', width: 16, required: false, description: 'Type of event. Defaults to CUSTOM if empty.', validValues: ['HOLIDAY', 'EXAM_PERIOD', 'ENROLLMENT', 'CUSTOM'], example: 'EXAM_PERIOD' },
      { key: 'is_blocking', header: 'Is Blocking', width: 12, required: false, description: 'Whether event blocks scheduling. Use true/false or 1/0.', validValues: ['true', 'false'], example: 'true' },
      { key: 'is_all_day', header: 'Is All Day', width: 12, required: false, description: 'Whether event spans the entire day. Use true/false or 1/0.', validValues: ['true', 'false'], example: 'true' },
      { key: 'start_datetime', header: 'Start Date/Time', width: 22, required: true, description: 'Start date/time in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM).', example: '2026-03-15' },
      { key: 'end_datetime', header: 'End Date/Time', width: 22, required: true, description: 'End date/time in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM).', example: '2026-03-21' },
      { key: 'description', header: 'Description', width: 36, required: false, description: 'Additional description or notes for the event.', example: 'Midterm exams for all departments' }
    ]
  }
}

// Keep CSV templates for backward compatibility with import parsing
const TEMPLATES: Record<string, string> = {
  PERSONNEL: 'employee_id,first_name,last_name,email,department,personnel_type,specializations,max_weekly_hours\n',
  SECTIONS: 'section_code,section_name,department,strand_track,subject,course_program,year_level,student_count\n',
  ROOMS: 'room_code,room_name,building,floor,capacity,room_type,department_availability\n',
  CALENDAR_EVENTS: 'title,event_type,is_blocking,is_all_day,start_datetime,end_datetime,description\n',
  SUBJECT_BANK: 'subject_code,subject_name,course_program,year_level,semester_type,lec_units,lab_units,pre_requisites\n'
}

/** Build a formatted Excel template workbook for a given import target */
async function buildTemplateWorkbook(target: string): Promise<ExcelJS.Workbook> {
  const def = TEMPLATE_DEFS[target]
  if (!def) throwError(ERROR_CODES.VALIDATION_ERROR, `No template definition for: ${target}`)

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Schedule Management System'
  wb.created = new Date()

  // ── Color palette ──
  const COLOR_HEADER_BG = 'FF2B579A'      // Dark blue header
  const COLOR_HEADER_FONT = 'FFFFFFFF'     // White text
  const COLOR_REQUIRED_BG = 'FFFFF2CC'     // Light yellow for required columns
  const COLOR_EXAMPLE_BG = 'FFF2F2F2'      // Light gray for example row
  const COLOR_TITLE_BG = 'FF1F4E79'        // Deep navy for title
  const COLOR_INSTR_HEADER = 'FF2B579A'    // Matching blue for instructions
  const COLOR_REQ_BADGE = 'FFDC3545'       // Red for required badge
  const COLOR_OPT_BADGE = 'FF6C757D'       // Gray for optional badge
  const COLOR_VALID_BG = 'FFE8F5E9'        // Light green for valid values

  const THIN_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' }
  }

  // ── Data Sheet ────────────────────────────────
  const ws = wb.addWorksheet('Data', {
    properties: { tabColor: { argb: COLOR_HEADER_BG } }
  })

  // Set column widths
  ws.columns = def.columns.map(col => ({ width: col.width }))

  // Row 1: Title bar (merged across all columns)
  const titleRow = ws.getRow(1)
  ws.mergeCells(1, 1, 1, def.columns.length)
  const titleCell = ws.getCell(1, 1)
  titleCell.value = `📋  ${def.title}`
  titleCell.font = { bold: true, size: 14, name: 'Calibri', color: { argb: COLOR_HEADER_FONT } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TITLE_BG } }
  titleCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  titleRow.height = 36

  // Row 2: Subtitle/instructions
  const subtitleRow = ws.getRow(2)
  ws.mergeCells(2, 1, 2, def.columns.length)
  const subtitleCell = ws.getCell(2, 1)
  subtitleCell.value = '⚠️  Fill in your data starting from Row 5. Row 4 is an example row — delete or overwrite it. Required columns are highlighted in yellow.'
  subtitleCell.font = { size: 10, name: 'Calibri', italic: true, color: { argb: 'FF666666' } }
  subtitleCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true }
  subtitleRow.height = 28

  // Row 3: Column headers
  const headerRow = ws.getRow(3)
  headerRow.height = 28
  for (let c = 0; c < def.columns.length; c++) {
    const col = def.columns[c]
    const cell = ws.getCell(3, c + 1)
    cell.value = col.header + (col.required ? ' *' : '')
    cell.font = { bold: true, size: 11, name: 'Calibri', color: { argb: COLOR_HEADER_FONT } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = THIN_BORDER
  }

  // Row 4: Example data row
  const exampleRow = ws.getRow(4)
  exampleRow.height = 22
  for (let c = 0; c < def.columns.length; c++) {
    const col = def.columns[c]
    const cell = ws.getCell(4, c + 1)
    cell.value = col.example
    cell.font = { size: 10, name: 'Calibri', italic: true, color: { argb: 'FF888888' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_EXAMPLE_BG } }
    cell.alignment = { horizontal: 'left', vertical: 'middle' }
    cell.border = THIN_BORDER
  }

  // Apply data validation dropdowns for columns with valid values (rows 4-1000)
  for (let c = 0; c < def.columns.length; c++) {
    const col = def.columns[c]
    if (col.validValues && col.validValues.length > 0) {
      const colLetter = String.fromCharCode(65 + c) // A=65
      ws.dataValidations.add(`${colLetter}4:${colLetter}1000`, {
        type: 'list',
        allowBlank: !col.required,
        formulae: [`"${col.validValues.join(',')}"`],
        showErrorMessage: true,
        errorTitle: 'Invalid Value',
        error: `Please select one of: ${col.validValues.join(', ')}`,
        showInputMessage: true,
        promptTitle: col.header,
        prompt: `Valid values: ${col.validValues.join(', ')}`
      })
    }
  }

  // Highlight required columns in data area (rows 5-1000, subtle yellow bg)
  for (let c = 0; c < def.columns.length; c++) {
    if (def.columns[c].required) {
      for (let r = 5; r <= 10; r++) {
        const cell = ws.getCell(r, c + 1)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_REQUIRED_BG } }
        cell.border = {
          top: { style: 'hair', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'hair', color: { argb: 'FFDDDDDD' } },
          left: { style: 'hair', color: { argb: 'FFDDDDDD' } },
          right: { style: 'hair', color: { argb: 'FFDDDDDD' } }
        }
      }
    }
  }

  // Freeze panes: freeze header rows so they stay visible while scrolling
  ws.views = [{ state: 'frozen', ySplit: 3, activeCell: 'A5' }]

  // Auto-filter on header row
  ws.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: def.columns.length }
  }

  // ── Instructions Sheet ────────────────────────────
  const instrWs = wb.addWorksheet('Instructions', {
    properties: { tabColor: { argb: 'FF28A745' } }
  })

  // Column widths: [#, Column Name, Required?, Description, Valid Values]
  instrWs.columns = [
    { width: 5 },   // A - #
    { width: 22 },  // B - Column Name
    { width: 12 },  // C - Required
    { width: 55 },  // D - Description
    { width: 40 }   // E - Valid Values
  ]

  // Row 1: Title
  instrWs.mergeCells(1, 1, 1, 5)
  const instrTitle = instrWs.getCell(1, 1)
  instrTitle.value = `📖  ${def.title} — Column Guide`
  instrTitle.font = { bold: true, size: 14, name: 'Calibri', color: { argb: COLOR_HEADER_FONT } }
  instrTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TITLE_BG } }
  instrTitle.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  instrWs.getRow(1).height = 36

  // Row 2: Quick tips
  instrWs.mergeCells(2, 1, 2, 5)
  const tipsCell = instrWs.getCell(2, 1)
  tipsCell.value = 'Tips: Enter data in the "Data" sheet starting from Row 5. Row 4 is a sample row. Columns marked with * are required. Dropdown lists are provided where applicable.'
  tipsCell.font = { size: 10, name: 'Calibri', italic: true, color: { argb: 'FF666666' } }
  tipsCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true }
  instrWs.getRow(2).height = 26

  // Row 3: spacer
  instrWs.getRow(3).height = 8

  // Row 4: Column headers for instruction table
  const instrHeaders = ['#', 'Column Name', 'Required', 'Description', 'Valid Values']
  const instrHeaderRow = instrWs.getRow(4)
  instrHeaderRow.height = 26
  for (let c = 0; c < instrHeaders.length; c++) {
    const cell = instrWs.getCell(4, c + 1)
    cell.value = instrHeaders[c]
    cell.font = { bold: true, size: 11, name: 'Calibri', color: { argb: COLOR_HEADER_FONT } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_INSTR_HEADER } }
    cell.alignment = { horizontal: c === 0 ? 'center' : 'left', vertical: 'middle' }
    cell.border = THIN_BORDER
  }

  // Rows 5+: One row per column definition
  for (let i = 0; i < def.columns.length; i++) {
    const col = def.columns[i]
    const r = i + 5

    // # column
    const numCell = instrWs.getCell(r, 1)
    numCell.value = i + 1
    numCell.font = { size: 10, name: 'Calibri', color: { argb: 'FF666666' } }
    numCell.alignment = { horizontal: 'center', vertical: 'middle' }
    numCell.border = THIN_BORDER

    // Column Name
    const nameCell = instrWs.getCell(r, 2)
    nameCell.value = col.header
    nameCell.font = { bold: true, size: 10, name: 'Calibri' }
    nameCell.alignment = { vertical: 'middle' }
    nameCell.border = THIN_BORDER

    // Required badge
    const reqCell = instrWs.getCell(r, 3)
    reqCell.value = col.required ? 'REQUIRED' : 'Optional'
    reqCell.font = {
      bold: col.required,
      size: 9,
      name: 'Calibri',
      color: { argb: col.required ? COLOR_REQ_BADGE : COLOR_OPT_BADGE }
    }
    reqCell.alignment = { horizontal: 'center', vertical: 'middle' }
    reqCell.border = THIN_BORDER
    if (col.required) {
      reqCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0F0' } }
    }

    // Description
    const descCell = instrWs.getCell(r, 4)
    descCell.value = col.description
    descCell.font = { size: 10, name: 'Calibri' }
    descCell.alignment = { vertical: 'middle', wrapText: true }
    descCell.border = THIN_BORDER

    // Valid Values
    const valCell = instrWs.getCell(r, 5)
    valCell.value = col.validValues ? col.validValues.join(', ') : '—'
    valCell.font = { size: 10, name: 'Calibri', color: { argb: col.validValues ? 'FF2E7D32' : 'FFAAAAAA' } }
    valCell.alignment = { vertical: 'middle', wrapText: true }
    valCell.border = THIN_BORDER
    if (col.validValues) {
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_VALID_BG } }
    }

    instrWs.getRow(r).height = 24
  }

  // Freeze header row in instructions
  instrWs.views = [{ state: 'frozen', ySplit: 4, activeCell: 'A5' }]

  // ── Print setup for both sheets ──
  for (const sheet of [ws, instrWs]) {
    sheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
    }
  }

  return wb
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

/** Build a reverse map from display header → raw key for template-format Excel files */
function buildHeaderKeyMap(): Map<string, string> {
  const map = new Map<string, string>()
  for (const def of Object.values(TEMPLATE_DEFS)) {
    for (const col of def.columns) {
      // Map display header (with and without the * required marker) to key
      map.set(col.header.toLowerCase(), col.key)
      map.set((col.header + ' *').toLowerCase(), col.key)
      // Also map key to itself for compatibility
      map.set(col.key.toLowerCase(), col.key)
    }
  }
  return map
}

const HEADER_KEY_MAP = buildHeaderKeyMap()

/** Extract string value from an ExcelJS cell */
function cellToString(cell: ExcelJS.Cell): string {
  const val = cell.value
  if (val === null || val === undefined) return ''
  if (typeof val === 'object' && 'richText' in (val as object)) {
    return ((val as { richText: Array<{ text: string }> }).richText || []).map(rt => rt.text).join('').trim()
  }
  if (typeof val === 'object' && 'result' in (val as object)) {
    return String((val as { result: unknown }).result ?? '').trim()
  }
  if (val instanceof Date) return val.toISOString().split('T')[0]
  return String(val).trim()
}

/** Parse Excel file (xlsx/xls), returning header array and row objects.
 *  Auto-detects the header row (supports both plain files with headers on row 1
 *  and our formatted template files with headers on row 3). */
async function parseExcel(filePath: string): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(filePath)

  // Use the first sheet, or the "Data" sheet if the file is our template format
  let ws = wb.worksheets.find(s => s.name === 'Data') ?? wb.worksheets[0]
  if (!ws || ws.rowCount < 2) throwError(ERROR_CODES.VALIDATION_ERROR, 'Excel file has no data rows.')

  // Auto-detect header row: scan rows 1-10, pick the row with the most recognized column headers
  let headerRowNum = 1
  let bestMatchCount = 0
  const allTemplateKeys = new Set<string>()
  for (const def of Object.values(TEMPLATE_DEFS)) {
    for (const col of def.columns) {
      allTemplateKeys.add(col.key.toLowerCase())
      allTemplateKeys.add(col.header.toLowerCase())
      allTemplateKeys.add((col.header + ' *').toLowerCase())
    }
  }

  for (let r = 1; r <= Math.min(10, ws.rowCount); r++) {
    const row = ws.getRow(r)
    let matchCount = 0
    let cellCount = 0
    row.eachCell({ includeEmpty: false }, (cell) => {
      const val = cellToString(cell).toLowerCase()
      if (val && allTemplateKeys.has(val)) matchCount++
      if (val) cellCount++
    })
    // Require at least 2 matches and more matches than previous best
    if (matchCount >= 2 && matchCount > bestMatchCount) {
      bestMatchCount = matchCount
      headerRowNum = r
    }
    // If no template matches found, fall back to first row with 2+ non-empty cells
    if (bestMatchCount === 0 && cellCount >= 2 && headerRowNum === 1) {
      // Keep row 1 as default unless we find a better match
    }
  }

  // Extract headers from detected row
  const rawRow = ws.getRow(headerRowNum)
  const headers: string[] = []
  rawRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const rawVal = cellToString(cell).toLowerCase()
    // Map display headers to raw keys (e.g., "Room Code *" → "room_code")
    const mapped = HEADER_KEY_MAP.get(rawVal) ?? rawVal
    headers[colNumber - 1] = mapped
  })
  // Remove trailing empty headers
  while (headers.length > 0 && !headers[headers.length - 1]) headers.pop()

  // Data rows start after the header row
  const dataStartRow = headerRowNum + 1
  const rows: Record<string, string>[] = []
  for (let r = dataStartRow; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    let hasData = false
    const obj: Record<string, string> = {}
    for (let c = 0; c < headers.length; c++) {
      const str = cellToString(row.getCell(c + 1))
      obj[headers[c]] = str
      if (str) hasData = true
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

/**
 * Parse a structured curriculum document (Excel, PDF text, DOCX text).
 * Handles files with FIRST YEAR / SECOND YEAR sections,
 * 1st/2nd Semester subsections, and COURSES | LEC | LAB | UNITS columns.
 * Extracts program name from header lines (e.g. "BACHELOR OF SCIENCE IN INFORMATION SYSTEMS (BSIS)").
 *
 * Works with both side-by-side Excel layouts AND linear DOCX/PDF text output.
 */
function parseCurriculumFormat(allCells: string[][]): { headers: string[]; rows: Record<string, string>[] } {
  const subjects: Record<string, string>[] = []
  let currentYear = ''
  let currentSem = ''
  let programName = ''

  // Year markers
  const yearPatterns: [RegExp, string][] = [
    [/\bfourth\s+year\b/i, '4th Year'], [/\b4th\s+year\b/i, '4th Year'],
    [/\bthird\s+year\b/i, '3rd Year'], [/\b3rd\s+year\b/i, '3rd Year'],
    [/\bsecond\s+year\b/i, '2nd Year'], [/\b2nd\s+year\b/i, '2nd Year'],
    [/\bfirst\s+year\b/i, '1st Year'], [/\b1st\s+year\b/i, '1st Year'],
  ]

  // Flatten all cell text for scanning
  const allText = allCells.map(row => row.filter(Boolean).join(' ').trim())

  // Scan for program name in the first ~20 rows
  for (let r = 0; r < Math.min(allText.length, 20); r++) {
    const line = allText[r]
    // Look for "BACHELOR OF ..." with abbreviation in parens
    const bachelorMatch = line.match(/\b(BACHELOR\s+OF\s+[A-Z][A-Z\s]+?)(?:\s*\(([A-Z]{2,10})\))?(?:\s*Effective|\s*CHED|\s*$)/i)
    if (bachelorMatch) {
      programName = bachelorMatch[2] || bachelorMatch[1].trim()
      break
    }
    // Short program codes
    if (!programName) {
      const codeMatch = line.match(/\b(BS[A-Z]{1,8}|AB[A-Z]{1,8}|BA[A-Z]{1,8})\b/)
      if (codeMatch) programName = codeMatch[1]
    }
  }

  // Process each line/row
  for (let r = 0; r < allCells.length; r++) {
    const cells = allCells[r]
    const rowText = cells.filter(Boolean).join(' ').trim()
    const rowLower = rowText.toLowerCase()

    // Detect year marker
    for (const [pattern, yearVal] of yearPatterns) {
      if (pattern.test(rowText)) {
        currentYear = yearVal
        currentSem = '' // reset semester when year changes
        break
      }
    }

    // Detect semester marker
    if (/semester/i.test(rowText)) {
      if (/2nd|second/i.test(rowText)) currentSem = '2ND'
      else if (/summer|midyear/i.test(rowText)) currentSem = 'SUMMER'
      else if (/1st|first/i.test(rowText)) currentSem = '1ST'
    }

    // Skip non-subject rows
    if (!currentYear || !currentSem) continue
    if (/total\s*units/i.test(rowLower)) continue
    if (/^\s*courses?\s*$/i.test(rowLower)) continue
    if (/^(no\.\s*of|per\s*week|lec|lab|units?)\s*$/i.test(rowLower)) continue
    if (/^\s*(courses?|no\.?\s*of\s*hours)/i.test(rowLower) && rowLower.length < 40) continue

    // Extract subject: look for a text name + trailing numbers
    // Cells may be: ["Purposive Communication", "3", "", "3"]
    // Or combined text: "Purposive Communication 3 3"
    let courseName = ''
    const numericVals: number[] = []

    for (const cell of cells) {
      const trimmed = cell.trim()
      if (!trimmed) continue
      // Check if this cell is purely numeric
      if (/^\d+(\.\d+)?$/.test(trimmed)) {
        numericVals.push(parseFloat(trimmed))
      } else {
        // Could be a mixed cell like "Purposive Communication 3 3"
        // Try to separate trailing numbers
        const match = trimmed.match(/^(.+?)\s+((?:\d+\s*)+)$/)
        if (match && match[1].length > 2) {
          if (!courseName) courseName = match[1].trim()
          const nums = match[2].trim().split(/\s+/)
          for (const n of nums) {
            if (/^\d+$/.test(n)) numericVals.push(parseInt(n))
          }
        } else if (!courseName && trimmed.length > 2 && !/^(lec|lab|units|no\.|per|of|hours|week|courses?)$/i.test(trimmed)) {
          courseName = trimmed
        }
      }
    }

    // Validate: must have a course name at least 3 chars, not a label
    if (!courseName || courseName.length < 3) continue
    if (/^(total|courses?|no\.\s*of|semester|lec\b|lab\b|units?\b|per\s*week)/i.test(courseName)) continue
    // Skip year/semester label rows that leaked through
    if (/^(first|second|third|fourth|1st|2nd|3rd|4th)\s+(year|semester)/i.test(courseName)) continue

    // Parse LEC and LAB from numeric values
    let lec = 0, lab = 0
    if (numericVals.length >= 3) {
      // Pattern: LEC, LAB, UNITS (total)
      lec = numericVals[0]; lab = numericVals[1]
    } else if (numericVals.length === 2) {
      // Could be LEC, UNITS (no lab) or LEC, LAB
      lec = numericVals[0]; lab = 0
    } else if (numericVals.length === 1) {
      lec = numericVals[0]
    }

    subjects.push({
      subject_code: '', subject_name: courseName,
      course_program: programName, year_level: currentYear,
      semester_type: currentSem, lec_units: String(lec), lab_units: String(lab),
      pre_requisites: ''
    })
  }

  const headers = ['subject_code', 'subject_name', 'course_program', 'year_level', 'semester_type', 'lec_units', 'lab_units', 'pre_requisites']
  return { headers, rows: subjects }
}

/**
 * Extract all cells from an Excel file as a 2D string array (raw cell data, no header assumption).
 */
async function extractExcelRawCells(filePath: string): Promise<string[][]> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(filePath)
  const ws = wb.worksheets[0]
  if (!ws) return []

  const allCells: string[][] = []
  for (let r = 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const cells: string[] = []
    for (let c = 1; c <= (ws.columnCount || 20); c++) {
      const cell = row.getCell(c)
      const val = cell.value
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
      cells.push(str.trim())
    }
    allCells.push(cells)
  }
  return allCells
}

/**
 * Extract all cells from a DOCX file as a 2D array using HTML table parsing.
 * Preserves table row/column structure that extractRawText loses.
 */
async function extractDocxRawCells(filePath: string): Promise<string[][]> {
  const buffer = readFileSync(filePath)
  const result = await mammoth.convertToHtml({ buffer })
  const html = result.value

  const allCells: string[][] = []

  // Split HTML into chunks: text blocks and table rows
  // First, extract all non-table text (for year/semester/program markers)
  const withoutTables = html.replace(/<table[\s\S]*?<\/table>/gi, '\n---TABLE_BREAK---\n')
  const textParts = withoutTables.replace(/<[^>]+>/g, ' ').split(/\n/).map(l => l.replace(/&[a-z]+;/gi, ' ').trim()).filter(Boolean)
  
  // Process text lines (for headers, year markers, semester markers)
  let tableIndex = 0
  for (const part of textParts) {
    if (part === '---TABLE_BREAK---') {
      // Insert table rows here
      const tableMatches = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)]
      if (tableIndex < tableMatches.length) {
        const tableHtml = tableMatches[tableIndex][0]
        const rowMatches = [...tableHtml.matchAll(/<tr[\s\S]*?<\/tr>/gi)]
        for (const rm of rowMatches) {
          const cellMatches = [...rm[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)]
          const cells = cellMatches.map(m => m[1].replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim())
          if (cells.some(c => c.length > 0)) allCells.push(cells)
        }
        tableIndex++
      }
    } else if (part.length > 1) {
      // Non-table text line (may contain year/semester/program markers)
      allCells.push([part])
    }
  }

  // If no tables were found via the split approach, try extracting all tables directly
  if (tableIndex === 0) {
    const tableMatches = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)]
    for (const tm of tableMatches) {
      const rowMatches = [...tm[0].matchAll(/<tr[\s\S]*?<\/tr>/gi)]
      for (const rm of rowMatches) {
        const cellMatches = [...rm[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)]
        const cells = cellMatches.map(m => m[1].replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim())
        if (cells.some(c => c.length > 0)) allCells.push(cells)
      }
    }
    // Also add text lines before/between tables
    for (const part of textParts) {
      if (part !== '---TABLE_BREAK---' && part.length > 1) {
        allCells.unshift([part])
      }
    }
  }

  return allCells
}

/**
 * Extract all cells from a text-based file (PDF text, CSV text) as a 2D array.
 */
function extractTextRawCells(text: string): string[][] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  return lines.map(line => {
    // Split by tab first, then by 2+ spaces
    if (line.includes('\t')) return line.split('\t').map(s => s.trim())
    return line.split(/\s{2,}/).map(s => s.trim())
  })
}

export function registerImportHandlers(): void {
  // Download formatted Excel template
  registerHandler(IPC_CHANNELS.IMPORTS_DOWNLOAD_TEMPLATE, async (args) => {
    const { target } = args as { target: ImportTarget }
    if (!TEMPLATE_DEFS[target]) throwError(ERROR_CODES.VALIDATION_ERROR, `Unknown import target: ${target}`)

    const result = await dialog.showSaveDialog({
      title: 'Save Import Template',
      defaultPath: `${target.toLowerCase()}_template.xlsx`,
      filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
    })
    if (result.canceled || !result.filePath) return { success: false }

    const wb = await buildTemplateWorkbook(target)
    const buffer = await wb.xlsx.writeBuffer()
    writeFileSync(result.filePath, Buffer.from(buffer))
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

    // ===== SUBJECT_BANK: Smart detection flow =====
    if (target === 'SUBJECT_BANK') {
      // Step 1: Check if this looks like a curriculum-format document
      let rawCells: string[][]
      if (ext === 'xlsx' || ext === 'xls') {
        rawCells = await extractExcelRawCells(filePath)
      } else if (ext === 'docx') {
        rawCells = await extractDocxRawCells(filePath)
      } else if (ext === 'pdf') {
        const buffer = readFileSync(filePath)
        const data = await pdfParse(buffer)
        rawCells = extractTextRawCells(data.text)
      } else {
        const rawContent = readFileSync(filePath, 'utf-8')
        rawCells = extractTextRawCells(stripBom(rawContent))
      }

      if (isCurriculumFormat(rawCells)) {
        const curriculum = parseCurriculumFormat(rawCells)
        if (curriculum.rows.length > 0) {
          // Curriculum format detected and parsed successfully — skip mapping step
          const numberedRows = curriculum.rows.map((row, i) => ({ row_number: i + 2, ...row }))
          return {
            success: true,
            target,
            format: 'curriculum' as const,
            file_name: filePath.split(/[/\\]/).pop() ?? '',
            total_rows: numberedRows.length,
            preview: numberedRows.slice(0, 10),
            headers: curriculum.headers,
            department, academic_year_id, semester_id,
            parsed: numberedRows
          }
        }
        // Curriculum markers found but no subjects extracted — fall through to tabular mapping
      }

      // Step 2: Check for exact header matches first (standard template headers)
      const matchedHeaders = expectedHeaders.filter(eh => headers.includes(eh))
      if (matchedHeaders.length >= 2) {
        // Enough standard headers found — use direct mapping (existing behavior)
        const numberedRows = rows.map((row, i) => ({ row_number: i + 2, ...row }))
        return {
          success: true,
          target,
          format: 'direct' as const,
          file_name: filePath.split(/[/\\]/).pop() ?? '',
          total_rows: numberedRows.length,
          preview: numberedRows.slice(0, 10),
          headers,
          department, academic_year_id, semester_id,
          parsed: numberedRows
        }
      }

      // Step 3: Fuzzy match headers — return mappings for user review
      const columnMappings = fuzzyMatchHeaders(headers, SUBJECT_BANK_FIELDS)

      // Include sample values from first row for context in the mapping UI
      const sampleValues: Record<string, string> = {}
      if (rows.length > 0) {
        for (const h of headers) {
          sampleValues[h] = rows[0][h] ?? ''
        }
      }

      const numberedRows = rows.map((row, i) => ({ row_number: i + 2, ...row }))
      return {
        success: true,
        target,
        format: 'tabular' as const,
        file_name: filePath.split(/[/\\]/).pop() ?? '',
        total_rows: numberedRows.length,
        preview: numberedRows.slice(0, 10),
        headers,
        column_mappings: columnMappings,
        target_fields: SUBJECT_BANK_FIELDS,
        sample_values: sampleValues,
        department, academic_year_id, semester_id,
        parsed: numberedRows
      }
    }

    // ===== Non-Subject-Bank targets: existing strict header validation =====
    const matchedHeaders = expectedHeaders.filter(eh => headers.includes(eh))
    if (matchedHeaders.length === 0) {
      throwError(ERROR_CODES.INVALID_HEADERS, `No recognized headers found. Expected at least some of: ${expectedHeaders.join(', ')}`)
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
            // --- Column alias mapping: accept common alternative header names ---
            const code = row.subject_code || row.code || row.subj_code || row.course_code || ''
            const name = row.subject_name || row.subject_title || row.title || row.descriptive_title || row.description_title || row.name || ''
            const curriculum = row.course_program || row.curriculum || row.program || row.course || ''
            const yearRaw = row.year_level || row.year || row.yr_level || row.yr || ''
            const semRaw = row.semester_type || row.semester || row.sem || row.sem_type || ''
            const desc = row.description || row.desc || ''
            const lecRaw = row.lec_units || row.lec || row.lecture || row.lecture_units || '0'
            const labRaw = row.lab_units || row.lab || row.laboratory || row.laboratory_units || '0'
            const prereq = row.pre_requisites || row.prerequisites || row.prereq || row.pre_req || ''

            // --- Normalize semester value ---
            const semLower = semRaw.toString().toLowerCase().replace(/[^a-z0-9]/g, '')
            let semType = '1ST'
            if (/^(2|second|2nd)/.test(semLower)) semType = '2ND'
            else if (/^(sum|mid|3|third)/.test(semLower)) semType = 'SUMMER'
            else if (/^(1|first|1st)/.test(semLower)) semType = '1ST'

            // Skip rows missing subject name (the only truly critical field)
            if (!name.trim()) { skipped++; continue }

            const finalCode = code.trim()
            const deptVal = row.department || department || 'COLLEGE'
            const yearVal = yearRaw.trim() || '1st Year'

            // Dedup: match by name + curriculum + year + semester + department
            const existing = db.prepare('SELECT id FROM subject_bank WHERE subject_name = ? AND course_program = ? AND year_level = ? AND semester_type = ? AND department = ? AND is_active = 1').get(
              name.trim(), curriculum.trim(), yearVal, semType, deptVal
            ) as { id: string } | undefined
            if (existing) {
              db.prepare("UPDATE subject_bank SET subject_code = CASE WHEN ? = '' THEN subject_code ELSE ? END, description = ?, lec_units = ?, lab_units = ?, pre_requisites = ?, updated_at = datetime('now') WHERE id = ?").run(
                finalCode, finalCode, desc.trim() || null, parseInt(lecRaw, 10) || 0, parseInt(labRaw, 10) || 0, prereq.trim() || null, existing.id
              )
              updated++
            } else {
              db.prepare("INSERT INTO subject_bank (id, subject_code, subject_name, description, course_program, year_level, semester_type, lec_units, lab_units, pre_requisites, department, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))").run(
                randomUUID(), finalCode, name.trim(), desc.trim() || null, curriculum.trim(), yearVal, semType, parseInt(lecRaw, 10) || 0, parseInt(labRaw, 10) || 0, prereq.trim() || null, deptVal
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
