// Quarter Handlers
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as quarterService from '../../services/quarter-service'

export function registerQuarterHandlers(): void {
  registerHandler(IPC_CHANNELS.QUARTERS_LIST, (args) => {
    const { semester_id } = args as { semester_id: string }
    return quarterService.listQuarters(semester_id)
  })

  registerHandler(IPC_CHANNELS.QUARTERS_CREATE, (args) =>
    quarterService.createQuarter(args as never)
  )

  registerHandler(IPC_CHANNELS.QUARTERS_UPDATE, (args) =>
    quarterService.updateQuarter(args as never)
  )

  registerHandler(IPC_CHANNELS.QUARTERS_DELETE, (args) => {
    const { id } = args as { id: string }
    quarterService.deleteQuarter(id)
  })
}
