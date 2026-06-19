// Program Handlers
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as programService from '../../services/program-service'

export function registerProgramHandlers(): void {
  registerHandler(IPC_CHANNELS.PROGRAMS_LIST, (args) =>
    programService.listPrograms((args ?? {}) as never)
  )
  registerHandler(IPC_CHANNELS.PROGRAMS_CREATE, (args) =>
    programService.createProgram(args as never)
  )
  registerHandler(IPC_CHANNELS.PROGRAMS_UPDATE, (args) =>
    programService.updateProgram(args as never)
  )
  registerHandler(IPC_CHANNELS.PROGRAMS_DELETE, (args) => {
    const { id } = args as { id: string }
    programService.deleteProgram(id)
    return { success: true }
  })
}
