// Calendar Event Handlers — TASK-08
import { registerHandler } from '../registry'
import { IPC_CHANNELS } from '../../../shared/ipc-channels'
import * as calService from '../../services/calendar-event-service'

export function registerCalendarEventHandlers(): void {
  registerHandler(IPC_CHANNELS.CALENDAR_EVENTS_LIST, (args) => calService.listCalendarEvents((args ?? {}) as never))
  registerHandler(IPC_CHANNELS.CALENDAR_EVENTS_GET, (args) => {
    const { id } = args as { id: string }
    return calService.getCalendarEvent(id)
  })
  registerHandler(IPC_CHANNELS.CALENDAR_EVENTS_CREATE, (args) => calService.createCalendarEvent(args as never))
  registerHandler(IPC_CHANNELS.CALENDAR_EVENTS_UPDATE, (args) => calService.updateCalendarEvent(args as never))
  registerHandler(IPC_CHANNELS.CALENDAR_EVENTS_DELETE, (args) => {
    const { id } = args as { id: string }
    calService.deleteCalendarEvent(id)
    return { success: true }
  })
}
