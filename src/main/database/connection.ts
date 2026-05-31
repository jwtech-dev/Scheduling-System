// ============================================================
// SQLite Connection Manager
// ============================================================
// Single connection, synchronous API via better-sqlite3.
// PRAGMAs: WAL, FK ON, busy_timeout 5000, cache_size 64MB, synchronous NORMAL.

import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

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
 */
export function initDatabase(dbPath?: string): Database.Database {
  if (db) return db

  const path = dbPath ?? getDbPath()
  db = new Database(path)

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
 * Close the database connection.
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

/**
 * Replace the current database connection with a new one (used by restore).
 */
export function replaceDatabase(newDbPath: string): void {
  closeDatabase()
  db = null
  initDatabase(newDbPath)
}
