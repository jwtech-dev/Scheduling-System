// Backup Handlers — TASK-23
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as backupService from '../../services/backup-service'

export function registerBackupHandlers(): void {
  registerHandler(IPC_CHANNELS.BACKUP_CREATE, () => backupService.createBackup())
  registerHandler(IPC_CHANNELS.BACKUP_RESTORE, () => backupService.restoreBackup())
  registerHandler(IPC_CHANNELS.BACKUP_LIST_AUTO, () => backupService.listAutoBackups())
  registerHandler(IPC_CHANNELS.BACKUP_RESTORE_AUTO, (args) => {
    const { filename } = args as { filename: string }
    return backupService.restoreAutoBackup(filename)
  })
  registerHandler(IPC_CHANNELS.BACKUP_DELETE_AUTO, (args) => {
    const { filename } = args as { filename: string }
    backupService.deleteAutoBackup(filename)
    return { success: true }
  })
}
