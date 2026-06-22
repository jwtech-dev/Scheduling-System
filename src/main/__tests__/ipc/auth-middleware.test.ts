// ============================================================
// Auth Middleware — Unit Tests
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { setAuthenticated, getIsAuthenticated, clearSession, checkAuth } from '../../ipc/auth-middleware'

describe('Auth Middleware', () => {
  beforeEach(() => {
    clearSession()
  })

  describe('setAuthenticated / getIsAuthenticated', () => {
    it('should default to unauthenticated', () => {
      expect(getIsAuthenticated()).toBe(false)
    })

    it('should set authenticated state to true', () => {
      setAuthenticated(true)
      expect(getIsAuthenticated()).toBe(true)
    })

    it('should set authenticated state to false', () => {
      setAuthenticated(true)
      setAuthenticated(false)
      expect(getIsAuthenticated()).toBe(false)
    })
  })

  describe('clearSession', () => {
    it('should reset to unauthenticated', () => {
      setAuthenticated(true)
      expect(getIsAuthenticated()).toBe(true)
      clearSession()
      expect(getIsAuthenticated()).toBe(false)
    })
  })

  describe('checkAuth', () => {
    it('should return null when authenticated', () => {
      setAuthenticated(true)
      const result = checkAuth()
      expect(result).toBeNull()
    })

    it('should return UNAUTHORIZED error when not authenticated', () => {
      setAuthenticated(false)
      const result = checkAuth()
      expect(result).not.toBeNull()
      expect(result!.data).toBeNull()
      expect(result!.error).toBeDefined()
      expect(result!.error!.code).toBe('UNAUTHORIZED')
      expect(result!.error!.message).toContain('Authentication required')
    })

    it('should return UNAUTHORIZED after clearSession', () => {
      setAuthenticated(true)
      clearSession()
      const result = checkAuth()
      expect(result).not.toBeNull()
      expect(result!.error!.code).toBe('UNAUTHORIZED')
    })
  })
})
