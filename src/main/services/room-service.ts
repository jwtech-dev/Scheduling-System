// ============================================================
// Room Service — TASK-09
// ============================================================

import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { randomUUID } from 'crypto'
import type { Room, DepartmentAvailability, RoomStatus } from '../../shared/types'
import { ERROR_CODES } from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

interface RoomFilters {
  department_availability?: DepartmentAvailability
  status?: RoomStatus
  search?: string
  building?: string
}

/**
 * List rooms with optional filters.
 */
export function listRooms(filters: RoomFilters = {}): Room[] {
  const db = getDatabase()
  const conditions: string[] = ['is_active = 1 AND archived_at IS NULL']
  const params: unknown[] = []

  if (filters.department_availability) {
    conditions.push('department_availability = ?')
    params.push(filters.department_availability)
  }
  if (filters.status) {
    conditions.push('status = ?')
    params.push(filters.status)
  }
  if (filters.building) {
    conditions.push('building = ?')
    params.push(filters.building)
  }
  if (filters.search) {
    conditions.push('(room_code LIKE ? OR room_name LIKE ?)')
    const term = `%${filters.search}%`
    params.push(term, term)
  }

  return db
    .prepare(`SELECT * FROM rooms WHERE ${conditions.join(' AND ')} ORDER BY room_code`)
    .all(...params) as Room[]
}

/**
 * Get a room by ID.
 */
export function getRoom(id: string): Room {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM rooms WHERE id = ? AND is_active = 1 AND archived_at IS NULL').get(id) as
    | Room
    | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Room not found: ${id}`)
  return row
}

/**
 * Create a new room.
 */
export function createRoom(data: {
  room_code: string
  room_name: string
  building?: string
  floor?: string
  capacity: number
  room_type?: string
  department_availability?: DepartmentAvailability
  notes?: string
}): Room {
  const db = getDatabase()

  // Validate uniqueness
  const existing = db
    .prepare('SELECT id FROM rooms WHERE room_code = ? AND is_active = 1 AND archived_at IS NULL')
    .get(data.room_code)
  if (existing) {
    throwError(ERROR_CODES.DUPLICATE_ROOM_CODE, `Room code "${data.room_code}" is already in use.`)
  }

  // Validate capacity
  if (!data.capacity || data.capacity < 1) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Room capacity must be at least 1.')
  }
  if (data.capacity > 10000) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Room capacity cannot exceed 10,000.')
  }

  const id = randomUUID()

  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO rooms (id, room_code, room_name, building, floor, capacity, room_type,
       department_availability, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      id,
      data.room_code,
      data.room_name,
      data.building ?? null,
      data.floor ?? null,
      data.capacity,
      data.room_type ?? null,
      data.department_availability ?? 'SHARED',
      data.notes ?? null
    )

    logAudit({
      entity_type: 'room',
      entity_id: id,
      action: 'CREATE',
      after_snapshot: { ...data, id }
    })
  })

  create()
  return getRoom(id)
}

/**
 * Update an existing room.
 */
export function updateRoom(data: {
  id: string
  room_code?: string
  room_name?: string
  building?: string | null
  floor?: string | null
  capacity?: number
  room_type?: string | null
  department_availability?: DepartmentAvailability
  status?: RoomStatus
  notes?: string | null
}): Room {
  const db = getDatabase()
  const existing = getRoom(data.id)

  // Check code uniqueness if changing
  if (data.room_code && data.room_code !== existing.room_code) {
    const dup = db
      .prepare('SELECT id FROM rooms WHERE room_code = ? AND id != ? AND is_active = 1')
      .get(data.room_code, data.id)
    if (dup) {
      throwError(ERROR_CODES.DUPLICATE_ROOM_CODE, `Room code "${data.room_code}" is already in use.`)
    }
  }

  const updated = {
    room_code: data.room_code ?? existing.room_code,
    room_name: data.room_name ?? existing.room_name,
    building: data.building !== undefined ? data.building : existing.building,
    floor: data.floor !== undefined ? data.floor : existing.floor,
    capacity: data.capacity ?? existing.capacity,
    room_type: data.room_type !== undefined ? data.room_type : existing.room_type,
    department_availability: data.department_availability ?? existing.department_availability,
    status: data.status ?? existing.status,
    notes: data.notes !== undefined ? data.notes : existing.notes
  }

  // Validate capacity bounds
  if (updated.capacity < 1 || updated.capacity > 10000) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Room capacity must be between 1 and 10,000.')
  }

  const update = db.transaction(() => {
    db.prepare(
      `UPDATE rooms SET room_code = ?, room_name = ?, building = ?, floor = ?,
       capacity = ?, room_type = ?, department_availability = ?, status = ?,
       notes = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      updated.room_code, updated.room_name, updated.building, updated.floor,
      updated.capacity, updated.room_type, updated.department_availability,
      updated.status, updated.notes, data.id
    )

    logAudit({
      entity_type: 'room',
      entity_id: data.id,
      action: 'UPDATE',
      before_snapshot: existing,
      after_snapshot: { ...existing, ...updated }
    })
  })

  update()
  return getRoom(data.id)
}

