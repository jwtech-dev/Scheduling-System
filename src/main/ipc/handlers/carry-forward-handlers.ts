// Carry Forward Handlers
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as carryForwardService from '../../services/carry-forward-service'
import type { CarryForwardRequest } from '../../../shared/types'

export function registerCarryForwardHandlers(): void {
  registerHandler(IPC_CHANNELS.CARRY_FORWARD_PREVIEW, (args) =>
    carryForwardService.previewCarryForward(args as CarryForwardRequest)
  )
  registerHandler(IPC_CHANNELS.CARRY_FORWARD_EXECUTE, (args) =>
    carryForwardService.executeCarryForward(args as CarryForwardRequest)
  )
}
