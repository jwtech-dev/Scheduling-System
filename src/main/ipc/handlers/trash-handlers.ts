// Trash Handlers — Phase 21
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as trashService from '../../services/trash-service'

export function registerTrashHandlers(): void {
  registerHandler(IPC_CHANNELS.TRASH_LIST, (args) => {
    const { entityType } = args as { entityType: string }
    return trashService.getArchivedItems(entityType)
  })

  registerHandler(IPC_CHANNELS.TRASH_COUNTS, () => {
    return trashService.getArchivedCounts()
  })

  registerHandler(IPC_CHANNELS.TRASH_RESTORE, (args) => {
    const { entityType, id } = args as { entityType: string; id: string }
    trashService.restoreItem(entityType, id)
    return { success: true }
  })

  registerHandler(IPC_CHANNELS.TRASH_PERMANENT_DELETE, (args) => {
    const { entityType, id } = args as { entityType: string; id: string }
    trashService.permanentDelete(entityType, id)
    return { success: true }
  })

  registerHandler(IPC_CHANNELS.TRASH_PURGE_EXPIRED, (args) => {
    const { retentionDays, force } = (args ?? {}) as { retentionDays?: number; force?: boolean }
    return trashService.purgeExpired(retentionDays, force)
  })
}
