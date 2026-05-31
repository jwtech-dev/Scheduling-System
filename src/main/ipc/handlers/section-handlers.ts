// Section Handlers — TASK-10
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as sectionService from '../../services/section-service'

export function registerSectionHandlers(): void {
  registerHandler(IPC_CHANNELS.SECTIONS_LIST, (args) => sectionService.listSections((args ?? {}) as never))
  registerHandler(IPC_CHANNELS.SECTIONS_GET, (args) => {
    const { id } = args as { id: string }
    return sectionService.getSection(id)
  })
  registerHandler(IPC_CHANNELS.SECTIONS_CREATE, (args) => sectionService.createSection(args as never))
  registerHandler(IPC_CHANNELS.SECTIONS_UPDATE, (args) => sectionService.updateSection(args as never))
  registerHandler(IPC_CHANNELS.SECTIONS_DELETE, (args) => {
    const { id } = args as { id: string }
    sectionService.deleteSection(id)
    return { success: true }
  })
}
