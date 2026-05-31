// ============================================================
// Recurrence Expander — TASK-12
// ============================================================
// Expands recurrence patterns into concrete occurrence dates.

import { MAX_RECURRENCE_OCCURRENCES } from '../../shared/constants'
import type { RecurrencePattern } from '../../shared/types'

export interface Occurrence {
  date: string // YYYY-MM-DD
  dayOfWeek: number // 0=Sun, 6=Sat
}

/**
 * Expand a recurrence pattern into concrete dates within the given range.
 */
export function expandRecurrence(
  pattern: RecurrencePattern,
  startDate: string,
  endDate: string | null,
  options: {
    dayOfWeek?: number | null
    dayOfMonth?: number | null
    weekOfMonth?: number | null
    customDays?: number[] | null
  } = {}
): Occurrence[] {
  const occurrences: Occurrence[] = []
  const start = new Date(startDate + 'T00:00:00')
  const end = endDate ? new Date(endDate + 'T23:59:59') : addMonths(start, 12) // Default 1 year

  switch (pattern) {
    case 'ONCE':
      occurrences.push({ date: startDate, dayOfWeek: start.getDay() })
      break

    case 'DAILY':
      iterateDays(start, end, 1, occurrences)
      break

    case 'WEEKDAYS':
      iterateDays(start, end, 1, occurrences, [1, 2, 3, 4, 5])
      break

    case 'WEEKLY':
      if (options.dayOfWeek != null) {
        iterateWeekly(start, end, [options.dayOfWeek], 1, occurrences)
      } else {
        iterateDays(start, end, 7, occurrences)
      }
      break

    case 'BI_WEEKLY':
      if (options.dayOfWeek != null) {
        iterateWeekly(start, end, [options.dayOfWeek], 2, occurrences)
      } else {
        iterateDays(start, end, 14, occurrences)
      }
      break

    case 'MWF':
      iterateWeekly(start, end, [1, 3, 5], 1, occurrences)
      break

    case 'TTH':
      iterateWeekly(start, end, [2, 4], 1, occurrences)
      break

    case 'MTH':
      iterateWeekly(start, end, [1, 2, 4], 1, occurrences)
      break

    case 'MONTHLY_DATE':
      iterateMonthlyByDate(start, end, options.dayOfMonth ?? start.getDate(), occurrences)
      break

    case 'MONTHLY_DAY':
      iterateMonthlyByDay(
        start,
        end,
        options.dayOfWeek ?? start.getDay(),
        options.weekOfMonth ?? Math.ceil(start.getDate() / 7),
        occurrences
      )
      break

    case 'CUSTOM':
      if (options.customDays && options.customDays.length > 0) {
        iterateWeekly(start, end, options.customDays, 1, occurrences)
      }
      break
  }

  return occurrences.slice(0, MAX_RECURRENCE_OCCURRENCES)
}

function iterateDays(
  start: Date,
  end: Date,
  step: number,
  out: Occurrence[],
  allowedDays?: number[]
): void {
  const cursor = new Date(start)
  while (cursor <= end && out.length < MAX_RECURRENCE_OCCURRENCES) {
    if (!allowedDays || allowedDays.includes(cursor.getDay())) {
      out.push({ date: formatDate(cursor), dayOfWeek: cursor.getDay() })
    }
    cursor.setDate(cursor.getDate() + step)
  }
}

function iterateWeekly(
  start: Date,
  end: Date,
  daysOfWeek: number[],
  weekInterval: number,
  out: Occurrence[]
): void {
  const cursor = new Date(start)
  // Rewind to the start of the week (Sunday)
  cursor.setDate(cursor.getDate() - cursor.getDay())

  let weekCount = 0
  while (cursor <= end && out.length < MAX_RECURRENCE_OCCURRENCES) {
    if (weekCount % weekInterval === 0) {
      for (const dow of daysOfWeek) {
        const day = new Date(cursor)
        day.setDate(day.getDate() + dow)
        if (day >= start && day <= end) {
          out.push({ date: formatDate(day), dayOfWeek: dow })
        }
      }
    }
    cursor.setDate(cursor.getDate() + 7)
    weekCount++
  }
}

function iterateMonthlyByDate(start: Date, end: Date, dayOfMonth: number, out: Occurrence[]): void {
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cursor <= end && out.length < MAX_RECURRENCE_OCCURRENCES) {
    const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const targetDay = Math.min(dayOfMonth, lastDay)
    const target = new Date(cursor.getFullYear(), cursor.getMonth(), targetDay)
    if (target >= start && target <= end) {
      out.push({ date: formatDate(target), dayOfWeek: target.getDay() })
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }
}

function iterateMonthlyByDay(
  start: Date,
  end: Date,
  dayOfWeek: number,
  weekOfMonth: number,
  out: Occurrence[]
): void {
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cursor <= end && out.length < MAX_RECURRENCE_OCCURRENCES) {
    const target = getNthDayOfMonth(cursor.getFullYear(), cursor.getMonth(), dayOfWeek, weekOfMonth)
    if (target && target >= start && target <= end) {
      out.push({ date: formatDate(target), dayOfWeek: target.getDay() })
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }
}

function getNthDayOfMonth(year: number, month: number, dayOfWeek: number, n: number): Date | null {
  const first = new Date(year, month, 1)
  let firstOccurrence = first.getDay() <= dayOfWeek
    ? dayOfWeek - first.getDay() + 1
    : 7 - first.getDay() + dayOfWeek + 1

  const day = firstOccurrence + (n - 1) * 7
  const lastDay = new Date(year, month + 1, 0).getDate()
  if (day > lastDay) return null
  return new Date(year, month, day)
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
