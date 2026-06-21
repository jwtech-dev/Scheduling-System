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
 * Repair: migration 018 used ALTER TABLE semesters RENAME TO _semesters_old.
 * SQLite >= 3.26 auto-updates FK references in child tables (quarters, sections,
 * schedule_entries, etc.) to point to _semesters_old. After the migration dropped
 * _semesters_old and created a new semesters table, those FK references are broken.
 *
 * This repair fixes:
 * 1. Orphaned _semesters_old table (if the migration partially failed)
 * 2. Broken FK references in child tables pointing to _semesters_old
 */
function repair018OrphanedTable(): void {
  const db = getDatabase()

  // Fix 1: Orphaned _semesters_old table
  const hasOld = db
    .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='_semesters_old'")
    .get()
  if (hasOld) {
    const hasCurrent = db
      .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='semesters'")
      .get()

    if (!hasCurrent) {
      console.log('[REPAIR] Recovering orphaned _semesters_old → semesters')
      db.exec('ALTER TABLE _semesters_old RENAME TO semesters')
    } else {
      console.log('[REPAIR] Dropping orphaned _semesters_old (semesters already exists)')
      db.exec('DROP TABLE _semesters_old')
    }
  }

  // Clean up partial _semesters_new
  db.exec('DROP TABLE IF EXISTS _semesters_new')

  // Fix 2: Broken FK references in child tables pointing to _semesters_old
  // SQLite >= 3.26 auto-updates child table CREATE statements during RENAME.
  // We rebuild affected tables with corrected FK references.
  const brokenRefs = db
    .prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND sql LIKE '%_semesters_old%'")
    .all() as Array<{ name: string; sql: string }>

  if (brokenRefs.length > 0) {
    console.log(`[REPAIR] Fixing ${brokenRefs.length} table(s) with broken _semesters_old FK references`)

    // Must disable FK checks during rebuild
    db.pragma('foreign_keys = OFF')

    for (const { name, sql } of brokenRefs) {
      const fixedSql = sql.replace(/_semesters_old/g, 'semesters')
      const tempName = `_${name}_fk_repair`
      const tempCreateSql = fixedSql.replace(
        new RegExp(`CREATE\\s+TABLE\\s+(?:"${name}"|${name})`, 'i'),
        `CREATE TABLE "${tempName}"`
      )

      console.log(`[REPAIR]   Rebuilding table: ${name}`)

      // Get columns from the existing table
      const cols = db.pragma(`table_info("${name}")`) as Array<{ name: string }>
      const colList = cols.map(c => `"${c.name}"`).join(', ')

      // Create temp with correct FK, copy data, swap
      db.exec(tempCreateSql)
      db.exec(`INSERT INTO "${tempName}" (${colList}) SELECT ${colList} FROM "${name}"`)
      db.exec(`DROP TABLE "${name}"`)
      db.exec(`ALTER TABLE "${tempName}" RENAME TO "${name}"`)
    }

    // Verify integrity
    const check = db.pragma('integrity_check') as Array<{ integrity_check: string }>
    if (check[0]?.integrity_check !== 'ok') {
      console.error('[REPAIR] Integrity check after FK repair:', check)
    } else {
      console.log('[REPAIR] Integrity check passed')
    }

    // Re-enable FK checks
    db.pragma('foreign_keys = ON')
  }
}
