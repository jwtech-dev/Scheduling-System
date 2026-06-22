// ============================================================
// Auth Service — Unit Tests
// ============================================================

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { setupTestDb, teardownTestDb, cleanAllTables, getTestDb } from '../helpers/test-db'

vi.mock('../../database/connection', async () => {
  const helpers = await import('../helpers/test-db')
  return {
    getDatabase: () => helpers.getTestDb(),
    initDatabase: vi.fn(),
    closeDatabase: vi.fn(),
    getDbPath: vi.fn(() => ':memory:')
  }
})

import {
  validatePasswordComplexity,
  login,
  logout,
  isAuthenticated,
  normalizeSecurityAnswer,
  clearRateLimitState
} from '../../services/auth-service'
import { setSetting } from '../../services/settings-service'
import bcrypt from 'bcryptjs'
import { SETTINGS_KEYS } from '../../../shared/constants'

describe('Auth Service', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    teardownTestDb()
  })

  beforeEach(() => {
    cleanAllTables()
    clearRateLimitState()
  })

  // ── Password Complexity ──────────────────────────────────────

  describe('validatePasswordComplexity', () => {
    it('should accept a valid password', () => {
      expect(() => validatePasswordComplexity('TestPass1')).not.toThrow()
    })

    it('should reject too-short password', () => {
      expect(() => validatePasswordComplexity('Aa1')).toThrow(/at least/)
    })

    it('should reject missing uppercase', () => {
      expect(() => validatePasswordComplexity('testpass1')).toThrow(/uppercase/)
    })

    it('should reject missing lowercase', () => {
      expect(() => validatePasswordComplexity('TESTPASS1')).toThrow(/lowercase/)
    })

    it('should reject missing number', () => {
      expect(() => validatePasswordComplexity('TestPassWord')).toThrow(/number/)
    })
  })

  // ── Login / Logout ───────────────────────────────────────────

  describe('login', () => {
    it('should login with correct password', async () => {
      const hash = await bcrypt.hash('ValidPass1', 10)
      setSetting(SETTINGS_KEYS.ADMIN_PASSWORD_HASH, hash)

      const result = await login('ValidPass1')
      expect(result.success).toBe(true)
      expect(isAuthenticated()).toBe(true)
    })

    it('should reject wrong password', async () => {
      const hash = await bcrypt.hash('CorrectPass1', 10)
      setSetting(SETTINGS_KEYS.ADMIN_PASSWORD_HASH, hash)

      await expect(login('WrongPass1')).rejects.toThrow(/Invalid password/)
    })

    it('should reject when no password configured', async () => {
      // No ADMIN_PASSWORD_HASH set
      await expect(login('AnyPass1')).rejects.toThrow(/No password configured/)
    })
  })

  describe('logout', () => {
    it('should clear authenticated state', async () => {
      const hash = await bcrypt.hash('TestPass1', 10)
      setSetting(SETTINGS_KEYS.ADMIN_PASSWORD_HASH, hash)
      await login('TestPass1')
      expect(isAuthenticated()).toBe(true)

      logout()
      expect(isAuthenticated()).toBe(false)
    })
  })

  // ── normalizeSecurityAnswer ──────────────────────────────────

  describe('normalizeSecurityAnswer', () => {
    it('should trim and lowercase', () => {
      expect(normalizeSecurityAnswer('  My Answer  ')).toBe('my answer')
    })

    it('should collapse whitespace', () => {
      expect(normalizeSecurityAnswer('hello   world')).toBe('hello world')
    })

    it('should handle empty string', () => {
      expect(normalizeSecurityAnswer('')).toBe('')
    })
  })

  // ── Rate Limiting ────────────────────────────────────────────

  describe('rate limiting', () => {
    it('should lock after 5 failed attempts', async () => {
      const hash = await bcrypt.hash('CorrectPass1', 10)
      setSetting(SETTINGS_KEYS.ADMIN_PASSWORD_HASH, hash)

      // Fail 5 times — the 5th should trigger lockout
      for (let i = 0; i < 4; i++) {
        try { await login('wrong') } catch { /* expected */ }
      }

      // 5th attempt should throw rate limited
      await expect(login('wrong')).rejects.toThrow(/Too many failed/)
    })
  })
})
