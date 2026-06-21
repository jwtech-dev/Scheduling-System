// Carry Forward Service — clones term-scoped data between academic terms
import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { randomUUID } from 'crypto'
import type {
  CarryForwardRequest,
  CarryForwardPreview,
  CarryForwardResult,
  CarryForwardEntityResult,
  CarryForwardEntity,
  Section,
  ScheduleEntry,
  CalendarEvent
} from '../../shared/types'
import { ERROR_CODES } from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message); (err as Error & { code: string }).code = code; throw err
}

/**
 * Preview what will be carried forward without modifying data.
 */
export function previewCarryForward(data: CarryForwardRequest): CarryForwardPreview {
  const db = getDatabase()

  // Validate source and target exist (archived_at IS NULL = not soft-deleted; is_active is irrelevant here)
  const sourceAY = db.prepare('SELECT label FROM academic_years WHERE id = ? AND archived_at IS NULL').get(data.source_academic_year_id) as { label: string } | undefined
  if (!sourceAY) throwError(ERROR_CODES.NOT_FOUND, 'Source academic year not found.')

  const sourceSem = db.prepare('SELECT semester_type, term_type FROM semesters WHERE id = ? AND academic_year_id = ? AND archived_at IS NULL').get(data.source_semester_id, data.source_academic_year_id) as { semester_type: string; term_type: string | null } | undefined
  if (!sourceSem) throwError(ERROR_CODES.NOT_FOUND, 'Source semester not found.')

  const targetAY = db.prepare('SELECT label FROM academic_years WHERE id = ? AND archived_at IS NULL').get(data.target_academic_year_id) as { label: string } | undefined
  if (!targetAY) throwError(ERROR_CODES.NOT_FOUND, 'Target academic year not found.')

  const targetSem = db.prepare('SELECT semester_type, term_type FROM semesters WHERE id = ? AND academic_year_id = ? AND archived_at IS NULL').get(data.target_semester_id, data.target_academic_year_id) as { semester_type: string; term_type: string | null } | undefined
  if (!targetSem) throwError(ERROR_CODES.NOT_FOUND, 'Target semester not found.')

  if (data.source_semester_id === data.target_semester_id) {
    throwError('SAME_TERM', 'Source and target semesters cannot be the same.')
  }

  // Block cross-term-type carry-forward
  if (sourceSem.term_type && targetSem.term_type && sourceSem.term_type !== targetSem.term_type) {
    throwError(ERROR_CODES.VALIDATION_ERROR, `Cannot carry forward between different term types (${sourceSem.term_type} → ${targetSem.term_type}).`)
  }

  const counts = {} as Record<CarryForwardEntity, number>

  if (data.entities.includes('SECTIONS')) {
    const count = db.prepare(
      'SELECT COUNT(*) as c FROM sections WHERE department = ? AND academic_year_id = ? AND semester_id = ? AND is_active = 1'
    ).get(data.department, data.source_academic_year_id, data.source_semester_id) as { c: number }
    counts.SECTIONS = count.c
  }

  if (data.entities.includes('CLASS_SCHEDULES')) {
    const count = db.prepare(
      "SELECT COUNT(*) as c FROM schedule_entries WHERE department = ? AND academic_year_id = ? AND semester_id = ? AND activity_type = 'CLASS' AND is_active = 1"
    ).get(data.department, data.source_academic_year_id, data.source_semester_id) as { c: number }
    counts.CLASS_SCHEDULES = count.c
  }

  if (data.entities.includes('EXAM_SCHEDULES')) {
    const count = db.prepare(
      "SELECT COUNT(*) as c FROM schedule_entries WHERE department = ? AND academic_year_id = ? AND semester_id = ? AND activity_type = 'EXAM' AND is_active = 1"
    ).get(data.department, data.source_academic_year_id, data.source_semester_id) as { c: number }
    counts.EXAM_SCHEDULES = count.c
  }

  if (data.entities.includes('CALENDAR_EVENTS')) {
    const count = db.prepare(
      'SELECT COUNT(*) as c FROM calendar_events WHERE academic_year_id = ? AND semester_id = ? AND is_active = 1'
    ).get(data.source_academic_year_id, data.source_semester_id) as { c: number }
    counts.CALENDAR_EVENTS = count.c
  }

  const fmtSem = (s: string): string => s.replace(/_/g, ' ')

  return {
    source_label: `${sourceAY.label} · ${fmtSem(sourceSem.semester_type)}`,
    target_label: `${targetAY.label} · ${fmtSem(targetSem.semester_type)}`,
    counts
  }
}

