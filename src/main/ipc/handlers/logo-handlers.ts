// Logo Handlers — TASK-20
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { dialog, app } from 'electron'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { join, extname } from 'path'
import { getSetting, setSetting } from '../../services/settings-service'
import { SETTINGS_KEYS, DEFAULTS } from '../../../shared/constants'

function getLogoPath(): string {
  return join(app.getPath('userData'), 'institution-logo.png')
}

export function registerLogoHandlers(): void {
  registerHandler(IPC_CHANNELS.LOGO_UPLOAD, async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Institution Logo',
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg'] }],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) return { success: false }

    const filePath = result.filePaths[0]
    const buffer = readFileSync(filePath)

    if (buffer.length > DEFAULTS.LOGO_MAX_SIZE) {
      const err = new Error('Logo file exceeds 2MB limit.')
      ;(err as Error & { code: string }).code = 'VALIDATION_ERROR'
      throw err
    }

    const logoPath = getLogoPath()
    writeFileSync(logoPath, buffer)
    setSetting(SETTINGS_KEYS.INSTITUTION_LOGO, logoPath)

    return { success: true, path: logoPath }
  })

  registerHandler(IPC_CHANNELS.LOGO_GET, () => {
    const logoPath = getSetting(SETTINGS_KEYS.INSTITUTION_LOGO)
    if (!logoPath || !existsSync(logoPath)) return { logo: null }

    const buffer = readFileSync(logoPath)
    const base64 = buffer.toString('base64')
    const ext = extname(logoPath).slice(1) || 'png'
    return { logo: `data:image/${ext};base64,${base64}` }
  })

  registerHandler(IPC_CHANNELS.LOGO_REMOVE, () => {
    const logoPath = getSetting(SETTINGS_KEYS.INSTITUTION_LOGO)
    if (logoPath && existsSync(logoPath)) unlinkSync(logoPath)
    setSetting(SETTINGS_KEYS.INSTITUTION_LOGO, '')
    return { success: true }
  })
}
