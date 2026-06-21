// Active Term Handler — TASK-07
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { getActiveTerm } from '../../services/active-term-service'
import type { Department, GradeLevel } from '../../../shared/types'

export function registerActiveTermHandlers(): void {
  registerHandler(IPC_CHANNELS.ACTIVE_TERM_GET, (args) => {
    const { department, grade_level } = args as { department: Department; grade_level?: GradeLevel }
    return getActiveTerm(department, grade_level)
  })
}
