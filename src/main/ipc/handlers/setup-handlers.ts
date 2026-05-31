// ============================================================
// Setup Handlers — First-Run Setup IPC
// ============================================================

import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { hasAdminPassword, setSettings } from '../../services/settings-service'
import { runMigrations } from '../../database/migrator'
import { SETTINGS_KEYS, DEFAULTS, ERROR_CODES } from '../../../shared/constants'
import bcrypt from 'bcryptjs'

interface SetupData {
  adminName: string
  adminEmail: string
  password: string
  confirmPassword: string
  shsPeriodLength?: number
  collegePeriodLength?: number
  timeSlotStart?: string
  timeSlotEnd?: string
}

function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}

export function registerSetupHandlers(): void {
  // Check if setup is needed
  registerHandler(IPC_CHANNELS.AUTH_CHECK_SETUP, () => {
    return { needsSetup: !hasAdminPassword() }
  })

  // Complete the setup process
  registerHandler(IPC_CHANNELS.SETUP_COMPLETE, (args) => {
    const data = args as SetupData

    // Validate already set up
    if (hasAdminPassword()) {
      throwError(ERROR_CODES.SETUP_ALREADY_COMPLETE, 'Setup has already been completed.')
    }

    // Validate password
    if (!data.password || data.password.length < DEFAULTS.PASSWORD_MIN_LENGTH) {
      throwError(
        ERROR_CODES.PASSWORD_TOO_SHORT,
        `Password must be at least ${DEFAULTS.PASSWORD_MIN_LENGTH} characters.`
      )
    }
    if (data.password !== data.confirmPassword) {
      throwError(ERROR_CODES.PASSWORD_MISMATCH, 'Passwords do not match.')
    }

    // Run migrations (creates all tables)
    runMigrations()

    // Hash password
    const hash = bcrypt.hashSync(data.password, DEFAULTS.BCRYPT_COST)

    // Seed all settings
    const settings: Record<string, string> = {
      [SETTINGS_KEYS.ADMIN_NAME]: data.adminName ?? '',
      [SETTINGS_KEYS.ADMIN_EMAIL]: data.adminEmail ?? '',
      [SETTINGS_KEYS.ADMIN_PASSWORD_HASH]: hash,
      [SETTINGS_KEYS.SHS_PERIOD_LENGTH]: String(
        data.shsPeriodLength ?? DEFAULTS.SHS_PERIOD_LENGTH
      ),
      [SETTINGS_KEYS.COLLEGE_PERIOD_LENGTH]: String(
        data.collegePeriodLength ?? DEFAULTS.COLLEGE_PERIOD_LENGTH
      ),
      [SETTINGS_KEYS.SHS_TIME_SLOT_START]: data.timeSlotStart ?? DEFAULTS.TIME_SLOT_START,
      [SETTINGS_KEYS.SHS_TIME_SLOT_END]: data.timeSlotEnd ?? DEFAULTS.TIME_SLOT_END,
      [SETTINGS_KEYS.COLLEGE_TIME_SLOT_START]:
        data.timeSlotStart ?? DEFAULTS.TIME_SLOT_START,
      [SETTINGS_KEYS.COLLEGE_TIME_SLOT_END]: data.timeSlotEnd ?? DEFAULTS.TIME_SLOT_END,
      [SETTINGS_KEYS.INSTITUTION_LOGO]: '',
      [SETTINGS_KEYS.FOOTER_CREDIT]: ''
    }

    setSettings(settings)

    return { success: true }
  })
}
