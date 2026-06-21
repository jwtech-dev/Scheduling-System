// ============================================================
// Semester Auto-Generator — preview and create semesters (and
// quarters for Two-Semester) for a given grade level + term type.
// ============================================================

import { getDatabase } from '../database/connection'
import { createSemester } from './semester-service'
import { createQuarter } from './quarter-service'
import type { AcademicYear, GradeLevel, TermType, SemesterType, QuarterLabel, Semester } from '../../shared/types'

interface SemesterPreview {
  semester_type: SemesterType
  start_date: string
  end_date: string
  quarters: Array<{ label: QuarterLabel; start_date: string; end_date: string }>
}

/**
 * Preview: compute default dates for the admin to review/adjust before saving.
 *
 * Rules per user spec:
 * - 1st semester start_date = AY start_date
 * - Last semester end_date = AY end_date
 * - Interior boundaries split equally (admin can adjust)
 */
export function previewSemesterGeneration(
  ay: AcademicYear,
  _gradeLevel: GradeLevel,
  termType: TermType
): SemesterPreview[] {
  if (termType === 'TWO_SEMESTER') {
    return [
      {
        semester_type: '1ST_SEMESTER',
        start_date: ay.start_date,
        end_date: '',
        quarters: [
          { label: 'Q1', start_date: '', end_date: '' },
          { label: 'Q2', start_date: '', end_date: '' }
        ]
      },
      {
        semester_type: '2ND_SEMESTER',
        start_date: '',
        end_date: ay.end_date,
        quarters: [
          { label: 'Q3', start_date: '', end_date: '' },
          { label: 'Q4', start_date: '', end_date: '' }
        ]
      }
    ]
  } else {
    // TRIMESTRAL: 3 semesters, no quarters
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
}

/**
 * Execute: save semesters (and quarters) with admin-provided dates.
 * Wrapped in a transaction so partial failures roll back completely.
 */
export function executeSemesterGeneration(
  ay: AcademicYear,
  gradeLevel: GradeLevel,
  termType: TermType,
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
        grade_level: gradeLevel,
        term_type: termType
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
