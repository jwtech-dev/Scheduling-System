// ============================================================
// Schedule Entry Service — Unit Tests
// ============================================================

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { setupTestDb, teardownTestDb, cleanAllTables, getTestDb } from '../helpers/test-db'
import { randomUUID } from 'crypto'

vi.mock('../../database/connection', async () => {
  const helpers = await import('../helpers/test-db')
  return {
    getDatabase: () => helpers.getTestDb(),
    initDatabase: vi.fn(),
    closeDatabase: vi.fn(),
    getDbPath: vi.fn(() => ':memory:')
  }
})

import {
  createDraftEntry,
  updateDraftEntry,
  deleteDraftEntry,
  listScheduleEntries,
  getScheduleEntry,
  validateEntryDryRun
} from '../../services/schedule-entry-service'

// Helper: insert prerequisite data for schedule entries
function seedPrerequisites() {
  const db = getTestDb()
  const ayId = randomUUID()
  const semId = randomUUID()
  const roomId = randomUUID()
  const personnelId = randomUUID()
  const sectionId = randomUUID()

  db.prepare(`INSERT INTO academic_years (id, department, label, start_date, end_date, is_active, status, created_at, updated_at)
    VALUES (?, 'COLLEGE', 'AY 2025-2026', '2025-08-01', '2026-05-31', 1, 'PUBLISHED', datetime('now'), datetime('now'))`).run(ayId)

  db.prepare(`INSERT INTO semesters (id, academic_year_id, department, semester_type, start_date, end_date, is_active, status, created_at, updated_at)
    VALUES (?, ?, 'COLLEGE', '1ST_SEMESTER', '2025-08-01', '2025-12-15', 1, 'PUBLISHED', datetime('now'), datetime('now'))`).run(semId, ayId)

  db.prepare(`INSERT INTO rooms (id, room_code, room_name, capacity, department_availability, status, is_active, created_at, updated_at)
    VALUES (?, 'R-101', 'Room 101', 40, 'SHARED', 'AVAILABLE', 1, datetime('now'), datetime('now'))`).run(roomId)

  db.prepare(`INSERT INTO personnel (id, employee_id, first_name, last_name, email, department, is_active, created_at, updated_at)
    VALUES (?, 'EMP-001', 'John', 'Doe', 'john@test.edu', 'COLLEGE', 1, datetime('now'), datetime('now'))`).run(personnelId)

  db.prepare(`INSERT INTO sections (id, section_code, section_name, department, year_level, academic_year_id, semester_id, is_active, created_at, updated_at)
    VALUES (?, 'CS-1A', 'CS Section 1A', 'COLLEGE', '1', ?, ?, 1, datetime('now'), datetime('now'))`).run(sectionId, ayId, semId)

  return { ayId, semId, roomId, personnelId, sectionId }
}

