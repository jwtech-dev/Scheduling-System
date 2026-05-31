// ============================================================
// Auth Handlers — Login & Change Password IPC
// ============================================================

import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { login, changePassword } from '../../services/auth-service'

export function registerAuthHandlers(): void {
  registerHandler(IPC_CHANNELS.AUTH_LOGIN, (args) => {
    const { email, password } = args as { email: string; password: string }
    return login(email, password)
  })

  registerHandler(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, (args) => {
    const { current, newPassword } = args as { current: string; newPassword: string }
    return changePassword(current, newPassword)
  })
}
