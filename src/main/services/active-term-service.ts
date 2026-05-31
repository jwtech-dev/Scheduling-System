// ============================================================
// Active Term Resolution — TASK-07
// ============================================================

import { getDatabase } from '../database/connection'
import type { AcademicYear, Semester, Department, ActiveTerm } from '../../shared/types'

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
    .prepare('SELECT * FROM semesters WHERE academic_year_id = ? AND is_active = 1')
    .get(academicYear.id) as Semester | undefined

  if (!semester) {
    return { academicYear, semester: null, quarter: null }
  }

  // For SHS, resolve the current quarter based on date
  let quarter: string | null = null
  if (department === 'SHS') {
    quarter = resolveQuarter(semester)
  }

  return { academicYear, semester, quarter }
}

/**
 * Resolve the current quarter for an SHS semester.
 * Uses q1_end_date/q3_end_date boundaries and current date.
 */
function resolveQuarter(semester: Semester): string | null {
  const now = new Date().toISOString().split('T')[0]

  if (semester.semester_type === '1ST_SEMESTER') {
    if (semester.q1_end_date && now <= semester.q1_end_date) {
      return 'Q1'
    }
    return 'Q2'
  }

  if (semester.semester_type === '2ND_SEMESTER') {
    if (semester.q3_end_date && now <= semester.q3_end_date) {
      return 'Q3'
    }
    return 'Q4'
  }

  return null
}
