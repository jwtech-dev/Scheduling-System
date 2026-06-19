// ============================================================
// SQLite Connection Manager
// ============================================================
// Single connection, synchronous API via better-sqlite3.
// PRAGMAs: WAL, FK ON, busy_timeout 5000, cache_size 64MB, synchronous NORMAL.

import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, unlinkSync } from 'fs'

let db: Database.Database | null = null

/**
 * Get the database file path.
 * In production: app.getPath('userData')/schedule-manager.db
 * In test: uses :memory: or a temp path.
 */
export function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true })
  }
  return join(userDataPath, 'schedule-manager.db')
}

/**
 * Initialize the database connection with required PRAGMAs.
 * Throws a descriptive error if the database cannot be opened.
 */
export function initDatabase(dbPath?: string): Database.Database {
  if (db) {
    // If called with a different path, warn — this is likely a bug
    const requestedPath = dbPath ?? getDbPath()
    if (db.name !== requestedPath) {
      console.warn(
        `[WARN] initDatabase called with different path. Current: ${db.name}, Requested: ${requestedPath}. Ignoring.`
      )
    }
    return db
  }

  const path = dbPath ?? getDbPath()

  try {
    db = new Database(path)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err)
    throw new Error(
      `Failed to open database at "${path}": ${message}. ` +
        'The file may be corrupted, locked by another process, or the disk may be full.'
    )
  }

  // Set PRAGMAs for performance and correctness
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  db.pragma('synchronous = NORMAL')
  db.pragma('cache_size = -64000') // 64MB

  return db
}

/**
 * Get the current database instance. Throws if not initialized.
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

/**
 * Close the database connection gracefully.
 * Handles errors during close to prevent zombie references.
 */
export function closeDatabase(): void {
  if (db) {
    try {
      db.close()
    } catch (err) {
      console.error('[WARN] Error closing database:', err)
    } finally {
      db = null
    }
  }
}

/**
 * Replace the current database connection with a new one (used by restore).
 */
export function replaceDatabase(newDbPath: string): void {
  closeDatabase()
  initDatabase(newDbPath)
}

/**
 * Reset the database: close, delete the file, re-initialize fresh.
 * The caller must re-run migrations after this.
 */
export function resetDatabase(): void {
  const path = db?.name ?? getDbPath()
  closeDatabase()

  // Delete the database file and WAL/SHM journal files
  for (const suffix of ['', '-wal', '-shm']) {
    const filePath = path + suffix
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
  }

  // Re-initialize a fresh empty database
  initDatabase(path)
}
