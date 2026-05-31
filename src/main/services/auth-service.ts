// ============================================================
// Auth Service — Single-Account Password Authentication
// ============================================================
// bcryptjs hash verification, in-memory session flag.
// No tokens, no expiry — session persists until app closes.

import bcrypt from 'bcryptjs'
import { getSetting, setSetting } from './settings-service'
import { setAuthenticated, getIsAuthenticated } from '../ipc/auth-middleware'
import { SETTINGS_KEYS, DEFAULTS, ERROR_CODES } from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

/**
 * Attempt login with password.
 */
export function login(password: string): { success: boolean } {
  const hash = getSetting(SETTINGS_KEYS.ADMIN_PASSWORD_HASH)
  if (!hash) {
    throwError(ERROR_CODES.INVALID_CREDENTIALS, 'No password configured. Run setup first.')
  }

  const valid = bcrypt.compareSync(password, hash)
  if (!valid) {
    throwError(ERROR_CODES.INVALID_CREDENTIALS, 'Invalid password.')
  }

  setAuthenticated(true)
  return { success: true }
}

/**
 * Change the admin password. Requires current password verification.
 */
export function changePassword(currentPassword: string, newPassword: string): { success: boolean } {
  // Verify current password
  const hash = getSetting(SETTINGS_KEYS.ADMIN_PASSWORD_HASH)
  if (!hash || !bcrypt.compareSync(currentPassword, hash)) {
    throwError(ERROR_CODES.WRONG_CURRENT_PASSWORD, 'Current password is incorrect.')
  }

  // Validate new password
  if (!newPassword || newPassword.length < DEFAULTS.PASSWORD_MIN_LENGTH) {
    throwError(
      ERROR_CODES.PASSWORD_TOO_SHORT,
      `Password must be at least ${DEFAULTS.PASSWORD_MIN_LENGTH} characters.`
    )
  }

  // Hash and store
  const newHash = bcrypt.hashSync(newPassword, DEFAULTS.BCRYPT_COST)
  setSetting(SETTINGS_KEYS.ADMIN_PASSWORD_HASH, newHash)

  return { success: true }
}

/**
 * Log out — clear the authenticated flag.
 */
export function logout(): void {
  setAuthenticated(false)
}

/**
 * Check if the current session is authenticated.
 */
export function isAuthenticated(): boolean {
  return getIsAuthenticated()
}