/**
 * Execute carry forward — clone data from source term to target term in a transaction.
 */
export function executeCarryForward(data: CarryForwardRequest): CarryForwardResult {
  const db = getDatabase()

  // Validate terms exist (archived_at IS NULL = not soft-deleted; is_active is irrelevant here)
  const sourceAY = db.prepare('SELECT id, label FROM academic_years WHERE id = ? AND archived_at IS NULL').get(data.source_academic_year_id) as { id: string; label: string } | undefined
  if (!sourceAY) throwError(ERROR_CODES.NOT_FOUND, 'Source academic year not found.')

  const sourceSem = db.prepare('SELECT id, start_date, end_date, term_type FROM semesters WHERE id = ? AND academic_year_id = ? AND archived_at IS NULL').get(data.source_semester_id, data.source_academic_year_id) as { id: string; start_date: string; end_date: string; term_type: string | null } | undefined
  if (!sourceSem) throwError(ERROR_CODES.NOT_FOUND, 'Source semester not found.')

  const targetAY = db.prepare('SELECT id, label FROM academic_years WHERE id = ? AND archived_at IS NULL').get(data.target_academic_year_id) as { id: string; label: string } | undefined
  if (!targetAY) throwError(ERROR_CODES.NOT_FOUND, 'Target academic year not found.')

  const targetSem = db.prepare('SELECT id, start_date, end_date, term_type FROM semesters WHERE id = ? AND academic_year_id = ? AND archived_at IS NULL').get(data.target_semester_id, data.target_academic_year_id) as { id: string; start_date: string; end_date: string; term_type: string | null } | undefined
  if (!targetSem) throwError(ERROR_CODES.NOT_FOUND, 'Target semester not found.')

  if (data.source_semester_id === data.target_semester_id) {
    throwError('SAME_TERM', 'Source and target semesters cannot be the same.')
  }

  // Block cross-term-type carry-forward
  if (sourceSem.term_type && targetSem.term_type && sourceSem.term_type !== targetSem.term_type) {
    throwError(ERROR_CODES.VALIDATION_ERROR, `Cannot carry forward between different term types (${sourceSem.term_type} → ${targetSem.term_type}).`)
  }

  const results: CarryForwardEntityResult[] = []
  let totalCreated = 0
  let totalSkipped = 0

  const execute = db.transaction(() => {
    // --- 1. Sections ---
    const sectionIdMap = new Map<string, string>() // old ID → new ID

    if (data.entities.includes('SECTIONS')) {
      const sectionResult = cloneSections(db, data, sectionIdMap)
      results.push(sectionResult)
      totalCreated += sectionResult.created
      totalSkipped += sectionResult.skipped
    } else {
      // Even if not cloning sections, build a map of existing sections in target
      // so schedule entry section_ids can be remapped if sections were carried forward previously
      buildExistingSectionMap(db, data, sectionIdMap)
    }

    // --- 2. Class Schedules ---
    if (data.entities.includes('CLASS_SCHEDULES')) {
      const classResult = cloneScheduleEntries(db, data, sectionIdMap, 'CLASS', 'CLASS_SCHEDULES')
      results.push(classResult)
      totalCreated += classResult.created
      totalSkipped += classResult.skipped
    }

    // --- 3. Exam Schedules ---
    if (data.entities.includes('EXAM_SCHEDULES')) {
      const examResult = cloneScheduleEntries(db, data, sectionIdMap, 'EXAM', 'EXAM_SCHEDULES')
      results.push(examResult)
      totalCreated += examResult.created
      totalSkipped += examResult.skipped
    }

    // --- 4. Calendar Events ---
    if (data.entities.includes('CALENDAR_EVENTS')) {
      const calResult = cloneCalendarEvents(db, data)
      results.push(calResult)
      totalCreated += calResult.created
      totalSkipped += calResult.skipped
    }

    // Audit log the carry forward operation
    logAudit({
      entity_type: 'carry_forward',
      entity_id: randomUUID(),
      department: data.department,
      action: 'CREATE',
      after_snapshot: {
        source: `${data.source_academic_year_id}/${data.source_semester_id}`,
        target: `${data.target_academic_year_id}/${data.target_semester_id}`,
        entities: data.entities,
        total_created: totalCreated,
        total_skipped: totalSkipped
      }
    })
  })

  execute()

  return { results, total_created: totalCreated, total_skipped: totalSkipped }
}

