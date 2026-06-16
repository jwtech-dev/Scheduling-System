// ============================================================
// Auth Handlers — Login, Logout & Change Password IPC
// ============================================================

import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import {
  login,
  logout,
  changePassword,
  checkSecurityQuestionsConfigured,
  getSecurityQuestions,
  resetPasswordWithAnswers,
  updateSecurityQuestions
} from '../../services/auth-service'

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

  registerHandler(IPC_CHANNELS.AUTH_CHECK_SECURITY_QUESTIONS_CONFIGURED, () => {
    return { configured: checkSecurityQuestionsConfigured() }
  })

  registerHandler(IPC_CHANNELS.AUTH_GET_SECURITY_QUESTIONS, () => {
    return getSecurityQuestions()
  })

  registerHandler(IPC_CHANNELS.AUTH_RESET_PASSWORD, async (args) => {
    const { answer1, answer2, newPassword } = args as {
      answer1: string
      answer2: string
      newPassword: string
    }
    return resetPasswordWithAnswers(answer1, answer2, newPassword)
  })

  registerHandler(IPC_CHANNELS.AUTH_UPDATE_SECURITY_QUESTIONS, async (args) => {
    const { password, question1, answer1, question2, answer2 } = args as {
      password: string
      question1: string
      answer1: string
      question2: string
      answer2: string
    }
    return updateSecurityQuestions(password, question1, answer1, question2, answer2)
  })
}
