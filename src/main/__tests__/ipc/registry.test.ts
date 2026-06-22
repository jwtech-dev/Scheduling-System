// ============================================================
// IPC Registry — Unit Tests
// ============================================================
// Tests the registerHandler function in isolation, mocking ipcMain and auth.

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Track registered handlers so we can invoke them directly
const handlers = new Map<string, Function>()

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: Function) => {
      handlers.set(channel, handler)
    }
  }
}))

// Mock auth middleware
vi.mock('../../ipc/auth-middleware', () => ({
  checkAuth: vi.fn(() => null) // Default: authenticated
}))

// Mock all handler registration functions to no-ops (avoid cascading imports)
vi.mock('../../ipc/handlers/setup-handlers', () => ({ registerSetupHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/auth-handlers', () => ({ registerAuthHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/settings-handlers', () => ({ registerSettingsHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/academic-year-handlers', () => ({ registerAcademicYearHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/semester-handlers', () => ({ registerSemesterHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/active-term-handlers', () => ({ registerActiveTermHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/calendar-event-handlers', () => ({ registerCalendarEventHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/room-handlers', () => ({ registerRoomHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/section-handlers', () => ({ registerSectionHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/personnel-handlers', () => ({ registerPersonnelHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/schedule-handlers', () => ({ registerScheduleHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/publish-handlers', () => ({ registerPublishHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/carry-forward-handlers', () => ({ registerCarryForwardHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/import-handlers', () => ({ registerImportHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/export-handlers', () => ({ registerExportHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/audit-handlers', () => ({ registerAuditHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/backup-handlers', () => ({ registerBackupHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/logo-handlers', () => ({ registerLogoHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/dialog-handlers', () => ({ registerDialogHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/schedule-query-handlers', () => ({ registerScheduleQueryHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/trash-handlers', () => ({ registerTrashHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/subject-bank-handlers', () => ({ registerSubjectBankHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/program-handlers', () => ({ registerProgramHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/quarter-handlers', () => ({ registerQuarterHandlers: vi.fn() }))
vi.mock('../../ipc/handlers/updater-handlers', () => ({ registerUpdaterHandlers: vi.fn() }))

// Mock IPC channels
vi.mock('../../../shared/ipc-channels', () => ({
  IPC_CHANNELS: { PING: 'ping', ROOMS_LIST: 'rooms:list' },
  AUTH_EXEMPT_CHANNELS: ['ping']
}))

import { registerHandler } from '../../ipc/registry'
import { checkAuth } from '../../ipc/auth-middleware'

describe('IPC Registry', () => {
  beforeEach(() => {
    handlers.clear()
    vi.clearAllMocks()
  })

  describe('registerHandler', () => {
    it('should register a handler via ipcMain.handle', () => {
      registerHandler('test:channel', () => 'result')
      expect(handlers.has('test:channel')).toBe(true)
    })

    it('should wrap successful handler results in IpcResponse format', async () => {
      registerHandler('test:success', () => ({ value: 42 }))
      const handler = handlers.get('test:success')!
      const result = await handler({}, undefined)
      expect(result).toEqual({
        data: { value: 42 },
        error: null
      })
    })

    it('should wrap null/void handler results', async () => {
      registerHandler('test:void', () => undefined)
      const handler = handlers.get('test:void')!
      const result = await handler({}, undefined)
      expect(result).toEqual({
        data: null,
        error: null
      })
    })

    it('should catch handler errors and return error response', async () => {
      registerHandler('test:error', () => {
        const err = new Error('Something broke')
        ;(err as Error & { code: string }).code = 'TEST_ERROR'
        throw err
      })
      const handler = handlers.get('test:error')!
      const result = await handler({}, undefined)
      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error.code).toBe('TEST_ERROR')
      expect(result.error.message).toBe('Something broke')
    })

    it('should use INTERNAL_ERROR code for errors without code', async () => {
      registerHandler('test:nocode', () => {
        throw new Error('Generic error')
      })
      const handler = handlers.get('test:nocode')!
      const result = await handler({}, undefined)
      expect(result.error.code).toBe('INTERNAL_ERROR')
    })

    it('should block unauthenticated calls on non-exempt channels', async () => {
      vi.mocked(checkAuth).mockReturnValue({
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Auth required' }
      })

      registerHandler('rooms:list', () => 'should not reach')
      const handler = handlers.get('rooms:list')!
      const result = await handler({}, undefined)
      expect(result.error!.code).toBe('UNAUTHORIZED')
    })

    it('should warn on duplicate channel registration', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      registerHandler('test:dup', () => 'first')
      registerHandler('test:dup', () => 'second')
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('already registered')
      )
      warnSpy.mockRestore()
    })
  })
})