// ─── Internal Helpers ────────────────────────────────────────────

function cloneSections(
  db: ReturnType<typeof getDatabase>,
  data: CarryForwardRequest,
  sectionIdMap: Map<string, string>
): CarryForwardEntityResult {
  const result: CarryForwardEntityResult = { entity: 'SECTIONS', created: 0, skipped: 0, skipped_reasons: [] }

  const sourceSections = db.prepare(
    'SELECT * FROM sections WHERE department = ? AND academic_year_id = ? AND semester_id = ? AND is_active = 1'
  ).all(data.department, data.source_academic_year_id, data.source_semester_id) as Section[]

  for (const section of sourceSections) {
    // Check if section_code + subject combo already exists in target term
    const existing = db.prepare(
      "SELECT id FROM sections WHERE department = ? AND section_code = ? AND COALESCE(subject, '') = ? AND academic_year_id = ? AND semester_id = ? AND is_active = 1"
    ).get(data.department, section.section_code, section.subject ?? '', data.target_academic_year_id, data.target_semester_id) as { id: string } | undefined

    if (existing) {
      // Map old ID to existing target ID so schedule entries can still reference it
      sectionIdMap.set(section.id, existing.id)
      result.skipped++
      result.skipped_reasons.push(`Section ${section.section_code}${section.subject ? ` (${section.subject})` : ''} already exists`)
      continue
    }

    const newId = randomUUID()
    sectionIdMap.set(section.id, newId)

    db.prepare(
      `INSERT INTO sections (id, department, section_code, section_name, strand_track, subject, course_program, year_level, grade_level, student_count, academic_year_id, semester_id, semester_type, adviser_id, status, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, datetime('now'), datetime('now'))`
    ).run(
      newId, section.department, section.section_code, section.section_name,
      section.strand_track, section.subject, section.course_program, section.year_level,
      section.grade_level ?? null,
      section.student_count, data.target_academic_year_id, data.target_semester_id,
      section.semester_type, section.adviser_id
    )

    result.created++
  }

  return result
}

function buildExistingSectionMap(
  db: ReturnType<typeof getDatabase>,
  data: CarryForwardRequest,
  sectionIdMap: Map<string, string>
): void {
  // Build a map from source section codes to target section IDs
  // so schedule entries can be remapped even if sections weren't carried forward this time
  const sourceSections = db.prepare(
    'SELECT id, section_code, subject FROM sections WHERE department = ? AND academic_year_id = ? AND semester_id = ? AND is_active = 1'
  ).all(data.department, data.source_academic_year_id, data.source_semester_id) as Pick<Section, 'id' | 'section_code' | 'subject'>[]

  for (const src of sourceSections) {
    const target = db.prepare(
      "SELECT id FROM sections WHERE department = ? AND section_code = ? AND COALESCE(subject, '') = ? AND academic_year_id = ? AND semester_id = ? AND is_active = 1"
    ).get(data.department, src.section_code, src.subject ?? '', data.target_academic_year_id, data.target_semester_id) as { id: string } | undefined

    if (target) {
      sectionIdMap.set(src.id, target.id)
    }
  }
}

