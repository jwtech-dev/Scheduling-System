// Active Term Handler — TASK-07
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { getActiveTerm } from '../../services/active-term-service'
import type { Department } from '../../../shared/types'

export function registerActiveTermHandlers(): void {
  registerHandler(IPC_CHANNELS.ACTIVE_TERM_GET, (args) => {
    const { department } = args as { department: Department }
    return getActiveTerm(department)
  })
}
