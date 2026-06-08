// Backup Handlers — TASK-23
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as backupService from '../../services/backup-service'

export function registerBackupHandlers(): void {
  registerHandler(IPC_CHANNELS.BACKUP_CREATE, async () => backupService.createBackup())
  registerHandler(IPC_CHANNELS.BACKUP_RESTORE, async () => backupService.restoreBackup())
  registerHandler(IPC_CHANNELS.BACKUP_LIST_AUTO, async () => backupService.listAutoBackups())
  registerHandler(IPC_CHANNELS.BACKUP_RESTORE_AUTO, async (args) => {
    const { filename } = args as { filename: string }
    if (!filename || typeof filename !== 'string') {
      throw new Error('filename must be a non-empty string')
    }
    return await backupService.restoreAutoBackup(filename)
  })
  registerHandler(IPC_CHANNELS.BACKUP_DELETE_AUTO, async (args) => {
    const { filename } = args as { filename: string }
    if (!filename || typeof filename !== 'string') {
      throw new Error('filename must be a non-empty string')
    }
    await backupService.deleteAutoBackup(filename)
    return { success: true }
  })
}
