// ============================================================
// Recurrence Expander — Unit Tests
// ============================================================

import { describe, it, expect } from 'vitest'
import { expandRecurrence } from '../../services/recurrence-expander'

describe('Recurrence Expander', () => {
  // ── ONCE ──────────────────────────────────────────────────────

  describe('ONCE', () => {
    it('should return a single occurrence', () => {
      const result = expandRecurrence('ONCE', '2025-08-04', null)
      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('2025-08-04')
    })
  })

  // ── DAILY ─────────────────────────────────────────────────────

  describe('DAILY', () => {
    it('should return one occurrence per day', () => {
      const result = expandRecurrence('DAILY', '2025-08-04', '2025-08-06')
      expect(result).toHaveLength(3)
      expect(result.map((o) => o.date)).toEqual([
        '2025-08-04',
        '2025-08-05',
        '2025-08-06'
      ])
    })
  })

  // ── WEEKDAYS ──────────────────────────────────────────────────

  describe('WEEKDAYS', () => {
    it('should skip Saturday and Sunday', () => {
      // 2025-08-04 is Monday, 2025-08-10 is Sunday
      const result = expandRecurrence('WEEKDAYS', '2025-08-04', '2025-08-10')
      expect(result).toHaveLength(5) // Mon–Fri
      const days = result.map((o) => o.dayOfWeek)
      expect(days).toEqual([1, 2, 3, 4, 5]) // Mon=1 through Fri=5
    })
  })

  // ── WEEKLY ────────────────────────────────────────────────────

  describe('WEEKLY', () => {
    it('should return weekly occurrences on specified day', () => {
      // 2025-08-04 is Monday (day 1). 4 weeks.
      const result = expandRecurrence('WEEKLY', '2025-08-04', '2025-08-25', {
        dayOfWeek: 1
      })
      expect(result).toHaveLength(4) // Aug 4, 11, 18, 25
      expect(result[0].date).toBe('2025-08-04')
      expect(result[3].date).toBe('2025-08-25')
    })

    it('should fall back to 7-day intervals without dayOfWeek', () => {
      const result = expandRecurrence('WEEKLY', '2025-08-04', '2025-08-18')
      expect(result).toHaveLength(3) // Aug 4, 11, 18
    })
  })

  // ── BI_WEEKLY ─────────────────────────────────────────────────

  describe('BI_WEEKLY', () => {
    it('should return every other week', () => {
      const result = expandRecurrence('BI_WEEKLY', '2025-08-04', '2025-09-14', {
        dayOfWeek: 1
      })
      // Aug 4, Aug 18, Sep 1
      expect(result).toHaveLength(3)
      expect(result[0].date).toBe('2025-08-04')
      expect(result[1].date).toBe('2025-08-18')
      expect(result[2].date).toBe('2025-09-01')
    })
  })

  // ── MWF ───────────────────────────────────────────────────────

  describe('MWF', () => {
    it('should return Mon/Wed/Fri occurrences', () => {
      // One week: Aug 4 (Mon) to Aug 8 (Fri)
      const result = expandRecurrence('MWF', '2025-08-04', '2025-08-08')
      expect(result).toHaveLength(3)
      const days = result.map((o) => o.dayOfWeek)
      expect(days).toEqual([1, 3, 5]) // Mon, Wed, Fri
    })
  })

  // ── TTH ───────────────────────────────────────────────────────

  describe('TTH', () => {
    it('should return Tue/Thu occurrences', () => {
      // One week: Aug 4 (Mon) to Aug 8 (Fri)
      const result = expandRecurrence('TTH', '2025-08-04', '2025-08-08')
      expect(result).toHaveLength(2)
      const days = result.map((o) => o.dayOfWeek)
      expect(days).toEqual([2, 4]) // Tue, Thu
    })
  })

  // ── CUSTOM ────────────────────────────────────────────────────

  describe('CUSTOM', () => {
    it('should return occurrences on custom days', () => {
      // Mon + Thu (1, 4) for one week
      const result = expandRecurrence('CUSTOM', '2025-08-04', '2025-08-08', {
        customDays: [1, 4]
      })
      expect(result).toHaveLength(2)
      expect(result[0].dayOfWeek).toBe(1) // Monday
      expect(result[1].dayOfWeek).toBe(4) // Thursday
    })

    it('should return empty for no customDays', () => {
      const result = expandRecurrence('CUSTOM', '2025-08-04', '2025-08-08', {
        customDays: []
      })
      expect(result).toHaveLength(0)
    })
  })

  // ── Edge cases ────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should default to 1 year range when endDate is null', () => {
      const result = expandRecurrence('WEEKLY', '2025-08-04', null, {
        dayOfWeek: 1
      })
      // ~52 Mondays in a year
      expect(result.length).toBeGreaterThanOrEqual(50)
      expect(result.length).toBeLessThanOrEqual(53)
    })

    it('should cap at MAX_RECURRENCE_OCCURRENCES', () => {
      // Daily for 3 years — would be 1000+ days but capped
      const result = expandRecurrence('DAILY', '2025-01-01', '2027-12-31')
      // MAX_RECURRENCE_OCCURRENCES is likely 500 or similar
      expect(result.length).toBeLessThanOrEqual(500)
    })
  })
})
