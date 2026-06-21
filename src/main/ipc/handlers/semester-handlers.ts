// Semester Handlers — TASK-06
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as semService from '../../services/semester-service'
import { generateSemestersForGradeLevel } from '../../services/semester-auto-generator'
import { getAcademicYear } from '../../services/academic-year-service'
import type { GradeLevel, TermType } from '../../../shared/types'

export function registerSemesterHandlers(): void {
  registerHandler(IPC_CHANNELS.SEMESTERS_CREATE, (args) => semService.createSemester(args as never))
  registerHandler(IPC_CHANNELS.SEMESTERS_UPDATE, (args) => semService.updateSemester(args as never))
  registerHandler(IPC_CHANNELS.SEMESTERS_PUBLISH, (args) => semService.publishSemester((args as { id: string }).id))
  registerHandler(IPC_CHANNELS.SEMESTERS_DELETE, (args) => semService.deleteSemester((args as { id: string }).id))
  registerHandler(IPC_CHANNELS.SEMESTERS_GENERATE, (args) => {
    const { academic_year_id, grade_level, term_type } = args as {
      academic_year_id: string; grade_level: GradeLevel; term_type: TermType
    }
    const ay = getAcademicYear(academic_year_id)
    return generateSemestersForGradeLevel(ay, grade_level, term_type)
  })
}
