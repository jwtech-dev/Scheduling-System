// Logo Handlers — TASK-20
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { dialog, app } from 'electron'
import { readFileSync, existsSync, unlinkSync } from 'fs'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { getSetting, setSetting } from '../../services/settings-service'
import { SETTINGS_KEYS, DEFAULTS } from '../../../shared/constants'

// Detect image type from magic bytes
function detectImageType(buffer: Buffer): { ext: string; mime: string } | null {
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { ext: 'png', mime: 'image/png' }
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' }
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { ext: 'gif', mime: 'image/gif' }
  }
  // SVG detection: check for XML/SVG text markers
  const head = buffer.slice(0, 256).toString('utf-8').trim().toLowerCase()
  if (head.includes('<svg') || head.includes('<?xml')) {
    return { ext: 'svg', mime: 'image/svg+xml' }
  }
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return { ext: 'bmp', mime: 'image/bmp' }
  }
  return null
}

function getLogoDir(): string {
  return app.getPath('userData')
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

    // Detect actual file type from magic bytes
    const detected = detectImageType(buffer)
    if (!detected) {
      const err = new Error('Unsupported image format. Use PNG, JPG, SVG, or GIF.')
      ;(err as Error & { code: string }).code = 'VALIDATION_ERROR'
      throw err
    }

    // Store with correct extension based on detected type
    const logoPath = join(getLogoDir(), `institution-logo.${detected.ext}`)
    await writeFile(logoPath, buffer)
    setSetting(SETTINGS_KEYS.INSTITUTION_LOGO, logoPath)

    return { success: true, path: logoPath }
  })

  registerHandler(IPC_CHANNELS.LOGO_GET, () => {
    const logoPath = getSetting(SETTINGS_KEYS.INSTITUTION_LOGO)
    if (!logoPath || !existsSync(logoPath)) return { logo: null }

    const buffer = readFileSync(logoPath)
    const detected = detectImageType(buffer)
    const mime = detected?.mime ?? 'image/png'
    const base64 = buffer.toString('base64')
    return { logo: `data:${mime};base64,${base64}` }
  })

  registerHandler(IPC_CHANNELS.LOGO_REMOVE, () => {
    const logoPath = getSetting(SETTINGS_KEYS.INSTITUTION_LOGO)
    if (logoPath && existsSync(logoPath)) unlinkSync(logoPath)
    setSetting(SETTINGS_KEYS.INSTITUTION_LOGO, '')
    return { success: true }
  })
}
