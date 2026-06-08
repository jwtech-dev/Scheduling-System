// ============================================================
// Dialog Handlers — File Picker IPC
// ============================================================
// Sanitizes dialog options to prevent renderer from controlling
// sensitive Electron dialog properties.

import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { dialog } from 'electron'

// Only these properties are allowed from the renderer
const ALLOWED_OPEN_PROPS = new Set(['title', 'defaultPath', 'filters', 'buttonLabel', 'properties'])
const ALLOWED_SAVE_PROPS = new Set(['title', 'defaultPath', 'filters', 'buttonLabel'])

// These dialog properties are explicitly blocked
const BLOCKED_PROPERTIES = new Set(['showHiddenFiles', 'noResolveAliases'])

function sanitizeOptions<T extends Record<string, unknown>>(raw: unknown, allowedKeys: Set<string>): Partial<T> {
  if (!raw || typeof raw !== 'object') return {} as Partial<T>
  const input = raw as Record<string, unknown>
  const clean: Record<string, unknown> = {}
  for (const key of Object.keys(input)) {
    if (allowedKeys.has(key)) {
      clean[key] = input[key]
    }
  }
  // Strip blocked values from properties array
  if (Array.isArray(clean.properties)) {
    clean.properties = (clean.properties as string[]).filter(p => !BLOCKED_PROPERTIES.has(p))
  }
  return clean as Partial<T>
}

export function registerDialogHandlers(): void {
  registerHandler(IPC_CHANNELS.DIALOG_OPEN_FILE, async (args) => {
    const options = sanitizeOptions<Electron.OpenDialogOptions>(args, ALLOWED_OPEN_PROPS)
    return dialog.showOpenDialog(options as Electron.OpenDialogOptions)
  })

  registerHandler(IPC_CHANNELS.DIALOG_SAVE_FILE, async (args) => {
    const options = sanitizeOptions<Electron.SaveDialogOptions>(args, ALLOWED_SAVE_PROPS)
    return dialog.showSaveDialog(options as Electron.SaveDialogOptions)
  })
}
