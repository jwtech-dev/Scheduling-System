// Publish Handlers — TASK-16
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as publishService from '../../services/publish-service'

export function registerPublishHandlers(): void {
  registerHandler(IPC_CHANNELS.SCHEDULES_PUBLISH, (args) => {
    const { ids } = args as { ids: string[] }
    return publishService.publishEntries(ids)
  })
  registerHandler(IPC_CHANNELS.SCHEDULES_UNPUBLISH, (args) => {
    const { ids } = args as { ids: string[] }
    return publishService.unpublishEntries(ids)
  })
  registerHandler(IPC_CHANNELS.SCHEDULES_REVALIDATE, (args) =>
    publishService.revalidatePublishedEntries((args ?? {}) as never)
  )
}
