// ============================================================
// Setup Handlers — First-Run Setup IPC
// ============================================================

import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { hasAdminPassword, setSettings } from '../../services/settings-service'
import { getDatabase } from '../../database/connection'
import { runMigrations } from '../../database/migrator'
import { validatePasswordComplexity, normalizeSecurityAnswer } from '../../services/auth-service'
import { SETTINGS_KEYS, DEFAULTS, ERROR_CODES } from '../../../shared/constants'
import bcrypt from 'bcryptjs'

interface SetupData {
  password: string
  confirmPassword: string
  question1: string
  answer1: string
  question2: string
  answer2: string
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
  registerHandler(IPC_CHANNELS.SETUP_COMPLETE, async (args) => {
    const data = args as SetupData

    // Validate already set up
    if (hasAdminPassword()) {
      throwError(ERROR_CODES.SETUP_ALREADY_COMPLETE, 'Setup has already been completed.')
    }

    // Validate password complexity (min 8, uppercase, lowercase, number)
    validatePasswordComplexity(data.password)

    if (data.password !== data.confirmPassword) {
      throwError(ERROR_CODES.PASSWORD_MISMATCH, 'Passwords do not match.')
    }

    // Validate security questions and answers
    if (!data.question1?.trim() || !data.answer1?.trim() || !data.question2?.trim() || !data.answer2?.trim()) {
      throwError(ERROR_CODES.VALIDATION_ERROR, 'Security questions and answers are required.')
    }

    if (data.question1.trim() === data.question2.trim()) {
      throwError(ERROR_CODES.VALIDATION_ERROR, 'Security questions must be different.')
    }

    // Run migrations (creates all tables)
    runMigrations()

    // Hash password & security answers (async to avoid blocking main thread)
    const hash = await bcrypt.hash(data.password, DEFAULTS.BCRYPT_COST)
    const hash1 = await bcrypt.hash(normalizeSecurityAnswer(data.answer1), DEFAULTS.BCRYPT_COST)
    const hash2 = await bcrypt.hash(normalizeSecurityAnswer(data.answer2), DEFAULTS.BCRYPT_COST)

    // Seed all settings atomically in a transaction
    const db = getDatabase()
    const seedSettings = db.transaction(() => {
      const settings: Record<string, string> = {
        [SETTINGS_KEYS.ADMIN_PASSWORD_HASH]: hash,
        [SETTINGS_KEYS.SECURITY_QUESTION_1]: data.question1.trim(),
        [SETTINGS_KEYS.SECURITY_ANSWER_HASH_1]: hash1,
        [SETTINGS_KEYS.SECURITY_QUESTION_2]: data.question2.trim(),
        [SETTINGS_KEYS.SECURITY_ANSWER_HASH_2]: hash2,
        [SETTINGS_KEYS.SHS_PERIOD_LENGTH]: String(DEFAULTS.SHS_PERIOD_LENGTH),
        [SETTINGS_KEYS.COLLEGE_PERIOD_LENGTH]: String(DEFAULTS.COLLEGE_PERIOD_LENGTH),
        [SETTINGS_KEYS.SHS_TIME_SLOT_START]: data.timeSlotStart ?? DEFAULTS.TIME_SLOT_START,
        [SETTINGS_KEYS.SHS_TIME_SLOT_END]: data.timeSlotEnd ?? DEFAULTS.TIME_SLOT_END,
        [SETTINGS_KEYS.COLLEGE_TIME_SLOT_START]:
          data.timeSlotStart ?? DEFAULTS.TIME_SLOT_START,
        [SETTINGS_KEYS.COLLEGE_TIME_SLOT_END]: data.timeSlotEnd ?? DEFAULTS.TIME_SLOT_END,
        [SETTINGS_KEYS.INSTITUTION_LOGO]: '',
        [SETTINGS_KEYS.INSTITUTION_NAME]: 'INTEGRATED INNOVATION AND HOSPITALITY COLLEGES, INC.',
        [SETTINGS_KEYS.INSTITUTION_ADDRESS]: 'Buenamar St. Brgy. Novaliches Proper, Novaliches, Quezon City',
        [SETTINGS_KEYS.INSTITUTION_CONTACT]: 'Tel. No. 7754-9645 Mobile No. 0919-893-4789 0917-125-4442',
        [SETTINGS_KEYS.INSTITUTION_EMAIL]: 'iihcolleges@gmail.com',
        [SETTINGS_KEYS.FOOTER_CREDIT]: ''
      }
      setSettings(settings)
    })

    seedSettings()

    return { success: true }
  })
}