describe('Schedule Entry Service', () => {
  let seeds: ReturnType<typeof seedPrerequisites>

  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  beforeEach(() => {
    cleanAllTables()
    seeds = seedPrerequisites()
  })

  // ── createDraftEntry ────────────────────────────────────────

  describe('createDraftEntry', () => {
    it('should create a draft schedule entry', () => {
      const { entry } = createDraftEntry({
        department: 'COLLEGE',
        activity_type: 'CLASS',
        room_id: seeds.roomId,
        personnel_id: seeds.personnelId,
        section_ids: [seeds.sectionId],
        subject: 'Data Structures',
        start_time: '08:00',
        end_time: '09:30',
        recurrence_pattern: 'WEEKLY',
        recurrence_start_date: '2025-08-04',
        recurrence_end_date: '2025-12-15',
        day_of_week: 1,
        academic_year_id: seeds.ayId,
        semester_id: seeds.semId
      })

      expect(entry).toBeDefined()
      expect(entry.id).toBeDefined()
      expect(entry.status).toBe('DRAFT')
      expect(entry.department).toBe('COLLEGE')
      expect(entry.activity_type).toBe('CLASS')
      expect(entry.subject).toBe('Data Structures')
    })

    it('should reject when start_time >= end_time', () => {
      expect(() => {
        createDraftEntry({
          department: 'COLLEGE',
          activity_type: 'CLASS',
          room_id: seeds.roomId,
          personnel_id: seeds.personnelId,
          section_ids: [seeds.sectionId],
          subject: 'Test',
          start_time: '10:00',
          end_time: '09:00',
          recurrence_pattern: 'ONCE',
          recurrence_start_date: '2025-08-04',
          academic_year_id: seeds.ayId,
          semester_id: seeds.semId
        })
      }).toThrow(/before end time/)
    })

    it('should reject midnight-spanning entries', () => {
      expect(() => {
        createDraftEntry({
          department: 'COLLEGE',
          activity_type: 'CLASS',
          room_id: seeds.roomId,
          personnel_id: seeds.personnelId,
          section_ids: [seeds.sectionId],
          subject: 'Late Class',
          start_time: '23:00',
          end_time: '01:00',
          recurrence_pattern: 'ONCE',
          recurrence_start_date: '2025-08-04',
          academic_year_id: seeds.ayId,
          semester_id: seeds.semId
        })
      }).toThrow()
    })

    it('should create audit log entry', () => {
      const { entry } = createDraftEntry({
        department: 'COLLEGE',
        activity_type: 'CLASS',
        room_id: seeds.roomId,
        personnel_id: seeds.personnelId,
        section_ids: [seeds.sectionId],
        subject: 'Audit Test',
        start_time: '08:00',
        end_time: '09:00',
        recurrence_pattern: 'ONCE',
        recurrence_start_date: '2025-08-04',
        academic_year_id: seeds.ayId,
        semester_id: seeds.semId
      })

      const db = getTestDb()
      const log = db
        .prepare("SELECT * FROM audit_log WHERE entity_type = 'schedule_entry' AND entity_id = ?")
        .get(entry.id) as { action: string }
      expect(log).toBeDefined()
      expect(log.action).toBe('CREATE')
    })

    it('should detect room double-booking conflicts', () => {
      // First entry
      createDraftEntry({
        department: 'COLLEGE',
        activity_type: 'CLASS',
        room_id: seeds.roomId,
        personnel_id: seeds.personnelId,
        section_ids: [seeds.sectionId],
        subject: 'Course A',
        start_time: '08:00',
        end_time: '09:30',
        recurrence_pattern: 'WEEKLY',
        recurrence_start_date: '2025-08-04',
        recurrence_end_date: '2025-12-15',
        day_of_week: 1,
        academic_year_id: seeds.ayId,
        semester_id: seeds.semId
      })

      // Create a second personnel for the second entry
      const db = getTestDb()
      const personnel2 = randomUUID()
      db.prepare(`INSERT INTO personnel (id, employee_id, first_name, last_name, email, department, is_active, created_at, updated_at)
        VALUES (?, 'EMP-002', 'Jane', 'Smith', 'jane@test.edu', 'COLLEGE', 1, datetime('now'), datetime('now'))`).run(personnel2)

      const section2 = randomUUID()
      db.prepare(`INSERT INTO sections (id, section_code, section_name, department, year_level, academic_year_id, semester_id, is_active, created_at, updated_at)
        VALUES (?, 'CS-2A', 'CS Section 2A', 'COLLEGE', '2', ?, ?, 1, datetime('now'), datetime('now'))`).run(section2, seeds.ayId, seeds.semId)

      // Second entry in same room, overlapping time — should have conflicts
      const { conflicts } = createDraftEntry({
        department: 'COLLEGE',
        activity_type: 'CLASS',
        room_id: seeds.roomId,
        personnel_id: personnel2,
        section_ids: [section2],
        subject: 'Course B',
        start_time: '08:30',
        end_time: '10:00',
        recurrence_pattern: 'WEEKLY',
        recurrence_start_date: '2025-08-04',
        recurrence_end_date: '2025-12-15',
        day_of_week: 1,
        academic_year_id: seeds.ayId,
        semester_id: seeds.semId,
        override_reason: 'Testing conflict detection'
      })

      expect(conflicts.length).toBeGreaterThan(0)
      expect(conflicts.some((c) => c.code === 'room_conflict')).toBe(true)
    })
  })

  // ── updateDraftEntry ────────────────────────────────────────

  describe('updateDraftEntry', () => {
    it('should update a draft entry', () => {
      const { entry } = createDraftEntry({
        department: 'COLLEGE',
        activity_type: 'CLASS',
        room_id: seeds.roomId,
        personnel_id: seeds.personnelId,
        section_ids: [seeds.sectionId],
        subject: 'Before Update',
        start_time: '08:00',
        end_time: '09:00',
        recurrence_pattern: 'ONCE',
        recurrence_start_date: '2025-08-04',
        academic_year_id: seeds.ayId,
        semester_id: seeds.semId
      })

      const { entry: updated } = updateDraftEntry({
        id: entry.id,
        subject: 'After Update',
        start_time: '10:00',
        end_time: '11:00'
      })

      expect(updated.subject).toBe('After Update')
      expect(updated.start_time).toBe('10:00')
    })

    it('should reject editing a published entry', () => {
      const { entry } = createDraftEntry({
        department: 'COLLEGE',
        activity_type: 'CLASS',
        room_id: seeds.roomId,
        personnel_id: seeds.personnelId,
        section_ids: [seeds.sectionId],
        subject: 'Published',
        start_time: '08:00',
        end_time: '09:00',
        recurrence_pattern: 'ONCE',
        recurrence_start_date: '2025-08-04',
        academic_year_id: seeds.ayId,
        semester_id: seeds.semId
      })

      // Manually publish it
      const db = getTestDb()
      db.prepare("UPDATE schedule_entries SET status = 'PUBLISHED' WHERE id = ?").run(entry.id)

      expect(() => {
        updateDraftEntry({ id: entry.id, subject: 'Changed' })
      }).toThrow(/published/)
    })
  })

  // ── deleteDraftEntry ────────────────────────────────────────

  describe('deleteDraftEntry', () => {
    it('should soft-delete a draft entry', () => {
      const { entry } = createDraftEntry({
        department: 'COLLEGE',
        activity_type: 'CLASS',
        room_id: seeds.roomId,
        personnel_id: seeds.personnelId,
        section_ids: [seeds.sectionId],
        subject: 'To Delete',
        start_time: '08:00',
        end_time: '09:00',
        recurrence_pattern: 'ONCE',
        recurrence_start_date: '2025-08-04',
        academic_year_id: seeds.ayId,
        semester_id: seeds.semId
      })

      deleteDraftEntry(entry.id)
      expect(() => getScheduleEntry(entry.id)).toThrow(/not found/)
    })

    it('should reject deleting a published entry', () => {
      const { entry } = createDraftEntry({
        department: 'COLLEGE',
        activity_type: 'CLASS',
        room_id: seeds.roomId,
        personnel_id: seeds.personnelId,
        section_ids: [seeds.sectionId],
        subject: 'Published',
        start_time: '08:00',
        end_time: '09:00',
        recurrence_pattern: 'ONCE',
        recurrence_start_date: '2025-08-04',
        academic_year_id: seeds.ayId,
        semester_id: seeds.semId
      })

      const db = getTestDb()
      db.prepare("UPDATE schedule_entries SET status = 'PUBLISHED' WHERE id = ?").run(entry.id)

      expect(() => deleteDraftEntry(entry.id)).toThrow(/published/)
    })
  })

  // ── listScheduleEntries ─────────────────────────────────────

  describe('listScheduleEntries', () => {
    it('should list entries filtered by department', () => {
      createDraftEntry({
        department: 'COLLEGE',
        activity_type: 'CLASS',
        room_id: seeds.roomId,
        personnel_id: seeds.personnelId,
        section_ids: [seeds.sectionId],
        subject: 'College Course',
        start_time: '08:00',
        end_time: '09:00',
        recurrence_pattern: 'ONCE',
        recurrence_start_date: '2025-08-04',
        academic_year_id: seeds.ayId,
        semester_id: seeds.semId
      })

      const college = listScheduleEntries({ department: 'COLLEGE' })
      const shs = listScheduleEntries({ department: 'SHS' })

      expect(college.length).toBe(1)
      expect(shs.length).toBe(0)
    })
  })

  // ── validateEntryDryRun ─────────────────────────────────────

  describe('validateEntryDryRun', () => {
    it('should return validation error for invalid time range', () => {
      const result = validateEntryDryRun({
        department: 'COLLEGE',
        activity_type: 'CLASS',
        room_id: seeds.roomId,
        personnel_id: seeds.personnelId,
        section_ids: [seeds.sectionId],
        subject: 'Test',
        start_time: '10:00',
        end_time: '09:00',
        recurrence_pattern: 'ONCE',
        recurrence_start_date: '2025-08-04',
        academic_year_id: seeds.ayId,
        semester_id: seeds.semId
      })

      expect(result.valid).toBe(false)
      expect(result.validationError).toContain('before end time')
    })

    it('should return valid for a good entry', () => {
      const result = validateEntryDryRun({
        department: 'COLLEGE',
        activity_type: 'CLASS',
        room_id: seeds.roomId,
        personnel_id: seeds.personnelId,
        section_ids: [seeds.sectionId],
        subject: 'Good Course',
        start_time: '08:00',
        end_time: '09:00',
        recurrence_pattern: 'ONCE',
        recurrence_start_date: '2025-08-04',
        academic_year_id: seeds.ayId,
        semester_id: seeds.semId
      })

      expect(result.valid).toBe(true)
      expect(result.validationError).toBeUndefined()
    })
  })
})
