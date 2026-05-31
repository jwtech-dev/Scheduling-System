// ============================================================
// Backup & Restore Service — TASK-23
// ============================================================

import { app, dialog } from 'electron'
import { copyFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'fs'
import { join, basename } from 'path'
import { getDbPath, closeDatabase, initDatabase } from '../database/connection'
import { logAudit } from './audit-service'
import { setSetting } from './settings-service'
import { SETTINGS_KEYS, DEFAULTS, ERROR_CODES } from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

function getBackupDir(): string {
  const dir = join(app.getPath('userData'), 'backups')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function getAutoBackupDir(): string {
  const dir = join(getBackupDir(), 'auto')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
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

  copyFileSync(dbPath, result.filePath)

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
  const dbPath = getDbPath()

  // Create auto-backup of current DB before overwriting
  await createAutoBackup()

  // Close current connection, copy backup over, reopen
  closeDatabase()
  copyFileSync(backupPath, dbPath)
  initDatabase(dbPath)

  return { success: true }
}

/**
 * Create an automatic backup (used before restore and on schedule).
 */
export async function createAutoBackup(): Promise<string> {
  const dbPath = getDbPath()
  if (!existsSync(dbPath)) return ''

  const autoDir = getAutoBackupDir()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupPath = join(autoDir, `auto-${timestamp}.db`)

  copyFileSync(dbPath, backupPath)

  // Prune old auto-backups (keep latest N)
  pruneAutoBackups()

  return backupPath
}

/**
 * List available auto-backups.
 */
export function listAutoBackups(): Array<{ filename: string; size: number; created: string }> {
  const autoDir = getAutoBackupDir()
  try {
    return readdirSync(autoDir)
      .filter((f) => f.endsWith('.db'))
      .map((f) => {
        const stat = statSync(join(autoDir, f))
        return { filename: f, size: stat.size, created: stat.mtime.toISOString() }
      })
      .sort((a, b) => b.created.localeCompare(a.created))
  } catch {
    return []
  }
}

/**
 * Restore from a named auto-backup.
 */
export function restoreAutoBackup(filename: string): { success: boolean } {
  const autoDir = getAutoBackupDir()
  const backupPath = join(autoDir, filename)

  if (!existsSync(backupPath)) {
    throwError(ERROR_CODES.NOT_FOUND, `Auto-backup "${filename}" not found.`)
  }

  const dbPath = getDbPath()
  closeDatabase()
  copyFileSync(backupPath, dbPath)
  initDatabase(dbPath)

  return { success: true }
}

/**
 * Delete an auto-backup.
 */
export function deleteAutoBackup(filename: string): void {
  const autoDir = getAutoBackupDir()
  const backupPath = join(autoDir, filename)
  if (existsSync(backupPath)) {
    unlinkSync(backupPath)
  }
}

/**
 * Keep only the latest N auto-backups.
 */
function pruneAutoBackups(): void {
  const autoDir = getAutoBackupDir()
  const files = readdirSync(autoDir)
    .filter((f) => f.endsWith('.db'))
    .map((f) => ({
      name: f,
      time: statSync(join(autoDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time)

  const max = DEFAULTS.AUTO_BACKUP_MAX_FILES
  for (let i = max; i < files.length; i++) {
    unlinkSync(join(autoDir, files[i].name))
  }
}
