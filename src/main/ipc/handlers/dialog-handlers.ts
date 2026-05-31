// Dialog Handlers — File open/save dialogs
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { dialog } from 'electron'

export function registerDialogHandlers(): void {
  registerHandler(IPC_CHANNELS.DIALOG_OPEN_FILE, async (args) => {
    const options = (args ?? {}) as Electron.OpenDialogOptions
    return dialog.showOpenDialog(options)
  })

  registerHandler(IPC_CHANNELS.DIALOG_SAVE_FILE, async (args) => {
    const options = (args ?? {}) as Electron.SaveDialogOptions
    return dialog.showSaveDialog(options)
  })
}
