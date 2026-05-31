// ============================================================
// Auth Middleware — IPC Guard
// ============================================================
// Checks the in-memory isAuthenticated flag before allowing
// IPC handler execution. Returns UNAUTHORIZED response if not authenticated.

import type { IpcResponse } from '../../shared/types'
import { ERROR_CODES } from '../../shared/constants'

// In-memory auth state — persists until app closes
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
