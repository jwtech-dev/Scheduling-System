// Room Handlers — TASK-09
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as roomService from '../../services/room-service'

export function registerRoomHandlers(): void {
  registerHandler(IPC_CHANNELS.ROOMS_LIST, (args) => roomService.listRooms((args ?? {}) as never))
  registerHandler(IPC_CHANNELS.ROOMS_GET, (args) => {
    const { id } = args as { id: string }
    return roomService.getRoom(id)
  })
  registerHandler(IPC_CHANNELS.ROOMS_CREATE, (args) => roomService.createRoom(args as never))
  registerHandler(IPC_CHANNELS.ROOMS_UPDATE, (args) => roomService.updateRoom(args as never))
  registerHandler(IPC_CHANNELS.ROOMS_DELETE, (args) => {
    const { id } = args as { id: string }
    const result = roomService.deleteRoom(id)
    return result ?? { success: true }
  })
}
