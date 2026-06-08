// ============================================================
// Auth Middleware — IPC Guard
// ============================================================
// Checks the in-memory isAuthenticated flag before allowing
// IPC handler execution. Returns UNAUTHORIZED response if not authenticated.
// Session clears on app close via clearSession().

import type { IpcResponse } from '../../shared/types'
import { ERROR_CODES } from '../../shared/constants'

// In-memory auth state — persists until app closes or clearSession() is called
let isAuthenticated = false

/**
 * Set the authentication state.
 */
export function setAuthenticated(value: boolean): void {
  isAuthenticated = value
}

/**
 * Get the current authentication state.
 */
export function getIsAuthenticated(): boolean {
  return isAuthenticated
}

/**
 * Clear the session — called on app close to ensure
 * next launch requires re-authentication.
 */
export function clearSession(): void {
  isAuthenticated = false
}

/**
 * Auth guard check. Returns null if authenticated, or an UNAUTHORIZED
 * error response if not authenticated.
 */
export function checkAuth(): IpcResponse | null {
  if (!isAuthenticated) {
    return {
      data: null,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication required. Please log in.'
      }
    }
  }
  return null
}
