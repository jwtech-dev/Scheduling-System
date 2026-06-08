// Export Handlers — TASK-21
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { dialog } from 'electron'
import { writeFile } from 'fs/promises'
import { getDatabase } from '../../database/connection'
import type { Department } from '../../../shared/types'

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

  registerHandler(IPC_CHANNELS.EXPORTS_EXAM_SCHEDULE, async (args) => {
    const { department, semester_id } = args as { department?: Department; semester_id?: string }
    const db = getDatabase()
    const conditions: string[] = ["se.activity_type = 'EXAM'", 'se.is_active = 1']
    const params: unknown[] = []
    if (department) { conditions.push('se.department = ?'); params.push(department) }
    if (semester_id) { conditions.push('se.semester_id = ?'); params.push(semester_id) }

    // Fetch exam entries with joined data
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

    // Fetch all sections for resolving IDs
    const allSections = db.prepare(
      'SELECT id, section_code, course_program, year_level FROM sections WHERE is_active = 1'
    ).all() as Array<{ id: string; section_code: string; course_program: string | null; year_level: string | null }>
    const sectionMap = new Map(allSections.map(s => [s.id, s]))

    // Helper: format time to 12h (e.g. "13:00" → "1PM")
    const to12h = (t: string): string => {
      const [h, m] = t.split(':').map(Number)
      const period = h >= 12 ? 'PM' : 'AM'
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
      return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, '0')}${period}`
    }

    // Helper: format proctor name (e.g. "Mr. JOHN JASON ABONALLA, LPT")
    const formatProctor = (row: Record<string, unknown>): string => {
      if (!row.p_last) return ''
      const parts: string[] = []
      if (row.p_honorific) parts.push(String(row.p_honorific))
      parts.push(`${String(row.p_first ?? '').toUpperCase()} ${String(row.p_last).toUpperCase()}`)
      let name = parts.join(' ')
      if (row.p_credentials) name += `, ${String(row.p_credentials)}`
      return name
    }

    // Helper: get day abbreviation from date string
    const getDayAbbr = (dateStr: string): string => {
      const d = new Date(dateStr + 'T00:00:00')
      return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()] ?? ''
    }

    // Helper: format exam type for display
    const formatExamType = (et: unknown): string => {
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

    // Helper: format semester type for display
    const formatSemester = (st: unknown, ayLabel: unknown): string => {
      const semMap: Record<string, string> = {
        '1ST_SEMESTER': 'FIRST SEMESTER',
        '2ND_SEMESTER': 'SECOND SEMESTER',
        'SUMMER': 'SUMMER'
      }
      const semStr = semMap[String(st ?? '')] ?? String(st ?? '')
      return ayLabel ? `${semStr} (${ayLabel})` : semStr
    }

    // Escape CSV value
    const esc = (v: unknown): string => {
      const s = String(v ?? '')
      return s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')
        ? `"${s.replace(/"/g, '""')}"`
        : s
    }

    // Group entries by section. Each entry can reference multiple sections via section_ids JSON.
    // Create a map: sectionId → array of entry rows
    type EntryRow = Record<string, unknown>
    const sectionGroups = new Map<string, EntryRow[]>()

    for (const row of rows) {
      let sectionIds: string[] = []
      try {
        sectionIds = JSON.parse(String(row.section_ids ?? '[]'))
      } catch {
        sectionIds = []
      }
      if (sectionIds.length === 0) {
        // Entry with no sections — group under 'UNASSIGNED'
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

    // Build the structured CSV output
    const lines: string[] = []

    for (const [sectionId, entries] of sectionGroups) {
      const sec = sectionMap.get(sectionId)
      const firstEntry = entries[0]

      // Determine exam date range from entries in this group
      const dates = entries.map(e => String(e.exam_date ?? '')).filter(Boolean).sort()
      const dateRange = dates.length > 0
        ? dates.length === 1
          ? dates[0]
          : `${dates[0]} to ${dates[dates.length - 1]}`
        : ''

      // Compute total units for this section's entries
      const totalLec = entries.reduce((sum, e) => sum + (Number(e.lec_units) || 0), 0)
      const totalLab = entries.reduce((sum, e) => sum + (Number(e.lab_units) || 0), 0)
      const totalUnits = totalLec + totalLab

      // Header block
      const examTypeLabel = formatExamType(firstEntry.exam_type)
      const examPeriod = dateRange ? `${examTypeLabel} ${dateRange}` : examTypeLabel
      lines.push(esc(examPeriod) + ',,,,,,,')

      const sectionCode = sec ? sec.section_code : (sectionId === '__UNASSIGNED__' ? 'UNASSIGNED' : sectionId)
      lines.push(`SECTION - ${esc(sectionCode)},,,,,,,`)

      const courseYear = sec
        ? `${sec.course_program ?? ''} ${sec.year_level ?? ''} (${totalUnits} UNITS)`.trim()
        : `(${totalUnits} UNITS)`
      lines.push(`${esc(courseYear)},,,,,,,`)

      const semesterLabel = formatSemester(firstEntry.semester_type, firstEntry.ay_label)
      lines.push(`${esc(semesterLabel)},,,,,,,`)

      // Table header
      lines.push('CODE,SUBJECT/s,LEC,LAB,DAY,TIME,ROOM,PROCTOR')

      // Table rows for this section
      for (const entry of entries) {
        const code = esc(entry.subject_code ?? '')
        const subj = esc(entry.subject ?? entry.exam_title ?? '')
        const lec = Number(entry.lec_units) || ''
        const lab = Number(entry.lab_units) || ''
        const day = getDayAbbr(String(entry.exam_date ?? ''))
        const time = `${to12h(String(entry.start_time))}-${to12h(String(entry.end_time))}`
        const room = esc(entry.room_code ?? '')
        const proctor = esc(formatProctor(entry))
        lines.push(`${code},${subj},${lec},${lab},${day},${time},${room},${proctor}`)
      }

      // Blank separator row between sections
      lines.push(',,,,,,,')
    }

    const csv = lines.join('\r\n')
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
