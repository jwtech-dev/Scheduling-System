// Audit Handlers — TASK-15
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { queryAuditLog } from '../../services/audit-service'

export function registerAuditHandlers(): void {
  registerHandler(IPC_CHANNELS.AUDIT_LIST, (args) => queryAuditLog((args ?? {}) as never))
}
