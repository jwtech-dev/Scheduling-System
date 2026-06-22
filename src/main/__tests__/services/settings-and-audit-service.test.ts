import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'

vi.mock('../../database/connection', async () => {
  const helpers = await import('../helpers/test-db')
  return {
    getDatabase: () => helpers.getTestDb(),
    initDatabase: vi.fn(),
    closeDatabase: vi.fn(),
    getDbPath: vi.fn(() => ':memory:')
  }
})

import { setupTestDb, teardownTestDb, cleanAllTables } from '../helpers/test-db'
import {
  getSetting,
  setSetting,
  getAllSettings,
  setSettings,
  hasAdminPassword
} from '../../services/settings-service'
import { logAudit, queryAuditLog } from '../../services/audit-service'

// ============================================================
// Settings Service
// ============================================================

describe('settings-service', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  beforeEach(() => {
    cleanAllTables()
  })

  // 1. setSetting + getSetting round trip
  it('setSetting stores a value retrievable by getSetting', () => {
    setSetting('theme', 'dark')
    expect(getSetting('theme')).toBe('dark')
  })

  // 2. getSetting returns null for missing key
  it('getSetting returns null for a key that does not exist', () => {
    expect(getSetting('nonexistent_key')).toBeNull()
  })

  // 3. setSettings batch
  it('setSettings stores multiple values in a single transaction', () => {
    setSettings({
      institution_name: 'Test University',
      institution_address: '123 Main St',
      footer_credit: 'Powered by ScheduleApp'
    })

    expect(getSetting('institution_name')).toBe('Test University')
    expect(getSetting('institution_address')).toBe('123 Main St')
    expect(getSetting('footer_credit')).toBe('Powered by ScheduleApp')
  })

  // 4. getAllSettings returns all
  it('getAllSettings returns all stored settings as a key-value map', () => {
    setSetting('key_a', 'value_a')
    setSetting('key_b', 'value_b')
    setSetting('key_c', 'value_c')

    const all = getAllSettings()

    expect(all).toEqual({
      key_a: 'value_a',
      key_b: 'value_b',
      key_c: 'value_c'
    })
  })

  // 5. hasAdminPassword returns false when not set
  it('hasAdminPassword returns false when admin_password_hash is not set', () => {
    expect(hasAdminPassword()).toBe(false)
  })

  // 6. hasAdminPassword returns true when set
  it('hasAdminPassword returns true when admin_password_hash is set', () => {
    setSetting('admin_password_hash', '$2b$10$somefakebcrypthashvalue1234567890')
    expect(hasAdminPassword()).toBe(true)
  })
})

// ============================================================
// Audit Service
// ============================================================

describe('audit-service', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  beforeEach(() => {
    cleanAllTables()
  })

  // 7. logAudit creates entry
  it('logAudit inserts an audit record retrievable by queryAuditLog', () => {
    logAudit({
      entity_type: 'room',
      entity_id: 'room-001',
      department: 'COLLEGE',
      action: 'CREATE',
      after_snapshot: { code: 'R101', building: 'Main' }
    })

    const { records, total } = queryAuditLog({ entity_type: 'room' })

    expect(total).toBe(1)
    expect(records).toHaveLength(1)

    const record = records[0] as Record<string, unknown>
    expect(record.entity_type).toBe('room')
    expect(record.entity_id).toBe('room-001')
    expect(record.department).toBe('COLLEGE')
    expect(record.action).toBe('CREATE')
    expect(record.after_snapshot).toBe(JSON.stringify({ code: 'R101', building: 'Main' }))
    expect(record.id).toBeDefined()
    expect(record.created_at).toBeDefined()
  })

  // 8. queryAuditLog filters by entity_type
  it('queryAuditLog filters records by entity_type', () => {
    logAudit({
      entity_type: 'room',
      entity_id: 'room-001',
      action: 'CREATE'
    })
    logAudit({
      entity_type: 'personnel',
      entity_id: 'pers-001',
      action: 'CREATE'
    })
    logAudit({
      entity_type: 'room',
      entity_id: 'room-002',
      action: 'UPDATE'
    })

    const { records, total } = queryAuditLog({ entity_type: 'room' })

    expect(total).toBe(2)
    expect(records).toHaveLength(2)
    for (const r of records as Record<string, unknown>[]) {
      expect(r.entity_type).toBe('room')
    }
  })

  // 9. queryAuditLog filters by action
  it('queryAuditLog filters records by action', () => {
    logAudit({
      entity_type: 'section',
      entity_id: 'sec-001',
      action: 'CREATE'
    })
    logAudit({
      entity_type: 'section',
      entity_id: 'sec-001',
      action: 'UPDATE'
    })
    logAudit({
      entity_type: 'section',
      entity_id: 'sec-002',
      action: 'DELETE'
    })

    const { records, total } = queryAuditLog({ action: 'UPDATE' })

    expect(total).toBe(1)
    expect(records).toHaveLength(1)
    expect((records[0] as Record<string, unknown>).action).toBe('UPDATE')
  })

  // 10. queryAuditLog supports limit
  it('queryAuditLog respects the limit parameter', () => {
    for (let i = 0; i < 10; i++) {
      logAudit({
        entity_type: 'room',
        entity_id: `room-${i.toString().padStart(3, '0')}`,
        action: 'CREATE'
      })
    }

    const { records, total } = queryAuditLog({ limit: 3 })

    // total reflects ALL matching rows regardless of limit
    expect(total).toBe(10)
    // records are capped at the limit
    expect(records).toHaveLength(3)
  })
})
