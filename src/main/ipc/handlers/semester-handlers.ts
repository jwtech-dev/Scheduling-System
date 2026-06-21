// Semester Handlers — TASK-06
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as semService from '../../services/semester-service'
import { previewSemesterGeneration, executeSemesterGeneration } from '../../services/semester-auto-generator'
import { getAcademicYear } from '../../services/academic-year-service'
import type { GradeLevel, TermType, SemesterType } from '../../../shared/types'

export function registerSemesterHandlers(): void {
  registerHandler(IPC_CHANNELS.SEMESTERS_CREATE, (args) => semService.createSemester(args as never))
  registerHandler(IPC_CHANNELS.SEMESTERS_UPDATE, (args) => semService.updateSemester(args as never))
  registerHandler(IPC_CHANNELS.SEMESTERS_PUBLISH, (args) => semService.publishSemester((args as { id: string }).id))
  registerHandler(IPC_CHANNELS.SEMESTERS_DELETE, (args) => semService.deleteSemester((args as { id: string }).id))

  // Preview: compute default dates without saving
  registerHandler(IPC_CHANNELS.SEMESTERS_GENERATE_PREVIEW, (args) => {
    const { academic_year_id, grade_level, term_type } = args as {
      academic_year_id: string; grade_level: GradeLevel; term_type: TermType
    }
    const ay = getAcademicYear(academic_year_id)
    return previewSemesterGeneration(ay, grade_level, term_type)
  })

  // Execute: save with admin-provided dates (transactional)
  registerHandler(IPC_CHANNELS.SEMESTERS_GENERATE_EXECUTE, (args) => {
    const { academic_year_id, grade_level, term_type, semesters } = args as {
      academic_year_id: string; grade_level: GradeLevel; term_type: TermType
      semesters: Array<{ semester_type: SemesterType; start_date: string; end_date: string }>
    }
    const ay = getAcademicYear(academic_year_id)
    return executeSemesterGeneration(ay, grade_level, term_type, semesters)
  })
}
