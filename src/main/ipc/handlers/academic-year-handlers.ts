// Academic Year Handlers — TASK-05
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as ayService from '../../services/academic-year-service'
import type { Department } from '../../../shared/types'

export function registerAcademicYearHandlers(): void {
  registerHandler(IPC_CHANNELS.ACADEMIC_YEARS_LIST, (args) => {
    const { department } = args as { department: Department }
    return ayService.listAcademicYears(department)
  })
  registerHandler(IPC_CHANNELS.ACADEMIC_YEARS_GET, (args) => {
    const { id } = args as { id: string }
    return ayService.getAcademicYear(id)
  })
  registerHandler(IPC_CHANNELS.ACADEMIC_YEARS_CREATE, (args) => ayService.createAcademicYear(args as never))
  registerHandler(IPC_CHANNELS.ACADEMIC_YEARS_UPDATE, (args) => ayService.updateAcademicYear(args as never))
  registerHandler(IPC_CHANNELS.ACADEMIC_YEARS_GET_SEMESTERS, (args) => {
    const { id } = args as { id: string }
    return ayService.getAcademicYearSemesters(id)
  })
  registerHandler(IPC_CHANNELS.ACADEMIC_YEARS_DELETE, (args) => {
    const { id } = args as { id: string }
    return ayService.deleteAcademicYear(id)
  })
  registerHandler(IPC_CHANNELS.ACADEMIC_YEARS_PUBLISH, (args) => {
    const { id } = args as { id: string }
    return ayService.publishAcademicYear(id)
  })
}
