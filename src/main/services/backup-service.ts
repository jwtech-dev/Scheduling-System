// ============================================================
// Backup & Restore Service — TASK-23
// ============================================================

import { app, dialog } from 'electron'
import { existsSync } from 'fs'
import { copyFile, mkdir, readdir, readFile, stat, unlink } from 'fs/promises'
import { join } from 'path'
import { getDbPath, closeDatabase, initDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { setSetting } from './settings-service'
import { clearRateLimitState } from './auth-service'
import { SETTINGS_KEYS, DEFAULTS, ERROR_CODES } from '../../shared/constants'

const SQLITE_MAGIC = 'SQLite format 3\0'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

function validateFilename(filename: string): void {
  if (
    filename.includes('/') ||
    filename.includes('\\') ||
    filename.includes('..')
  ) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Invalid backup filename.')
  }
}

async function ensureDir(dir: string): Promise<string> {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })
  return dir
}

async function getBackupDir(): Promise<string> {
  return ensureDir(join(app.getPath('userData'), 'backups'))
}

async function getAutoBackupDir(): Promise<string> {
  const base = await getBackupDir()
  return ensureDir(join(base, 'auto'))
}

async function verifyIntegrity(dbPath: string): Promise<void> {
  const Database = (await import('better-sqlite3')).default
  const db = new Database(dbPath, { readonly: true })
  try {
    const row = db.pragma('integrity_check') as Array<{ integrity_check: string }>
    if (!row.length || row[0].integrity_check !== 'ok') {
      throwError(ERROR_CODES.VALIDATION_ERROR, 'Backup integrity check failed.')
    }
  } finally {
    db.close()
  }
}

async function validateSqliteFile(filePath: string): Promise<void> {
  const header = await readFile(filePath, { flag: 'r' })
  const magic = header.subarray(0, 16).toString('utf-8')
  if (magic !== SQLITE_MAGIC) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'File is not a valid SQLite database.')
  }
}

/**
 * Create a manual backup — user chooses save location via dialog.
 */
export async function createBackup(): Promise<{ path: string }> {
  const dbPath = getDbPath()
  if (!existsSync(dbPath)) {
    throwError(ERROR_CODES.NOT_FOUND, 'Database file not found.')
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const defaultName = `sched-mng-backup-${timestamp}.db`

  const result = await dialog.showSaveDialog({
    title: 'Save Backup',
    defaultPath: defaultName,
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  })

  if (result.canceled || !result.filePath) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Backup cancelled.')
  }

  await copyFile(dbPath, result.filePath)
  await verifyIntegrity(result.filePath)

  // Update last backup date
  try {
    setSetting(SETTINGS_KEYS.LAST_BACKUP_DATE, new Date().toISOString())
  } catch {
    // Non-critical — don't fail the backup
  }

  return { path: result.filePath }
}

/**
 * Restore from a user-selected backup file.
 */
export async function restoreBackup(): Promise<{ success: boolean }> {
  const result = await dialog.showOpenDialog({
    title: 'Select Backup to Restore',
    filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    properties: ['openFile']
  })

  if (result.canceled || result.filePaths.length === 0) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Restore cancelled.')
  }

  const backupPath = result.filePaths[0]
  await validateSqliteFile(backupPath)

  const dbPath = getDbPath()

  // Create auto-backup of current DB before overwriting
  await createAutoBackup()

  // Close current connection, copy backup over, reopen
  closeDatabase()
  await copyFile(backupPath, dbPath)
  initDatabase(dbPath)

  // Clear rate limit state to prevent restored lockout from trapping users
  clearRateLimitState()

  return { success: true }
}

/**
 * Create an automatic backup (used before restore and on schedule).
 */
export async function createAutoBackup(): Promise<string> {
  const dbPath = getDbPath()
  if (!existsSync(dbPath)) return ''

  const autoDir = await getAutoBackupDir()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupPath = join(autoDir, `auto-${timestamp}.db`)

  await copyFile(dbPath, backupPath)
  await verifyIntegrity(backupPath)

  // Prune old auto-backups (keep latest N)
  await pruneAutoBackups()

  return backupPath
}

/**
 * List available auto-backups.
 */
export async function listAutoBackups(): Promise<Array<{ filename: string; size: number; created: string }>> {
  const autoDir = await getAutoBackupDir()
  try {
    const files = await readdir(autoDir)
    const dbFiles = files.filter((f) => f.endsWith('.db'))
    const entries = await Promise.all(
      dbFiles.map(async (f) => {
        const s = await stat(join(autoDir, f))
        return { filename: f, size: s.size, created: s.mtime.toISOString() }
      })
    )
    return entries.sort((a, b) => b.created.localeCompare(a.created))
  } catch {
    return []
  }
}

/**
 * Restore from a named auto-backup.
 */
export async function restoreAutoBackup(filename: string): Promise<{ success: boolean }> {
  validateFilename(filename)

  const autoDir = await getAutoBackupDir()
  const backupPath = join(autoDir, filename)

  if (!existsSync(backupPath)) {
    throwError(ERROR_CODES.NOT_FOUND, `Auto-backup "${filename}" not found.`)
  }

  await validateSqliteFile(backupPath)

  const dbPath = getDbPath()
  closeDatabase()
  await copyFile(backupPath, dbPath)
  initDatabase(dbPath)

  // Clear rate limit state to prevent restored lockout from trapping users
  clearRateLimitState()

  return { success: true }
}

/**
 * Delete an auto-backup.
 */
export async function deleteAutoBackup(filename: string): Promise<void> {
  validateFilename(filename)

  const autoDir = await getAutoBackupDir()
  const backupPath = join(autoDir, filename)
  if (existsSync(backupPath)) {
    await unlink(backupPath)
  }
}

/**
 * Keep only the latest N auto-backups.
 */
async function pruneAutoBackups(): Promise<void> {
  const autoDir = await getAutoBackupDir()
  const dirFiles = await readdir(autoDir)
  const dbFiles = dirFiles.filter((f) => f.endsWith('.db'))

  const entries = await Promise.all(
    dbFiles.map(async (f) => ({
      name: f,
      time: (await stat(join(autoDir, f))).mtime.getTime()
    }))
  )
  entries.sort((a, b) => b.time - a.time)

  const max = DEFAULTS.AUTO_BACKUP_MAX_FILES
  for (let i = max; i < entries.length; i++) {
    try {
      await unlink(join(autoDir, entries[i].name))
    } catch {
      // Non-critical — skip files that can't be removed
    }
  }
}
