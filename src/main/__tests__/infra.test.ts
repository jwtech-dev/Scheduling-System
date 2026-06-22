// ============================================================
// Smoke Test — Verify test infrastructure works
// ============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupTestDb, teardownTestDb, getTestDb } from './helpers/test-db'

describe('Test Infrastructure', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  it('should create an in-memory database', () => {
    const db = getTestDb()
    expect(db).toBeDefined()
    expect(db.open).toBe(true)
  })

  it('should have all migrations applied', () => {
    const db = getTestDb()
    const rows = db.prepare('SELECT version FROM _schema_versions ORDER BY version').all() as Array<{
      version: string
    }>
    // We have 20 migrations (001 through 020)
    expect(rows.length).toBe(20)
    expect(rows[0].version).toBe('001_initial_schema')
    expect(rows[rows.length - 1].version).toBe('020_audit_log_expanded_actions')
  })

  it('should have foreign keys enabled', () => {
    const db = getTestDb()
    const result = db.pragma('foreign_keys') as Array<{ foreign_keys: number }>
    expect(result[0].foreign_keys).toBe(1)
  })

  it('should have the rooms table from migrations', () => {
    const db = getTestDb()
    const table = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='rooms'")
      .get() as { name: string } | undefined
    expect(table).toBeDefined()
    expect(table!.name).toBe('rooms')
  })

  it('should have the audit_log table from migrations', () => {
    const db = getTestDb()
    const table = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_log'")
      .get() as { name: string } | undefined
    expect(table).toBeDefined()
    expect(table!.name).toBe('audit_log')
  })
})
