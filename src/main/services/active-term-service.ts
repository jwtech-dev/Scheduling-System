// ============================================================
// Active Term Resolution — TASK-07
// ============================================================

import { getDatabase } from '../database/connection'
import type { AcademicYear, Semester, Department, ActiveTerm } from '../../shared/types'
import { resolveCurrentQuarter } from './quarter-service'

/**
 * Resolve the active term for a department.
 * Returns the active academic year, active semester, and current quarter (SHS only).
 */
export function getActiveTerm(department: Department): ActiveTerm {
  const db = getDatabase()

  // Get the active academic year for this department
  const academicYear = db
    .prepare('SELECT * FROM academic_years WHERE department = ? AND is_active = 1')
    .get(department) as AcademicYear | undefined

  if (!academicYear) {
    return { academicYear: null, semester: null, quarter: null }
  }

  // Get the active semester within this academic year
  const semester = db
    .prepare('SELECT * FROM semesters WHERE academic_year_id = ? AND is_active = 1 AND archived_at IS NULL')
    .get(academicYear.id) as Semester | undefined

  if (!semester) {
    return { academicYear, semester: null, quarter: null }
  }

  // For SHS, resolve the current quarter from the quarters table
  let quarter = null
  if (department === 'SHS') {
    quarter = resolveCurrentQuarter(semester.id)
  }

  return { academicYear, semester, quarter }
}
