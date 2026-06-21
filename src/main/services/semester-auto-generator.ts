// ============================================================
// Semester Auto-Generator — auto-creates semesters (and quarters
// for Two-Semester) for a given grade level and term type.
// ============================================================

import { createSemester } from './semester-service'
import { createQuarter } from './quarter-service'
import type { AcademicYear, GradeLevel, TermType, SemesterType, QuarterLabel, Semester } from '../../shared/types'

/**
 * Auto-generate semesters for a grade level within an SHS academic year.
 *
 * - TWO_SEMESTER: 1ST_SEMESTER + 2ND_SEMESTER, each with Q1/Q2 or Q3/Q4 quarters
 * - TRIMESTRAL: 1ST_SEMESTER + 2ND_SEMESTER + 3RD_SEMESTER, no quarters
 *
 * Dates are split equally across the AY range. Admin can adjust after creation.
 */
export function generateSemestersForGradeLevel(
  ay: AcademicYear,
  gradeLevel: GradeLevel,
  termType: TermType
): Semester[] {
  const startMs = new Date(ay.start_date).getTime()
  const endMs = new Date(ay.end_date).getTime()
  const totalMs = endMs - startMs

  const created: Semester[] = []

  if (termType === 'TWO_SEMESTER') {
    const semesterDefs: Array<{
      type: SemesterType
      startMs: number
      endMs: number
      quarters: Array<{ label: QuarterLabel; startFrac: number; endFrac: number }>
    }> = [
      {
        type: '1ST_SEMESTER',
        startMs: startMs,
        endMs: startMs + Math.floor(totalMs / 2),
        quarters: [
          { label: 'Q1', startFrac: 0, endFrac: 0.5 },
          { label: 'Q2', startFrac: 0.5, endFrac: 1 }
        ]
      },
      {
        type: '2ND_SEMESTER',
        startMs: startMs + Math.floor(totalMs / 2),
        endMs: endMs,
        quarters: [
          { label: 'Q3', startFrac: 0, endFrac: 0.5 },
          { label: 'Q4', startFrac: 0.5, endFrac: 1 }
        ]
      }
    ]

    for (const def of semesterDefs) {
      const semStartDate = toDateString(def.startMs)
      const semEndDate = toDateString(def.endMs)

      const semester = createSemester({
        academic_year_id: ay.id,
        semester_type: def.type,
        start_date: semStartDate,
        end_date: semEndDate,
        grade_level: gradeLevel,
        term_type: termType
      })
      created.push(semester)

      // Create quarters within this semester
      const semDuration = def.endMs - def.startMs
      for (const q of def.quarters) {
        const qStart = def.startMs + Math.floor(semDuration * q.startFrac)
        const qEnd = def.startMs + Math.floor(semDuration * q.endFrac)
        createQuarter({
          semester_id: semester.id,
          quarter_label: q.label,
          start_date: toDateString(qStart),
          end_date: toDateString(qEnd)
        })
      }
    }
  } else {
    // TRIMESTRAL: 3 equal semesters, no quarters
    const thirdMs = Math.floor(totalMs / 3)
    const semesterDefs: Array<{ type: SemesterType; startMs: number; endMs: number }> = [
      { type: '1ST_SEMESTER', startMs: startMs, endMs: startMs + thirdMs },
      { type: '2ND_SEMESTER', startMs: startMs + thirdMs, endMs: startMs + 2 * thirdMs },
      { type: '3RD_SEMESTER', startMs: startMs + 2 * thirdMs, endMs: endMs }
    ]

    for (const def of semesterDefs) {
      const semester = createSemester({
        academic_year_id: ay.id,
        semester_type: def.type,
        start_date: toDateString(def.startMs),
        end_date: toDateString(def.endMs),
        grade_level: gradeLevel,
        term_type: termType
      })
      created.push(semester)
    }
  }

  return created
}

/** Convert epoch ms to YYYY-MM-DD string */
function toDateString(ms: number): string {
  return new Date(ms).toISOString().split('T')[0]
}
