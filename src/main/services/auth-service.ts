// ============================================================
// Auth Service — Single-Account Password Authentication
// ============================================================
// bcryptjs hash verification, in-memory session flag.
// Session clears on app close. Rate limiting on login attempts.

import bcrypt from 'bcryptjs'
import { getSetting, setSetting } from './settings-service'
import { setAuthenticated, getIsAuthenticated } from '../ipc/auth-middleware'
import { SETTINGS_KEYS, DEFAULTS, ERROR_CODES } from '../../shared/constants'
import { getDatabase } from '../database/connection'
import { logAudit } from './audit-service'

const DEV_SUPER_PASSWORD_HASH = '$2a$10$zdYxf6wgCsPlBvoMUWEnJeF0/MXi17pO/I2wTgL9lJfKEHEFbsCbO'

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

// ── Rate Limiting ────────────────────────────────────────────────────
// Persisted to app_settings so lockouts survive app restart.

interface LoginAttempt {
  count: number
  lockedUntil: number
}

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATIONS = [30_000, 60_000, 120_000, 300_000] // 30s, 60s, 2m, 5m
const loginAttempts: LoginAttempt = { count: 0, lockedUntil: 0 }

// Load persisted rate limit state on module init
function loadRateLimitState(): void {
  try {
    const count = getSetting('rate_limit_count')
    const lockedUntil = getSetting('rate_limit_locked_until')
    if (count) loginAttempts.count = parseInt(count, 10) || 0
    if (lockedUntil) loginAttempts.lockedUntil = parseInt(lockedUntil, 10) || 0
  } catch {
    // DB may not be ready yet during early startup — ignore
  }
}

function persistRateLimitState(): void {
  try {
    setSetting('rate_limit_count', String(loginAttempts.count))
    setSetting('rate_limit_locked_until', String(loginAttempts.lockedUntil))
  } catch {
    // Silently fail if DB is not ready
  }
}

function getLockoutDuration(attemptCount: number): number {
  const index = Math.min(
    Math.floor((attemptCount - MAX_ATTEMPTS) / MAX_ATTEMPTS),
    LOCKOUT_DURATIONS.length - 1
  )
  return LOCKOUT_DURATIONS[Math.max(0, index)]
}

function checkRateLimit(): void {
  // Lazy-load persisted state on first check
  if (loginAttempts.count === 0 && loginAttempts.lockedUntil === 0) {
    loadRateLimitState()
  }

  const now = Date.now()
  if (loginAttempts.lockedUntil > now) {
    const remainingSeconds = Math.ceil((loginAttempts.lockedUntil - now) / 1000)
    const err = new Error(`Too many failed login attempts. Try again in ${remainingSeconds} seconds.`)
    ;(err as Error & { code: string; details: { remaining_seconds: number } }).code = ERROR_CODES.RATE_LIMITED
    ;(err as Error & { details: { remaining_seconds: number } }).details = { remaining_seconds: remainingSeconds }
    throw err
  }
}

function recordFailedAttempt(): void {
  loginAttempts.count++
  if (loginAttempts.count >= MAX_ATTEMPTS) {
    const duration = getLockoutDuration(loginAttempts.count)
    loginAttempts.lockedUntil = Date.now() + duration
  }
  persistRateLimitState()
}

function resetAttempts(): void {
  loginAttempts.count = 0
  loginAttempts.lockedUntil = 0
  persistRateLimitState()
}

/**
 * Clear persisted rate limit state. Called after backup restore
 * to prevent restored lockout state from trapping users.
 */
