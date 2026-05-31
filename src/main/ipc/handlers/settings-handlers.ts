// ============================================================
// Settings Handlers — App Configuration IPC
// ============================================================

import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { getSetting, getAllSettings, updateSetting } from '../../services/settings-service'

export function registerSettingsHandlers(): void {
  registerHandler(IPC_CHANNELS.SETTINGS_GET, (args) => {
    const { key } = args as { key: string }
    return { key, value: getSetting(key) }
  })

  registerHandler(IPC_CHANNELS.SETTINGS_GET_ALL, () => {
    return getAllSettings()
  })

  registerHandler(IPC_CHANNELS.SETTINGS_UPDATE, (args) => {
    const { key, value } = args as { key: string; value: string }
    updateSetting(key, value)
    return { success: true }
  })
}
