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
      const msg = (err as Error).message ?? ''
      // Schema already exists (e.g. duplicate column, table already exists) — safe to skip
      const isSchemaExists = /duplicate column name|table .* already exists/i.test(msg)
      if (isSchemaExists) {
        // Mark as applied since schema is already in the correct state
        try {
          db.prepare('INSERT OR IGNORE INTO _schema_versions (version) VALUES (?)').run(version)
        } catch { /* ignore */ }
        console.log(`Migration skipped (already applied): ${version}`)
      } else {
        console.error(`Migration failed: ${version}`, err)
        throw err
      }
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