function remapSectionIds(sectionIdsJson: string, sectionIdMap: Map<string, string>): string {
  try {
    const ids = JSON.parse(sectionIdsJson) as string[]
    if (!Array.isArray(ids)) return '[]'
    const remapped = ids
      .map(id => sectionIdMap.get(id))
      .filter((id): id is string => id != null)
    return JSON.stringify(remapped)
  } catch {
    return '[]'
  }
}

function cloneScheduleEntries(
  db: ReturnType<typeof getDatabase>,
  data: CarryForwardRequest,
  sectionIdMap: Map<string, string>,
  activityType: 'CLASS' | 'EXAM',
  entityLabel: CarryForwardEntity
): CarryForwardEntityResult {
  const result: CarryForwardEntityResult = { entity: entityLabel, created: 0, skipped: 0, skipped_reasons: [] }

  const sourceEntries = db.prepare(
    'SELECT * FROM schedule_entries WHERE department = ? AND academic_year_id = ? AND semester_id = ? AND activity_type = ? AND is_active = 1'
  ).all(data.department, data.source_academic_year_id, data.source_semester_id, activityType) as ScheduleEntry[]

  // Get target semester start date for recurrence_start_date
  const targetSem = db.prepare('SELECT start_date FROM semesters WHERE id = ?').get(data.target_semester_id) as { start_date: string }

  for (const entry of sourceEntries) {
    // Note: room_id is intentionally cleared (set to NULL) during carry forward.
    // Room assignments must be re-done manually in the new term.

    // Validate personnel still active
    if (entry.personnel_id) {
      const person = db.prepare('SELECT id FROM personnel WHERE id = ? AND is_active = 1').get(entry.personnel_id)
      if (!person) {
        result.skipped++
        result.skipped_reasons.push(`${entry.subject ?? entry.exam_title ?? 'Entry'}: personnel no longer active`)
        continue
      }
    }

    // Remap section IDs
    const remappedSectionIds = remapSectionIds(entry.section_ids, sectionIdMap)

    // Skip if all sections were unmapped (no matching sections in target semester)
    const originalIds = (() => { try { return JSON.parse(entry.section_ids) as string[] } catch { return [] } })()
    if (originalIds.length > 0 && remappedSectionIds === '[]') {
      result.skipped++
      result.skipped_reasons.push(`${entry.subject ?? entry.exam_title ?? 'Entry'}: no matching sections in target semester`)
      continue
    }

    // Deduplicate: skip if an entry with the same core identity already exists in target
    const existingEntry = db.prepare(
      `SELECT id FROM schedule_entries
       WHERE activity_type = ? AND COALESCE(personnel_id, '') = ? AND COALESCE(subject, '') = ?
       AND start_time = ? AND end_time = ? AND COALESCE(day_of_week, '') = ?
       AND academic_year_id = ? AND semester_id = ? AND is_active = 1`
    ).get(
      entry.activity_type,
      entry.personnel_id ?? '',
      entry.subject ?? '',
      entry.start_time,
      entry.end_time,
      entry.day_of_week ?? '',
      data.target_academic_year_id,
      data.target_semester_id
    ) as { id: string } | undefined

    if (existingEntry) {
      result.skipped++
      result.skipped_reasons.push(`${entry.subject ?? entry.exam_title ?? 'Entry'}: already exists in target semester`)
      continue
    }

    const newId = randomUUID()
    db.prepare(
      `INSERT INTO schedule_entries (id, department, activity_type, room_id, personnel_id, section_ids, subject, subject_code, lec_units, lab_units, exam_title, exam_type, modality, start_time, end_time, recurrence_pattern, recurrence_start_date, recurrence_end_date, day_of_week, day_of_month, week_of_month, custom_days, academic_year_id, semester_id, source_template_id, status, conflict_flags, notes, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, NULL, 'DRAFT', '[]', ?, 1, datetime('now'), datetime('now'))`
    ).run(
      newId, entry.department, entry.activity_type,
      null, entry.personnel_id, remappedSectionIds,
      entry.subject, entry.subject_code, entry.lec_units, entry.lab_units,
      entry.exam_title, entry.exam_type, entry.modality,
      entry.start_time, entry.end_time, entry.recurrence_pattern,
      targetSem.start_date, // use target semester start for recurrence
      entry.day_of_week, entry.day_of_month, entry.week_of_month, entry.custom_days,
      data.target_academic_year_id, data.target_semester_id,
      entry.notes
    )

    result.created++
  }

  return result
}

