// Template Handlers — TASK-18
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as templateService from '../../services/template-service'

export function registerTemplateHandlers(): void {
  registerHandler(IPC_CHANNELS.TEMPLATES_LIST, (args) => templateService.listTemplates((args ?? {}) as never))
  registerHandler(IPC_CHANNELS.TEMPLATES_GET, (args) => { const { id } = args as { id: string }; return templateService.getTemplate(id) })
  registerHandler(IPC_CHANNELS.TEMPLATES_CREATE, (args) => templateService.createTemplate(args as never))
  registerHandler(IPC_CHANNELS.TEMPLATES_UPDATE, (args) => templateService.updateTemplate(args as never))
  registerHandler(IPC_CHANNELS.TEMPLATES_DELETE, (args) => { const { id } = args as { id: string }; templateService.deleteTemplate(id); return { success: true } })
  registerHandler(IPC_CHANNELS.TEMPLATES_GET_ENTRIES, (args) => { const { id } = args as { id: string }; return templateService.getTemplateEntries(id) })
  registerHandler(IPC_CHANNELS.TEMPLATES_UPDATE_ENTRY, (args) => templateService.updateTemplateEntry(args as never))
  registerHandler(IPC_CHANNELS.TEMPLATES_DELETE_ENTRY, (args) => { const { id } = args as { id: string }; templateService.deleteTemplateEntry(id); return { success: true } })
  registerHandler(IPC_CHANNELS.TEMPLATES_APPLY, (args) => templateService.applyTemplate(args as never))
  registerHandler(IPC_CHANNELS.TEMPLATES_GET_APPLICATIONS, (args) => { const { id } = args as { id: string }; return templateService.getTemplateApplications(id) })
}
