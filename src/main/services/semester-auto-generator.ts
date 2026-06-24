// ============================================================
// Semester Auto-Generator — preview and create semesters
// for a given SHS grade level. Admin selects which semesters
// to create (up to 3: 1ST, 2ND, 3RD). Quarters are optional.
// ============================================================

import { getDatabase } from '../database/connection'
import { createSemester } from './semester-service'
import { createQuarter } from './quarter-service'
import type { AcademicYear, GradeLevel, SemesterType, QuarterLabel, Semester } from '../../shared/types'

interface SemesterPreview {
  semester_type: SemesterType
  start_date: string
  end_date: string
  quarters: Array<{ label: QuarterLabel; start_date: string; end_date: string }>
}

/**
 * Preview: generate default semester slots for the admin to review/adjust.
 *
 * Always returns all 3 semesters (1ST, 2ND, 3RD) with empty dates.
 * The admin removes unwanted semesters and fills in dates before saving.
 *
 * Rules:
 * - 1st semester start_date = AY start_date
 * - Last semester end_date = AY end_date
 * - Interior boundaries left empty (admin fills)
 */
export function previewSemesterGeneration(
  ay: AcademicYear,
  _gradeLevel: GradeLevel
): SemesterPreview[] {
  return [
    {
      semester_type: '1ST_SEMESTER',
      start_date: ay.start_date,
      end_date: '',
      quarters: []
    },
    {
      semester_type: '2ND_SEMESTER',
      start_date: '',
      end_date: '',
      quarters: []
    },
    {
      semester_type: '3RD_SEMESTER',
      start_date: '',
      end_date: ay.end_date,
      quarters: []
    }
  ]
}

/**
 * Execute: save semesters (and quarters) with admin-provided dates.
 * Wrapped in a transaction so partial failures roll back completely.
 */
export function executeSemesterGeneration(
  ay: AcademicYear,
  gradeLevel: GradeLevel,
  semesterDates: Array<{
    semester_type: SemesterType
    start_date: string
    end_date: string
    quarters?: Array<{ label: QuarterLabel; start_date: string; end_date: string }>
  }>
): Semester[] {
  const db = getDatabase()
  const created: Semester[] = []

  const run = db.transaction(() => {
    for (const sd of semesterDates) {
      const semester = createSemester({
        academic_year_id: ay.id,
        semester_type: sd.semester_type,
        start_date: sd.start_date,
        end_date: sd.end_date,
        grade_level: gradeLevel
      })
      created.push(semester)

      // Create quarters with admin-provided dates
      if (sd.quarters && sd.quarters.length > 0) {
        for (const q of sd.quarters) {
          createQuarter({
            semester_id: semester.id,
            quarter_label: q.label,
            start_date: q.start_date,
            end_date: q.end_date
          })
        }
      }
    }
  })

  run()
  return created
}
