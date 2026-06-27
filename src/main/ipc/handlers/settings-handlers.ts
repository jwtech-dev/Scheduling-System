// ============================================================
// Settings Handlers — App Configuration IPC
// ============================================================

import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { SETTINGS_KEYS, ERROR_CODES } from '../../../shared/constants'
import { getSetting, getAllSettings, updateSetting } from '../../services/settings-service'

// Keys that must NEVER be read or written via the settings API
const BLOCKED_READ_KEYS = new Set([SETTINGS_KEYS.ADMIN_PASSWORD_HASH])

const BLOCKED_WRITE_KEYS = new Set([SETTINGS_KEYS.ADMIN_PASSWORD_HASH])

// Only allow known setting keys to be updated
const ALLOWED_UPDATE_KEYS = new Set([
  SETTINGS_KEYS.SHS_PERIOD_LENGTH,
  SETTINGS_KEYS.COLLEGE_PERIOD_LENGTH,
  SETTINGS_KEYS.SHS_TIME_SLOT_START,
  SETTINGS_KEYS.SHS_TIME_SLOT_END,
  SETTINGS_KEYS.COLLEGE_TIME_SLOT_START,
  SETTINGS_KEYS.COLLEGE_TIME_SLOT_END,
  SETTINGS_KEYS.INSTITUTION_LOGO,
  SETTINGS_KEYS.INSTITUTION_NAME,
  SETTINGS_KEYS.INSTITUTION_ADDRESS,
  SETTINGS_KEYS.INSTITUTION_CONTACT,
  SETTINGS_KEYS.INSTITUTION_EMAIL,
  SETTINGS_KEYS.FOOTER_CREDIT
])

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

export function registerSettingsHandlers(): void {
  registerHandler(IPC_CHANNELS.SETTINGS_GET, (args) => {
    const { key } = args as { key: string }
    if (BLOCKED_READ_KEYS.has(key)) {
      throwError(ERROR_CODES.FORBIDDEN_SETTING, `Setting "${key}" cannot be read via this API.`)
    }
    return { key, value: getSetting(key) }
  })

  registerHandler(IPC_CHANNELS.SETTINGS_GET_ALL, () => {
    const all = getAllSettings()
    // Strip sensitive keys from bulk response
    const safe = { ...all }
    for (const key of BLOCKED_READ_KEYS) {
      delete safe[key]
    }
    return safe
  })

  registerHandler(IPC_CHANNELS.SETTINGS_UPDATE, (args) => {
    const { key, value } = args as { key: string; value: string }

    if (BLOCKED_WRITE_KEYS.has(key)) {
      throwError(ERROR_CODES.FORBIDDEN_SETTING, `Setting "${key}" cannot be modified via this API.`)
    }
    if (!ALLOWED_UPDATE_KEYS.has(key)) {
      throwError(ERROR_CODES.FORBIDDEN_SETTING, `Setting "${key}" is not a recognized setting key.`)
    }

    updateSetting(key, value)
    return { success: true }
  })
}
