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
  registerHandler(IPC_CHANNELS.PROGRAMS_DELETE_IMPACT, (args) => {
    const { id } = args as { id: string }
    return programService.getProgramDeleteImpact(id)
  })
  registerHandler(IPC_CHANNELS.PROGRAMS_DELETE, (args) => {
    const { id } = args as { id: string }
    const result = programService.deleteProgram(id)
    return { success: true, ...result }
  })
}