function cloneCalendarEvents(
  db: ReturnType<typeof getDatabase>,
  data: CarryForwardRequest
): CarryForwardEntityResult {
  const result: CarryForwardEntityResult = { entity: 'CALENDAR_EVENTS', created: 0, skipped: 0, skipped_reasons: [] }

  const sourceSem = db.prepare('SELECT start_date FROM semesters WHERE id = ?').get(data.source_semester_id) as { start_date: string } | undefined
  const targetSem = db.prepare('SELECT start_date FROM semesters WHERE id = ?').get(data.target_semester_id) as { start_date: string } | undefined

  if (!sourceSem || !targetSem) {
    result.skipped_reasons.push('Source or target semester start date not found')
    return result
  }

  const sourceStart = new Date(sourceSem.start_date + 'T00:00:00')
  const targetStart = new Date(targetSem.start_date + 'T00:00:00')
  const offsetMs = targetStart.getTime() - sourceStart.getTime()

  const shiftDate = (dateStr: string): string => {
    const hasTime = dateStr.includes('T') || dateStr.includes(' ')
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr

    const shiftedDate = new Date(date.getTime() + offsetMs)
    if (hasTime) {
      if (dateStr.endsWith('Z')) {
        return shiftedDate.toISOString()
      }
      const yyyy = shiftedDate.getFullYear()
      const mm = String(shiftedDate.getMonth() + 1).padStart(2, '0')
      const dd = String(shiftedDate.getDate()).padStart(2, '0')
      const hh = String(shiftedDate.getHours()).padStart(2, '0')
      const min = String(shiftedDate.getMinutes()).padStart(2, '0')
      const ss = String(shiftedDate.getSeconds()).padStart(2, '0')
      const separator = dateStr.includes('T') ? 'T' : ' '
      return `${yyyy}-${mm}-${dd}${separator}${hh}:${min}:${ss}`
    } else {
      const yyyy = shiftedDate.getFullYear()
      const mm = String(shiftedDate.getMonth() + 1).padStart(2, '0')
      const dd = String(shiftedDate.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }
  }

  const sourceEvents = db.prepare(
    'SELECT * FROM calendar_events WHERE academic_year_id = ? AND semester_id = ? AND is_active = 1'
  ).all(data.source_academic_year_id, data.source_semester_id) as CalendarEvent[]

  for (const event of sourceEvents) {
    const targetStartStr = shiftDate(event.start_datetime)
    const targetEndStr = shiftDate(event.end_datetime)

    // Skip if same title + times already exist in target
    const existing = db.prepare(
      'SELECT id FROM calendar_events WHERE title = ? AND start_datetime = ? AND end_datetime = ? AND academic_year_id = ? AND semester_id = ? AND is_active = 1'
    ).get(event.title, targetStartStr, targetEndStr, data.target_academic_year_id, data.target_semester_id)

    if (existing) {
      result.skipped++
      result.skipped_reasons.push(`"${event.title}" already exists in target`)
      continue
    }

    const newId = randomUUID()
    db.prepare(
      `INSERT INTO calendar_events (id, title, event_type, exam_type, is_blocking, is_all_day, start_datetime, end_datetime, academic_year_id, semester_id, description, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
    ).run(
      newId, event.title, event.event_type, event.exam_type,
      event.is_blocking, event.is_all_day,
      targetStartStr, targetEndStr,
      data.target_academic_year_id, data.target_semester_id,
      event.description
    )

    result.created++
  }

  return result
}