/**
 * Soft-delete a room (set archived_at).
 */
export function deleteRoom(id: string): void {
  const db = getDatabase()
  const existing = getRoom(id)

  // Check for active schedule entries referencing this room
  const activeEntries = db
    .prepare(
      "SELECT COUNT(*) as count FROM schedule_entries WHERE room_id = ? AND status = 'PUBLISHED' AND is_active = 1"
    )
    .get(id) as { count: number }

  if (activeEntries.count > 0) {
    throwError(
      ERROR_CODES.DELETE_PROTECTED,
      `Cannot delete room "${existing.room_code}" — it has ${activeEntries.count} published schedule entries.`
    )
  }

  const del = db.transaction(() => {
    db.prepare(
      "UPDATE rooms SET archived_at = datetime('now'), archived_by = 'admin', updated_at = datetime('now') WHERE id = ?"
    ).run(id)

    logAudit({
      entity_type: 'room',
      entity_id: id,
      action: 'DELETE',
      before_snapshot: existing
    })
  })

  del()
}

/**
 * Get cascade count — number of related schedule entries.
 */
export function getCascadeCount(id: string): { schedule_entries: number } {
  const db = getDatabase()
  const result = db
    .prepare('SELECT COUNT(*) as count FROM schedule_entries WHERE room_id = ? AND is_active = 1')
    .get(id) as { count: number }
  return { schedule_entries: result.count }
}

/**
 * List archived (soft-deleted) rooms.
 */
export function getArchivedRooms(): Room[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM rooms WHERE archived_at IS NOT NULL ORDER BY archived_at DESC')
    .all() as Room[]
}

/**
 * Restore a soft-deleted room.
 */
export function restoreRoom(id: string): Room {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM rooms WHERE id = ? AND archived_at IS NOT NULL').get(id) as Room | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Archived room not found: ${id}`)

  const restore = db.transaction(() => {
    db.prepare(
      "UPDATE rooms SET archived_at = NULL, archived_by = NULL, updated_at = datetime('now') WHERE id = ?"
    ).run(id)

    logAudit({
      entity_type: 'room',
      entity_id: id,
      action: 'RESTORE',
      before_snapshot: row
    })
  })

  restore()
  return getRoom(id)
}

/**
 * Permanently delete a room from the database.
 */
export function permanentDeleteRoom(id: string): void {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM rooms WHERE id = ? AND archived_at IS NOT NULL').get(id) as Room | undefined
  if (!row) throwError(ERROR_CODES.NOT_FOUND, `Archived room not found: ${id}`)

  const del = db.transaction(() => {
    db.prepare('DELETE FROM rooms WHERE id = ?').run(id)

    logAudit({
      entity_type: 'room',
      entity_id: id,
      action: 'PERMANENT_DELETE',
      before_snapshot: row
    })
  })

  del()
}
