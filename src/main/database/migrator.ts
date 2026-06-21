// ============================================================
// Database Migrator
// ============================================================
// Sequential DDL script runner with version tracking.
// Migrations are stored in src/main/database/migrations/ as .sql files.
// Applied versions tracked in _schema_versions table.

import { getDatabase } from './connection'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

/**
 * Ensure the _schema_versions tracking table exists.
 */
function ensureVersionTable(): void {
  const db = getDatabase()
  db.exec(`
    CREATE TABLE IF NOT EXISTS _schema_versions (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
}

/**
 * Get the list of already-applied migration versions.
 */
function getAppliedVersions(): Set<string> {
  const db = getDatabase()
  const rows = db.prepare('SELECT version FROM _schema_versions ORDER BY version').all() as Array<{
    version: string
  }>
  return new Set(rows.map((r) => r.version))
}

/**
 * Get the migrations directory path.
 * In development: relative to source. In production: relative to compiled output.
 */
function getMigrationsDir(): string {
  // In both dev and prod, migrations are bundled alongside the main process code
  return join(__dirname, 'migrations')
}

/**
 * Run all pending migrations in sequential order.
 * Each migration runs in its own transaction.
 */
export function runMigrations(): void {
  ensureVersionTable()
  repair018OrphanedTable()

  const applied = getAppliedVersions()
  const migrationsDir = getMigrationsDir()

  let files: string[]
  try {
    files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()
  } catch (err: unknown) {
    // No migrations directory yet — that's fine for initial scaffold
    const code = (err as NodeJS.ErrnoException)?.code
    if (code === 'ENOENT') return
    console.error('[ERROR] Failed to read migrations directory:', err)
    throw err
  }

  const db = getDatabase()

  for (const file of files) {
    const version = file.replace(/\.sql$/, '')
    if (applied.has(version)) continue

    const sql = readFileSync(join(migrationsDir, file), 'utf-8')

    const runMigration = db.transaction(() => {
      db.exec(sql)
      db.prepare('INSERT INTO _schema_versions (version) VALUES (?)').run(version)
    })

    try {
      runMigration()
      console.log(`Migration applied: ${version}`)
    } catch (err) {
      console.error(`Migration failed: ${version}`, err)
      throw err
    }
  }
}

/**
 * Check if any migrations have been applied (used for first-run detection).
 */
export function hasMigrations(): boolean {
  const db = getDatabase()
  try {
    const row = db
      .prepare("SELECT COUNT(*) as count FROM _schema_versions WHERE version != ''")
      .get() as { count: number } | undefined
    return (row?.count ?? 0) > 0
  } catch {
    return false
  }
}

/**
 * Repair: if migration 018 partially failed, it may have left the DB
 * with _semesters_old (from ALTER TABLE RENAME) but no semesters table.
 * SQLite DDL can persist even when the wrapping transaction rolls back.
 *
 * This repairs the state so migration 018 can re-run cleanly.
 */
function repair018OrphanedTable(): void {
  const db = getDatabase()

  const hasOld = db
    .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='_semesters_old'")
    .get()
  if (!hasOld) return

  const hasCurrent = db
    .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='semesters'")
    .get()

  if (!hasCurrent) {
    // _semesters_old exists but semesters doesn't → rename it back
    console.log('[REPAIR] Recovering orphaned _semesters_old → semesters')
    db.exec('ALTER TABLE _semesters_old RENAME TO semesters')
  } else {
    // Both exist → drop the orphan
    console.log('[REPAIR] Dropping orphaned _semesters_old (semesters table already exists)')
    db.exec('DROP TABLE _semesters_old')
  }

  // Also clean up any partial _semesters_new from failed attempts
  db.exec('DROP TABLE IF EXISTS _semesters_new')

  // Remove the 018 version entry so it can re-run with the fixed migration
  db.prepare("DELETE FROM _schema_versions WHERE version = '018_grade_level_term_types'").run()
  console.log('[REPAIR] Cleared migration 018 version entry for clean re-run')
}
