// Subject Bank Handlers
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as subjectBankService from '../../services/subject-bank-service'

export function registerSubjectBankHandlers(): void {
  registerHandler(IPC_CHANNELS.SUBJECT_BANK_LIST, (args) => subjectBankService.listSubjects((args ?? {}) as never))
  registerHandler(IPC_CHANNELS.SUBJECT_BANK_CREATE, (args) => subjectBankService.createSubject(args as never))
  registerHandler(IPC_CHANNELS.SUBJECT_BANK_UPDATE, (args) => subjectBankService.updateSubject(args as never))
  registerHandler(IPC_CHANNELS.SUBJECT_BANK_DELETE_IMPACT, (args) => {
    const { id } = args as { id: string }
    return subjectBankService.getSubjectDeleteImpact(id)
  })
  registerHandler(IPC_CHANNELS.SUBJECT_BANK_DELETE, (args) => {
    const { id } = args as { id: string }
    const result = subjectBankService.deleteSubject(id)
    return { success: true, ...result }
  })
}
