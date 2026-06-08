// ============================================================
// Auth Service — Single-Account Password Authentication
// ============================================================
// bcryptjs hash verification, in-memory session flag.
// Session clears on app close. Rate limiting on login attempts.

import bcrypt from 'bcryptjs'
import { getSetting, setSetting } from './settings-service'
import { setAuthenticated, getIsAuthenticated } from '../ipc/auth-middleware'
import { SETTINGS_KEYS, DEFAULTS, ERROR_CODES } from '../../shared/constants'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

// ── Rate Limiting ────────────────────────────────────────────
// In-memory counter with escalating lockout. Resets on app restart.

interface LoginAttempt {
  count: number
  lockedUntil: number
}

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATIONS = [30_000, 60_000, 120_000, 300_000] // 30s, 60s, 2m, 5m
const loginAttempts: LoginAttempt = { count: 0, lockedUntil: 0 }

function getLockoutDuration(attemptCount: number): number {
  const index = Math.min(
    Math.floor((attemptCount - MAX_ATTEMPTS) / MAX_ATTEMPTS),
    LOCKOUT_DURATIONS.length - 1
  )
  return LOCKOUT_DURATIONS[Math.max(0, index)]
}

function checkRateLimit(): void {
  const now = Date.now()
  if (loginAttempts.lockedUntil > now) {
    const remainingSeconds = Math.ceil((loginAttempts.lockedUntil - now) / 1000)
    throwError(
      ERROR_CODES.RATE_LIMITED,
      `Too many failed login attempts. Try again in ${remainingSeconds} seconds.`
    )
  }
}

function recordFailedAttempt(): void {
  loginAttempts.count++
  if (loginAttempts.count >= MAX_ATTEMPTS) {
    const duration = getLockoutDuration(loginAttempts.count)
    loginAttempts.lockedUntil = Date.now() + duration
  }
}

function resetAttempts(): void {
  loginAttempts.count = 0
  loginAttempts.lockedUntil = 0
}

// ── Password Complexity ──────────────────────────────────────

/**
 * Validate password meets complexity requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 */
export function validatePasswordComplexity(password: string): void {
  if (!password || password.length < DEFAULTS.PASSWORD_MIN_LENGTH) {
    throwError(
      ERROR_CODES.PASSWORD_TOO_SHORT,
      `Password must be at least ${DEFAULTS.PASSWORD_MIN_LENGTH} characters.`
    )
  }
  if (!/[A-Z]/.test(password)) {
    throwError(ERROR_CODES.PASSWORD_TOO_WEAK, 'Password must contain at least one uppercase letter.')
  }
  if (!/[a-z]/.test(password)) {
    throwError(ERROR_CODES.PASSWORD_TOO_WEAK, 'Password must contain at least one lowercase letter.')
  }
  if (!/[0-9]/.test(password)) {
    throwError(ERROR_CODES.PASSWORD_TOO_WEAK, 'Password must contain at least one number.')
  }
}

// ── Auth Operations ──────────────────────────────────────────

/**
 * Attempt login with password. Async to avoid blocking main thread with bcrypt.
 */
export async function login(password: string): Promise<{ success: boolean }> {
  checkRateLimit()

  const hash = getSetting(SETTINGS_KEYS.ADMIN_PASSWORD_HASH)
  if (!hash) {
    throwError(ERROR_CODES.INVALID_CREDENTIALS, 'No password configured. Run setup first.')
  }

  const valid = await bcrypt.compare(password, hash)
  if (!valid) {
    recordFailedAttempt()
    throwError(ERROR_CODES.INVALID_CREDENTIALS, 'Invalid password.')
  }

  resetAttempts()
  setAuthenticated(true)
  return { success: true }
}

/**
 * Change the admin password. Requires current password verification.
 * Async for non-blocking bcrypt.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean }> {
  // Verify current password
  const hash = getSetting(SETTINGS_KEYS.ADMIN_PASSWORD_HASH)
  if (!hash) {
    throwError(ERROR_CODES.WRONG_CURRENT_PASSWORD, 'Current password is incorrect.')
  }

  const valid = await bcrypt.compare(currentPassword, hash)
  if (!valid) {
    throwError(ERROR_CODES.WRONG_CURRENT_PASSWORD, 'Current password is incorrect.')
  }

  // Validate new password complexity
  validatePasswordComplexity(newPassword)

  // Hash and store
  const newHash = await bcrypt.hash(newPassword, DEFAULTS.BCRYPT_COST)
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
