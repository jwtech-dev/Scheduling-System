// Schedule Entry Handlers — TASK-12
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as schedService from '../../services/schedule-entry-service'

export function registerScheduleHandlers(): void {
  registerHandler(IPC_CHANNELS.SCHEDULES_LIST, (args) => schedService.listScheduleEntries((args ?? {}) as never))
  registerHandler(IPC_CHANNELS.SCHEDULES_LIST_DRAFT, (args) => schedService.listDraftEntries((args ?? {}) as never))
  registerHandler(IPC_CHANNELS.SCHEDULES_CREATE_DRAFT, (args) => schedService.createDraftEntry(args as never))
  registerHandler(IPC_CHANNELS.SCHEDULES_UPDATE_DRAFT, (args) => schedService.updateDraftEntry(args as never))
  registerHandler(IPC_CHANNELS.SCHEDULES_DELETE_DRAFT, (args) => {
    const { id } = args as { id: string }
    schedService.deleteDraftEntry(id)
    return { success: true }
  })
  registerHandler(IPC_CHANNELS.SCHEDULES_VALIDATE, (args) => schedService.validateEntryDryRun(args as never))
  registerHandler(IPC_CHANNELS.SCHEDULES_LIST_EXAM, (args) => {
    const filters = (args ?? {}) as Record<string, unknown>
    return schedService.listScheduleEntries({ ...filters, activity_type: 'EXAM' } as never)
  })
}
