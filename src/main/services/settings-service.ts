// ============================================================
// Settings Service — App Configuration CRUD
// ============================================================
// Manages the app_settings key-value store.
// Used for setup detection, period lengths, time slots, and branding.

import { getDatabase } from '../database/connection'
import type { AppSetting } from '../../shared/types'
import { SETTINGS_KEYS } from '../../shared/constants'

/**
 * Get a single setting value by key.
 */
export function getSetting(key: string): string | null {
  const db = getDatabase()
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined
  return row?.value ?? null
}

/**
 * Get all settings as a key-value map.
 */
export function getAllSettings(): Record<string, string> {
  const db = getDatabase()
  const rows = db.prepare('SELECT key, value FROM app_settings').all() as AppSetting[]
  const result: Record<string, string> = {}
  for (const row of rows) {
    result[row.key] = row.value
  }
  return result
}

/**
 * Set a single setting value. Creates or updates.
 */
export function setSetting(key: string, value: string): void {
  const db = getDatabase()
  db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(key, value)
}

/**
 * Set multiple settings at once within a transaction.
 */
export function setSettings(settings: Record<string, string>): void {
  const db = getDatabase()
  const insert = db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  )
  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      insert.run(key, value)
    }
  })
  tx()
}

/**
 * Check if the admin password has been set (setup completed).
 */
export function hasAdminPassword(): boolean {
  const hash = getSetting(SETTINGS_KEYS.ADMIN_PASSWORD_HASH)
  return hash !== null && hash.length > 0
}

/**
 * Validate and update a setting value.
 */
export function updateSetting(key: string, value: string): void {
  // Validate specific settings
  if (
    key === SETTINGS_KEYS.SHS_PERIOD_LENGTH ||
    key === SETTINGS_KEYS.COLLEGE_PERIOD_LENGTH
  ) {
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 15 || num > 180) {
      const err = new Error('Period length must be between 15 and 180 minutes')
      ;(err as Error & { code: string }).code = 'VALIDATION_ERROR'
      throw err
    }
  }

  if (
    key === SETTINGS_KEYS.SHS_TIME_SLOT_START ||
    key === SETTINGS_KEYS.SHS_TIME_SLOT_END ||
    key === SETTINGS_KEYS.COLLEGE_TIME_SLOT_START ||
    key === SETTINGS_KEYS.COLLEGE_TIME_SLOT_END
  ) {
    if (!/^\d{2}:\d{2}$/.test(value)) {
      const err = new Error('Time slot must be in HH:MM format')
      ;(err as Error & { code: string }).code = 'VALIDATION_ERROR'
      throw err
    }
  }

  if (key === SETTINGS_KEYS.FOOTER_CREDIT && value.length > 200) {
    const err = new Error('Footer credit must not exceed 200 characters')
    ;(err as Error & { code: string }).code = 'VALIDATION_ERROR'
    throw err
  }

  setSetting(key, value)
}
