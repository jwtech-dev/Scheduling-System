// ============================================================
// Test Database Helper
// ============================================================
// Creates an in-memory SQLite database with all migrations applied.
// Services call getDatabase() which is mocked to return this instance.
//
// Usage in test files:
//   import { setupTestDb, teardownTestDb, getTestDb } from '../helpers/test-db'
//   vi.mock('../../database/connection', () => ({
//     getDatabase: () => getTestDb(),
//     initDatabase: vi.fn(),
//     closeDatabase: vi.fn(),
//     getDbPath: vi.fn(() => ':memory:'),
//   }))

import Database from 'better-sqlite3'
import { readdirSync, readFileSync } from 'fs'
import { join, resolve } from 'path'

let testDb: Database.Database | null = null

/**
 * Resolve the migrations directory relative to the project root.
 * Works regardless of where vitest runs the test from.
 */
function getMigrationsDir(): string {
  return resolve(__dirname, '../../database/migrations')
}

/**
 * Create a fresh in-memory SQLite database and apply all migrations.
 * Call this in beforeEach or beforeAll.
 */
export function setupTestDb(): Database.Database {
  // Close any existing test DB
  if (testDb) {
    try { testDb.close() } catch { /* ignore */ }
  }

  testDb = new Database(':memory:')

  // Apply the same PRAGMAs as production (except WAL — not supported for :memory:)
  testDb.pragma('foreign_keys = ON')
  testDb.pragma('busy_timeout = 5000')

  // Create the schema versions table
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS _schema_versions (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Run all migration files in order
  const migrationsDir = getMigrationsDir()
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8')
    const version = file.replace(/\.sql$/, '')

    const runMigration = testDb.transaction(() => {
      testDb!.exec(sql)
      testDb!
        .prepare('INSERT INTO _schema_versions (version) VALUES (?)')
        .run(version)
    })

    runMigration()
  }

  return testDb
}

/**
 * Get the current test database instance.
 * Throws if setupTestDb() hasn't been called.
 */
export function getTestDb(): Database.Database {
  if (!testDb) {
    throw new Error('Test DB not initialized. Call setupTestDb() in beforeAll/beforeEach.')
  }
  return testDb
}

/**
 * Close and discard the in-memory test database.
 * Call this in afterAll or afterEach.
 */
export function teardownTestDb(): void {
  if (testDb) {
    try {
      testDb.close()
    } catch {
      /* ignore close errors in tests */
    }
    testDb = null
  }
}

/**
 * Clean all data from the database for test isolation.
 * Handles the append-only audit_log trigger by temporarily dropping it.
 */
export function cleanAllTables(): void {
  const db = getTestDb()

  // Drop audit_log protection triggers
  db.exec('DROP TRIGGER IF EXISTS audit_log_no_delete')
  db.exec('DROP TRIGGER IF EXISTS audit_log_no_update')

  // Delete in FK-safe order (children first)
  db.exec('DELETE FROM schedule_entries')
  db.exec('DELETE FROM audit_log')
  db.exec('DELETE FROM sections')
  db.exec('DELETE FROM personnel')
  db.exec('DELETE FROM rooms')
  db.exec('DELETE FROM calendar_events')
  db.exec('DELETE FROM quarters')
  db.exec('DELETE FROM semesters')
  db.exec('DELETE FROM academic_years')
  db.exec('DELETE FROM subject_bank')
  db.exec('DELETE FROM programs')
  db.exec('DELETE FROM app_settings')

  // Re-create the protection triggers
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS audit_log_no_delete
    BEFORE DELETE ON audit_log
    BEGIN
      SELECT RAISE(ABORT, 'Audit log records cannot be deleted');
    END
  `)
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS audit_log_no_update
    BEFORE UPDATE ON audit_log
    BEGIN
      SELECT RAISE(ABORT, 'Audit log records cannot be modified');
    END
  `)
}
