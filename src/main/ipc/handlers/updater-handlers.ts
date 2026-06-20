// Updater Handlers — In-App Update IPC
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as updateService from '../../services/update-service'

export function registerUpdaterHandlers(): void {
  registerHandler(IPC_CHANNELS.UPDATER_CHECK, () => updateService.checkForUpdates())
  registerHandler(IPC_CHANNELS.UPDATER_DOWNLOAD, () => updateService.downloadUpdate())
  registerHandler(IPC_CHANNELS.UPDATER_GET_STATUS, () => ({
    ...updateService.getUpdateStatus(),
    isDismissed: updateService.isDismissed()
  }))
  registerHandler(IPC_CHANNELS.UPDATER_DISMISS, () => {
    updateService.dismissUpdate()
    return { success: true }
  })
  registerHandler(IPC_CHANNELS.UPDATER_INSTALL, () => {
    updateService.installUpdate()
    return { success: true }
  })
}
