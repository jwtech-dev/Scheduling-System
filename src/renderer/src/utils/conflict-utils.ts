/**
 * Shared utilities for conflict flag parsing and classification.
 * Eliminates duplication across PersonnelDetailPage, ExamsPage, and ScheduleGrid.
 */
import { CONFLICT_CODES } from '@shared/constants'

/**
 * Set of conflict codes with HARD severity for fast lookup.
 */
export const HARD_CONFLICT_CODES = new Set(
  Object.values(CONFLICT_CODES)
    .filter((c) => c.severity === 'HARD')
    .map((c) => c.code)
)

/**
 * Parse a JSON-encoded conflict_flags string into hard/soft counts.
 */
export function parseConflictCounts(raw: string | null): { hard: number; soft: number } {
  if (!raw) return { hard: 0, soft: 0 }
  try {
    const flags: string[] = JSON.parse(raw)
    const hard = flags.filter((f) => HARD_CONFLICT_CODES.has(f)).length
    return { hard, soft: flags.length - hard }
  } catch {
    return { hard: 0, soft: 0 }
  }
}
