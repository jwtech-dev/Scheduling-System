// Semester Handlers — TASK-06
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as semService from '../../services/semester-service'

export function registerSemesterHandlers(): void {
  registerHandler(IPC_CHANNELS.SEMESTERS_CREATE, (args) => semService.createSemester(args as never))
  registerHandler(IPC_CHANNELS.SEMESTERS_UPDATE, (args) => semService.updateSemester(args as never))
  registerHandler(IPC_CHANNELS.SEMESTERS_PUBLISH, (args) => semService.publishSemester((args as { id: string }).id))
}
