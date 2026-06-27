// ============================================================
// Active Term Resolution — TASK-07
// ============================================================

import { getDatabase } from '../database/connection'
import type { AcademicYear, Semester, Department, GradeLevel, ActiveTerm, GradeLevelTerm } from '../../shared/types'
import { resolveCurrentQuarter } from './quarter-service'

/**
 * Resolve the active term for a department, optionally scoped to a grade level (SHS only).
 *
 * - College: Returns single active AY + semester (grade_level ignored).
 * - SHS without gradeLevel: Returns active AY + first active semester found +
 *   gradeLevelTerms map (one entry per grade level with its active semester + quarter).
 * - SHS with gradeLevel: Returns active AY + that grade level's active semester + quarter.
 */
export function getActiveTerm(department: Department, gradeLevel?: GradeLevel): ActiveTerm {
  const db = getDatabase()

  // For SHS with a specific grade level, look up the grade-level-specific AY
  if (department === 'SHS' && gradeLevel) {
    const academicYear = db
      .prepare('SELECT * FROM academic_years WHERE department = ? AND grade_level = ? AND is_active = 1')
      .get(department, gradeLevel) as AcademicYear | undefined

    if (!academicYear) {
      return { academicYear: null, semester: null, quarter: null }
    }

    const semester = db
      .prepare('SELECT * FROM semesters WHERE academic_year_id = ? AND grade_level = ? AND is_active = 1 AND archived_at IS NULL')
      .get(academicYear.id, gradeLevel) as Semester | undefined

    if (!semester) {
      return { academicYear, semester: null, quarter: null }
    }

    const quarter = resolveCurrentQuarter(semester.id)
    return { academicYear, semester, quarter }
  }

  // Get the active academic year for this department (College or SHS without grade level)
  const academicYear = db
    .prepare('SELECT * FROM academic_years WHERE department = ? AND is_active = 1')
    .get(department) as AcademicYear | undefined

  if (!academicYear) {
    return { academicYear: null, semester: null, quarter: null }
  }

  // === College: unchanged single-semester logic ===
  if (department !== 'SHS') {
    const semester = db
      .prepare('SELECT * FROM semesters WHERE academic_year_id = ? AND is_active = 1 AND archived_at IS NULL')
      .get(academicYear.id) as Semester | undefined

    if (!semester) {
      return { academicYear, semester: null, quarter: null }
    }

    return { academicYear, semester, quarter: null }
  }

  // === SHS without grade level: query both active AYs (one per grade level) ===
  const activeAYs = db
    .prepare('SELECT * FROM academic_years WHERE department = ? AND is_active = 1')
    .all(department) as AcademicYear[]

  if (activeAYs.length === 0) {
    return { academicYear: null, semester: null, quarter: null }
  }

  // Build per-grade-level map from separate AYs
  const gradeLevelTerms: Record<GradeLevel, GradeLevelTerm> = {
    GRADE_11: { semester: null, quarter: null },
    GRADE_12: { semester: null, quarter: null }
  }

  let firstAY: AcademicYear | null = null
  let firstSemester: Semester | null = null
  let firstQuarter = null

  for (const ay of activeAYs) {
    const ayGL = (ay as AcademicYear & { grade_level?: string }).grade_level
    if (ayGL === 'GRADE_11' || ayGL === 'GRADE_12') {
      const sem = db
        .prepare('SELECT * FROM semesters WHERE academic_year_id = ? AND is_active = 1 AND archived_at IS NULL')
        .get(ay.id) as Semester | undefined

      if (sem) {
        const quarter = resolveCurrentQuarter(sem.id)
        gradeLevelTerms[ayGL] = { semester: sem, quarter }

        if (!firstSemester) {
          firstAY = ay
          firstSemester = sem
          firstQuarter = quarter
        }
      } else if (!firstAY) {
        firstAY = ay
      }
    } else {
      // Legacy AY without grade_level
      const activeSemesters = db
        .prepare('SELECT * FROM semesters WHERE academic_year_id = ? AND is_active = 1 AND archived_at IS NULL')
        .all(ay.id) as Semester[]

      for (const sem of activeSemesters) {
        if (sem.grade_level === 'GRADE_11' || sem.grade_level === 'GRADE_12') {
          const quarter = resolveCurrentQuarter(sem.id)
          gradeLevelTerms[sem.grade_level] = { semester: sem, quarter }
          if (!firstSemester) {
            firstAY = ay
            firstSemester = sem
            firstQuarter = quarter
          }
        } else if (!sem.grade_level && !firstSemester) {
          firstAY = ay
          firstSemester = sem
          firstQuarter = resolveCurrentQuarter(sem.id)
        }
      }
      if (!firstAY) firstAY = ay
    }
  }

  return {
    academicYear: firstAY ?? activeAYs[0],
    semester: firstSemester,
    quarter: firstQuarter,
    gradeLevelTerms
  }
}
