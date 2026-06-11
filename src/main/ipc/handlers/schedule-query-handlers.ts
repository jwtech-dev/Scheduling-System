// Schedule Query Handlers — Entity-specific schedule lookups
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { getDatabase } from '../../database/connection'
import type { RecurrencePattern } from '../../../shared/types'

interface ScheduleEntryRow {
  id: string
  department: string
  activity_type: string
  room_id: string | null
  personnel_id: string | null
  section_ids: string
  subject: string | null
  start_time: string
  end_time: string
  recurrence_pattern: RecurrencePattern
  recurrence_start_date: string
  recurrence_end_date: string | null
  status: string
  room_code?: string
  room_name?: string
  personnel_name?: string
}

export function registerScheduleQueryHandlers(): void {
  // Get schedule entries for a specific room
  registerHandler(IPC_CHANNELS.ROOMS_GET_SCHEDULE, (args) => {
    const { id, semester_id } = args as { id: string; semester_id?: string }
    const db = getDatabase()
    const semCondition = semester_id ? ' AND se.semester_id = ?' : ''
    const semParams = semester_id ? [semester_id] : []
    const entries = db
      .prepare(
        `SELECT se.*, p.first_name || ' ' || p.last_name as personnel_name
         FROM schedule_entries se
         LEFT JOIN personnel p ON se.personnel_id = p.id
         WHERE se.room_id = ? AND se.is_active = 1${semCondition}
         ORDER BY se.start_time`
      )
      .all(id, ...semParams) as ScheduleEntryRow[]
    return entries
  })

  // Get schedule entries for a specific section
  registerHandler(IPC_CHANNELS.SECTIONS_GET_SCHEDULE, (args) => {
    const { id, semester_id } = args as { id: string; semester_id?: string }
    const db = getDatabase()
    // Use delimiter-bounded matching to avoid substring false positives
    const semCondition = semester_id ? ' AND se.semester_id = ?' : ''
    const semParams = semester_id ? [semester_id] : []
    const entries = db
      .prepare(
        `SELECT se.*, r.room_code, r.room_name,
         p.first_name || ' ' || p.last_name as personnel_name
         FROM schedule_entries se
         LEFT JOIN rooms r ON se.room_id = r.id
         LEFT JOIN personnel p ON se.personnel_id = p.id
         WHERE se.is_active = 1
         AND (',' || REPLACE(REPLACE(REPLACE(se.section_ids, '[', ''), ']', ''), '"', '') || ',')
         LIKE ('%,' || ? || ',%')${semCondition}
         ORDER BY se.start_time`
      )
      .all(id, ...semParams) as ScheduleEntryRow[]
    return entries
  })

  // Get schedule entries for a specific personnel
  registerHandler(IPC_CHANNELS.PERSONNEL_GET_SCHEDULE, (args) => {
    const { id, semester_id } = args as { id: string; semester_id?: string }
    const db = getDatabase()
    const semCondition = semester_id ? ' AND se.semester_id = ?' : ''
    const semParams = semester_id ? [semester_id] : []
    const entries = db
      .prepare(
        `SELECT se.*, r.room_code, r.room_name
         FROM schedule_entries se
         LEFT JOIN rooms r ON se.room_id = r.id
         WHERE se.personnel_id = ? AND se.is_active = 1${semCondition}
         ORDER BY se.start_time`
      )
      .all(id, ...semParams) as ScheduleEntryRow[]
    return entries
  })
}
