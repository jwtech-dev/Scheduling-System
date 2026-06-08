// ============================================================
// Auth Handlers — Login, Logout & Change Password IPC
// ============================================================

import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import { login, logout, changePassword } from '../../services/auth-service'

export function registerAuthHandlers(): void {
  registerHandler(IPC_CHANNELS.AUTH_LOGIN, async (args) => {
    const { password } = args as { password: string }
    return login(password)
  })

  registerHandler(IPC_CHANNELS.AUTH_LOGOUT, () => {
    logout()
    return { success: true }
  })

  registerHandler(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, async (args) => {
    const { current, newPassword } = args as { current: string; newPassword: string }
    return changePassword(current, newPassword)
  })
}
