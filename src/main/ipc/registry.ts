// ============================================================
// IPC Handler Registry — All Handlers Wired
// ============================================================

import { ipcMain } from 'electron'
import { checkAuth } from './auth-middleware'
import { AUTH_EXEMPT_CHANNELS, IPC_CHANNELS } from '../../shared/ipc-channels'
import type { IpcResponse } from '../../shared/types'

type HandlerFn = (args: unknown) => unknown | Promise<unknown>

const registeredChannels = new Set<string>()

export function registerHandler(channel: string, handler: HandlerFn): void {
  if (registeredChannels.has(channel)) {
    console.warn(`IPC handler already registered for channel: ${channel}`)
    return
  }

  ipcMain.handle(channel, async (_event, args: unknown): Promise<IpcResponse> => {
    if (!AUTH_EXEMPT_CHANNELS.includes(channel)) {
      const authResult = checkAuth()
      if (authResult) return authResult
    }

    try {
      const result = await handler(args)
      return { data: result ?? null, error: null }
    } catch (err) {
      const error = err as Error & { code?: string; details?: unknown }
      return {
        data: null,
        error: {
          code: error.code ?? 'INTERNAL_ERROR',
          message: error.message ?? 'An unexpected error occurred',
          details: error.details
        }
      }
    }
  })

  registeredChannels.add(channel)
}

export function registerAllHandlers(): void {
  // Ping
  registerHandler(IPC_CHANNELS.PING, () => ({ pong: true, timestamp: new Date().toISOString() }))

  // Import and register all handler modules
  const { registerSetupHandlers } = require('./handlers/setup-handlers')
  const { registerAuthHandlers } = require('./handlers/auth-handlers')
  const { registerSettingsHandlers } = require('./handlers/settings-handlers')
  const { registerAcademicYearHandlers } = require('./handlers/academic-year-handlers')
  const { registerSemesterHandlers } = require('./handlers/semester-handlers')
  const { registerActiveTermHandlers } = require('./handlers/active-term-handlers')
  const { registerCalendarEventHandlers } = require('./handlers/calendar-event-handlers')
  const { registerRoomHandlers } = require('./handlers/room-handlers')
  const { registerSectionHandlers } = require('./handlers/section-handlers')
  const { registerPersonnelHandlers } = require('./handlers/personnel-handlers')
  const { registerScheduleHandlers } = require('./handlers/schedule-handlers')
  const { registerPublishHandlers } = require('./handlers/publish-handlers')
  const { registerTemplateHandlers } = require('./handlers/template-handlers')
  const { registerImportHandlers } = require('./handlers/import-handlers')
  const { registerExportHandlers } = require('./handlers/export-handlers')
  const { registerAuditHandlers } = require('./handlers/audit-handlers')
  const { registerBackupHandlers } = require('./handlers/backup-handlers')
  const { registerLogoHandlers } = require('./handlers/logo-handlers')
  const { registerDialogHandlers } = require('./handlers/dialog-handlers')

  registerSetupHandlers()
  registerAuthHandlers()
  registerSettingsHandlers()
  registerAcademicYearHandlers()
  registerSemesterHandlers()
  registerActiveTermHandlers()
  registerCalendarEventHandlers()
  registerRoomHandlers()
  registerSectionHandlers()
  registerPersonnelHandlers()
  registerScheduleHandlers()
  registerPublishHandlers()
  registerTemplateHandlers()
  registerImportHandlers()
  registerExportHandlers()
  registerAuditHandlers()
  registerBackupHandlers()
  registerLogoHandlers()
  registerDialogHandlers()
}
