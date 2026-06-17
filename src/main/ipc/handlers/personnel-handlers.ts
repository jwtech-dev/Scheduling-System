// Personnel Handlers — TASK-11
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as personnelService from '../../services/personnel-service'

export function registerPersonnelHandlers(): void {
  registerHandler(IPC_CHANNELS.PERSONNEL_LIST, (args) => personnelService.listPersonnel((args ?? {}) as never))
  registerHandler(IPC_CHANNELS.PERSONNEL_GET, (args) => {
    const { id } = args as { id: string }
    return personnelService.getPersonnel(id)
  })
  registerHandler(IPC_CHANNELS.PERSONNEL_GET_BY_EMPLOYEE_ID, (args) => {
    const { employeeId } = args as { employeeId: string }
    return personnelService.getPersonnelByEmployeeId(employeeId)
  })
  registerHandler(IPC_CHANNELS.PERSONNEL_CREATE, (args) => personnelService.createPersonnel(args as never))
  registerHandler(IPC_CHANNELS.PERSONNEL_UPDATE, (args) => personnelService.updatePersonnel(args as never))
  registerHandler(IPC_CHANNELS.PERSONNEL_DELETE, (args) => {
    const { id } = args as { id: string }
    const result = personnelService.deletePersonnel(id)
    return result ?? { success: true }
  })
}
