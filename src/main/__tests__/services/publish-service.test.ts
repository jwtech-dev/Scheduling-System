// ============================================================
// Publish Service — Unit Tests
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

import { createDraftEntry, getScheduleEntry } from '../../services/schedule-entry-service'
import { publishEntries, unpublishEntries } from '../../services/publish-service'

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

describe('Publish Service', () => {
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

  // ── publishEntries ──────────────────────────────────────────

  describe('publishEntries', () => {
    it('should publish a clean DRAFT entry (no conflicts)', () => {
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

      expect(entry.status).toBe('DRAFT')

      const result = publishEntries([entry.id])

      expect(result.published).toContain(entry.id)
      expect(result.blocked).toHaveLength(0)

      // Verify the entry is now PUBLISHED in the database
      const updated = getScheduleEntry(entry.id)
      expect(updated.status).toBe('PUBLISHED')
    })

    it('should skip already-published entries', () => {
      const { entry } = createDraftEntry({
        department: 'COLLEGE',
        activity_type: 'CLASS',
        room_id: seeds.roomId,
        personnel_id: seeds.personnelId,
        section_ids: [seeds.sectionId],
        subject: 'Algorithms',
        start_time: '10:00',
        end_time: '11:30',
        recurrence_pattern: 'ONCE',
        recurrence_start_date: '2025-08-04',
        academic_year_id: seeds.ayId,
        semester_id: seeds.semId
      })

      // First publish — should succeed
      const firstResult = publishEntries([entry.id])
      expect(firstResult.published).toContain(entry.id)

      // Second publish — same id, already PUBLISHED, should be skipped
      const secondResult = publishEntries([entry.id])
      expect(secondResult.published).toHaveLength(0)
      expect(secondResult.blocked).toHaveLength(0)

      // Entry stays PUBLISHED
      const updated = getScheduleEntry(entry.id)
      expect(updated.status).toBe('PUBLISHED')
    })

    it('should block entries with HARD room conflicts', () => {
      // Create first entry in Room 101, Monday 08:00–09:30
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

      // Create second personnel and section to avoid personnel/section conflicts
      const db = getTestDb()
      const personnel2 = randomUUID()
      db.prepare(`INSERT INTO personnel (id, employee_id, first_name, last_name, email, department, is_active, created_at, updated_at)
        VALUES (?, 'EMP-002', 'Jane', 'Smith', 'jane@test.edu', 'COLLEGE', 1, datetime('now'), datetime('now'))`).run(personnel2)

      const section2 = randomUUID()
      db.prepare(`INSERT INTO sections (id, section_code, section_name, department, year_level, academic_year_id, semester_id, is_active, created_at, updated_at)
        VALUES (?, 'CS-2A', 'CS Section 2A', 'COLLEGE', '2', ?, ?, 1, datetime('now'), datetime('now'))`).run(section2, seeds.ayId, seeds.semId)

      // Create conflicting entry: same room, overlapping time, with override to allow DRAFT save
      const { entry: conflicting } = createDraftEntry({
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

      // Attempt to publish the conflicting entry — should be blocked
      const result = publishEntries([conflicting.id])

      expect(result.published).toHaveLength(0)
      expect(result.blocked).toHaveLength(1)
      expect(result.blocked[0].id).toBe(conflicting.id)
      expect(result.blocked[0].conflicts.some((c) => c.code === 'room_conflict')).toBe(true)
      expect(result.blocked[0].conflicts.some((c) => c.severity === 'HARD')).toBe(true)

      // Verify entry remains DRAFT
      const stillDraft = getScheduleEntry(conflicting.id)
      expect(stillDraft.status).toBe('DRAFT')
    })
  })

  // ── unpublishEntries ────────────────────────────────────────

  describe('unpublishEntries', () => {
    it('should revert PUBLISHED to DRAFT', () => {
      const { entry } = createDraftEntry({
        department: 'COLLEGE',
        activity_type: 'CLASS',
        room_id: seeds.roomId,
        personnel_id: seeds.personnelId,
        section_ids: [seeds.sectionId],
        subject: 'Operating Systems',
        start_time: '13:00',
        end_time: '14:30',
        recurrence_pattern: 'ONCE',
        recurrence_start_date: '2025-08-04',
        academic_year_id: seeds.ayId,
        semester_id: seeds.semId
      })

      // Publish first
      publishEntries([entry.id])
      expect(getScheduleEntry(entry.id).status).toBe('PUBLISHED')

      // Unpublish
      const unpublished = unpublishEntries([entry.id])

      expect(unpublished).toContain(entry.id)
      expect(getScheduleEntry(entry.id).status).toBe('DRAFT')
    })

    it('should skip DRAFT entries', () => {
      const { entry } = createDraftEntry({
        department: 'COLLEGE',
        activity_type: 'CLASS',
        room_id: seeds.roomId,
        personnel_id: seeds.personnelId,
        section_ids: [seeds.sectionId],
        subject: 'Networking',
        start_time: '15:00',
        end_time: '16:30',
        recurrence_pattern: 'ONCE',
        recurrence_start_date: '2025-08-04',
        academic_year_id: seeds.ayId,
        semester_id: seeds.semId
      })

      // Entry is DRAFT — unpublish should skip it
      const unpublished = unpublishEntries([entry.id])

      expect(unpublished).toHaveLength(0)

      // Confirm it's still DRAFT
      expect(getScheduleEntry(entry.id).status).toBe('DRAFT')
    })
  })
})