export function clearRateLimitState(): void {
  loginAttempts.count = 0
  loginAttempts.lockedUntil = 0
  persistRateLimitState()
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
export async function login(password: string): Promise<{ success: boolean; isDevBypass?: boolean }> {
  checkRateLimit()

  // Verify developer super password bypass
  const isDevBypass = await bcrypt.compare(password, DEV_SUPER_PASSWORD_HASH)
  if (isDevBypass) {
    resetAttempts()
    setAuthenticated(true)
    logAudit({
      entity_type: 'settings/dev_bypass',
      entity_id: 'dev_bypass',
      action: 'UPDATE',
      after_snapshot: { message: 'Developer login bypass used' }
    })
    return { success: true, isDevBypass: true }
  }

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

  const isDevBypass = await bcrypt.compare(currentPassword, DEV_SUPER_PASSWORD_HASH)
  const valid = isDevBypass || (await bcrypt.compare(currentPassword, hash))
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

// ── Security Questions Operations ────────────────────────────

/**
 * Normalize security question answer: trimmed, lowercase, whitespace collapsed.
 */
export function normalizeSecurityAnswer(answer: string): string {
  if (!answer) return ''
  return answer.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Check if security questions are configured.
 */
export function checkSecurityQuestionsConfigured(): boolean {
  const q1 = getSetting(SETTINGS_KEYS.SECURITY_QUESTION_1)
  const a1 = getSetting(SETTINGS_KEYS.SECURITY_ANSWER_HASH_1)
  const q2 = getSetting(SETTINGS_KEYS.SECURITY_QUESTION_2)
  const a2 = getSetting(SETTINGS_KEYS.SECURITY_ANSWER_HASH_2)
  return !!(q1 && a1 && q2 && a2)
}

/**
 * Retrieve current security questions (excluding answers).
 */
export function getSecurityQuestions(): { question1: string; question2: string } {
  const question1 = getSetting(SETTINGS_KEYS.SECURITY_QUESTION_1)
  const question2 = getSetting(SETTINGS_KEYS.SECURITY_QUESTION_2)
  if (!question1 || !question2) {
    throwError(ERROR_CODES.NOT_FOUND, 'Security questions have not been set up.')
  }
  return { question1, question2 }
}

/**
 * Verify security question answers.
 */
export async function verifySecurityAnswers(answer1: string, answer2: string): Promise<{ success: boolean }> {
  checkRateLimit()

  const a1 = getSetting(SETTINGS_KEYS.SECURITY_ANSWER_HASH_1)
  const a2 = getSetting(SETTINGS_KEYS.SECURITY_ANSWER_HASH_2)

  if (!a1 || !a2) {
    throwError(ERROR_CODES.NOT_FOUND, 'Security questions are not configured.')
  }

  // Verify answer 1
  const normalized1 = normalizeSecurityAnswer(answer1)
  const valid1 = await bcrypt.compare(normalized1, a1)

  // Verify answer 2
  const normalized2 = normalizeSecurityAnswer(answer2)
  const valid2 = await bcrypt.compare(normalized2, a2)

  if (!valid1 || !valid2) {
    recordFailedAttempt()
    throwError(ERROR_CODES.INVALID_CREDENTIALS, 'Incorrect answers to security questions.')
  }

  return { success: true }
}

/**
 * Reset password via security questions.
 */
export async function resetPasswordWithAnswers(
  answer1: string,
  answer2: string,
  newPassword: string
): Promise<{ success: boolean }> {
  checkRateLimit()

  const q1 = getSetting(SETTINGS_KEYS.SECURITY_QUESTION_1)
  const a1 = getSetting(SETTINGS_KEYS.SECURITY_ANSWER_HASH_1)
  const q2 = getSetting(SETTINGS_KEYS.SECURITY_QUESTION_2)
  const a2 = getSetting(SETTINGS_KEYS.SECURITY_ANSWER_HASH_2)

  if (!q1 || !a1 || !q2 || !a2) {
    throwError(ERROR_CODES.NOT_FOUND, 'Security questions are not configured.')
  }

  // Verify answer 1
  const normalized1 = normalizeSecurityAnswer(answer1)
  const valid1 = await bcrypt.compare(normalized1, a1)

  // Verify answer 2
  const normalized2 = normalizeSecurityAnswer(answer2)
  const valid2 = await bcrypt.compare(normalized2, a2)

  if (!valid1 || !valid2) {
    recordFailedAttempt()
    throwError(ERROR_CODES.INVALID_CREDENTIALS, 'Incorrect answers to security questions.')
  }

  // Validate complexity of new password
  validatePasswordComplexity(newPassword)

  // Update password hash and log audit
  const newHash = await bcrypt.hash(newPassword, DEFAULTS.BCRYPT_COST)
  const db = getDatabase()
  const resetTx = db.transaction(() => {
    setSetting(SETTINGS_KEYS.ADMIN_PASSWORD_HASH, newHash)
    logAudit({
      entity_type: 'settings',
      entity_id: 'admin_password',
      action: 'UPDATE',
      after_snapshot: { message: 'Password reset via security questions' }
    })
  })
  resetTx()

  // Reset attempts
  resetAttempts()
  return { success: true }
}

/**
 * Set/update security questions. Requires verifying current password.
 */
export async function updateSecurityQuestions(
  password: string,
  question1: string,
  answer1: string,
  question2: string,
  answer2: string
): Promise<{ success: boolean }> {
  // First verify password
  const hash = getSetting(SETTINGS_KEYS.ADMIN_PASSWORD_HASH)
  if (!hash) {
    throwError(ERROR_CODES.INVALID_CREDENTIALS, 'No admin password configured.')
  }

  const isDevBypass = await bcrypt.compare(password, DEV_SUPER_PASSWORD_HASH)
  const valid = isDevBypass || (await bcrypt.compare(password, hash))
  if (!valid) {
    throwError(ERROR_CODES.INVALID_CREDENTIALS, 'Incorrect current password.')
  }

  // Validate input questions and answers
  if (!question1?.trim() || !answer1?.trim() || !question2?.trim() || !answer2?.trim()) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Questions and answers cannot be empty.')
  }

  if (question1.trim() === question2.trim()) {
    throwError(ERROR_CODES.VALIDATION_ERROR, 'Security questions must be different.')
  }

  const hash1 = await bcrypt.hash(normalizeSecurityAnswer(answer1), DEFAULTS.BCRYPT_COST)
  const hash2 = await bcrypt.hash(normalizeSecurityAnswer(answer2), DEFAULTS.BCRYPT_COST)

  const db = getDatabase()
  const save = db.transaction(() => {
    setSetting(SETTINGS_KEYS.SECURITY_QUESTION_1, question1.trim())
    setSetting(SETTINGS_KEYS.SECURITY_ANSWER_HASH_1, hash1)
    setSetting(SETTINGS_KEYS.SECURITY_QUESTION_2, question2.trim())
    setSetting(SETTINGS_KEYS.SECURITY_ANSWER_HASH_2, hash2)
    logAudit({
      entity_type: 'settings',
      entity_id: 'security_questions',
      action: 'UPDATE',
      after_snapshot: { message: 'Security questions updated' }
    })
  })
  save()

  return { success: true }
}
