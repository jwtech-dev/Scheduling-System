// ============================================================
// IPC Handler Registry — All Handlers Wired
// ============================================================

import { ipcMain } from 'electron'
import { checkAuth } from './auth-middleware'
import { AUTH_EXEMPT_CHANNELS, IPC_CHANNELS } from '../../shared/ipc-channels'
import type { IpcResponse } from '../../shared/types'

// Static imports so the bundler includes all handler modules
import { registerSetupHandlers } from './handlers/setup-handlers'
import { registerAuthHandlers } from './handlers/auth-handlers'
import { registerSettingsHandlers } from './handlers/settings-handlers'
import { registerAcademicYearHandlers } from './handlers/academic-year-handlers'
import { registerSemesterHandlers } from './handlers/semester-handlers'
import { registerActiveTermHandlers } from './handlers/active-term-handlers'
import { registerCalendarEventHandlers } from './handlers/calendar-event-handlers'
import { registerRoomHandlers } from './handlers/room-handlers'
import { registerSectionHandlers } from './handlers/section-handlers'
import { registerPersonnelHandlers } from './handlers/personnel-handlers'
import { registerScheduleHandlers } from './handlers/schedule-handlers'
import { registerPublishHandlers } from './handlers/publish-handlers'
import { registerCarryForwardHandlers } from './handlers/carry-forward-handlers'
import { registerImportHandlers } from './handlers/import-handlers'
import { registerExportHandlers } from './handlers/export-handlers'
import { registerAuditHandlers } from './handlers/audit-handlers'
import { registerBackupHandlers } from './handlers/backup-handlers'
import { registerLogoHandlers } from './handlers/logo-handlers'
import { registerDialogHandlers } from './handlers/dialog-handlers'
import { registerScheduleQueryHandlers } from './handlers/schedule-query-handlers'
import { registerTrashHandlers } from './handlers/trash-handlers'
import { registerSubjectBankHandlers } from './handlers/subject-bank-handlers'
import { registerProgramHandlers } from './handlers/program-handlers'
import { registerQuarterHandlers } from './handlers/quarter-handlers'

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
  registerCarryForwardHandlers()
  registerImportHandlers()
  registerExportHandlers()
  registerAuditHandlers()
  registerBackupHandlers()
  registerLogoHandlers()
  registerDialogHandlers()
  registerScheduleQueryHandlers()
  registerTrashHandlers()
  registerSubjectBankHandlers()
  registerProgramHandlers()
  registerQuarterHandlers()
}
