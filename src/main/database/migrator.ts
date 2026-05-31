// ============================================================
// Database Migrator
// ============================================================
// Sequential DDL script runner with version tracking.
// Migration SQL is imported as raw strings so the bundler includes them.
// Applied versions tracked in _schema_versions table.

import { getDatabase } from './connection'

// Import migration SQL as raw strings — bundler will inline them
import initialSchema from './migrations/001_initial_schema.sql?raw'

/** Ordered list of migrations. Add new migrations here. */
const MIGRATIONS: Array<{ version: string; sql: string }> = [
  { version: '001_initial_schema', sql: initialSchema }
]

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
 * Run all pending migrations in sequential order.
 * Each migration runs in its own transaction.
 */
export function runMigrations(): void {
  ensureVersionTable()

  const applied = getAppliedVersions()
  const db = getDatabase()

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue

    const runMigration = db.transaction(() => {
      db.exec(migration.sql)
      db.prepare('INSERT INTO _schema_versions (version) VALUES (?)').run(migration.version)
    })

    try {
      runMigration()
      console.log(`Migration applied: ${migration.version}`)
    } catch (err) {
      console.error(`Migration failed: ${migration.version}`, err)
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
