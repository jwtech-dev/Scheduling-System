// ============================================================
// Preload Script — Context Bridge
// ============================================================
// Exposes a typed electronAPI to the renderer via contextBridge.
// Only whitelisted channels are accessible.

import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from './api'
import { IPC_CHANNELS } from '../shared/ipc-channels'

// Build the channel whitelist from IPC_CHANNELS constants
const allowedChannels = new Set(Object.values(IPC_CHANNELS))

/**
 * Safe invoke wrapper — only allows whitelisted channels.
 */
function safeInvoke(channel: string, args?: unknown): Promise<unknown> {
  if (!allowedChannels.has(channel)) {
    return Promise.reject(new Error(`IPC channel not allowed: ${channel}`))
  }
  return ipcRenderer.invoke(channel, args)
}

const api: ElectronAPI = {
  invoke: safeInvoke,

  // Auth & Setup
  checkSetup: () => safeInvoke(IPC_CHANNELS.AUTH_CHECK_SETUP),
  login: (password: string) => safeInvoke(IPC_CHANNELS.AUTH_LOGIN, { password }),
  changePassword: (current: string, newPassword: string) =>
    safeInvoke(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, { current, newPassword }),
  completeSetup: (data: unknown) => safeInvoke(IPC_CHANNELS.SETUP_COMPLETE, data),

  // Settings
  getSetting: (key: string) => safeInvoke(IPC_CHANNELS.SETTINGS_GET, { key }),
  getAllSettings: () => safeInvoke(IPC_CHANNELS.SETTINGS_GET_ALL),
  updateSetting: (key: string, value: string) =>
    safeInvoke(IPC_CHANNELS.SETTINGS_UPDATE, { key, value }),

  // Academic Years
  listAcademicYears: (department: string) =>
    safeInvoke(IPC_CHANNELS.ACADEMIC_YEARS_LIST, { department }),
  createAcademicYear: (data: unknown) => safeInvoke(IPC_CHANNELS.ACADEMIC_YEARS_CREATE, data),
  getAcademicYear: (id: string) => safeInvoke(IPC_CHANNELS.ACADEMIC_YEARS_GET, { id }),
  updateAcademicYear: (data: unknown) => safeInvoke(IPC_CHANNELS.ACADEMIC_YEARS_UPDATE, data),
  getAcademicYearSemesters: (id: string) =>
    safeInvoke(IPC_CHANNELS.ACADEMIC_YEARS_GET_SEMESTERS, { id }),

  // Semesters
  createSemester: (data: unknown) => safeInvoke(IPC_CHANNELS.SEMESTERS_CREATE, data),
  updateSemester: (data: unknown) => safeInvoke(IPC_CHANNELS.SEMESTERS_UPDATE, data),

  // Active Term
  getActiveTerm: (department: string) =>
    safeInvoke(IPC_CHANNELS.ACTIVE_TERM_GET, { department }),

  // Calendar Events
  listCalendarEvents: (filters?: unknown) =>
    safeInvoke(IPC_CHANNELS.CALENDAR_EVENTS_LIST, filters),
  createCalendarEvent: (data: unknown) => safeInvoke(IPC_CHANNELS.CALENDAR_EVENTS_CREATE, data),
  getCalendarEvent: (id: string) => safeInvoke(IPC_CHANNELS.CALENDAR_EVENTS_GET, { id }),
  updateCalendarEvent: (data: unknown) => safeInvoke(IPC_CHANNELS.CALENDAR_EVENTS_UPDATE, data),
  deleteCalendarEvent: (id: string) => safeInvoke(IPC_CHANNELS.CALENDAR_EVENTS_DELETE, { id }),

  // Rooms
  listRooms: (filters?: unknown) => safeInvoke(IPC_CHANNELS.ROOMS_LIST, filters),
  createRoom: (data: unknown) => safeInvoke(IPC_CHANNELS.ROOMS_CREATE, data),
  getRoom: (id: string) => safeInvoke(IPC_CHANNELS.ROOMS_GET, { id }),
  updateRoom: (data: unknown) => safeInvoke(IPC_CHANNELS.ROOMS_UPDATE, data),
  deleteRoom: (id: string) => safeInvoke(IPC_CHANNELS.ROOMS_DELETE, { id }),
  getRoomSchedule: (id: string, filters?: unknown) =>
    safeInvoke(IPC_CHANNELS.ROOMS_GET_SCHEDULE, { id, ...((filters as object) ?? {}) }),

  // Sections
  listSections: (filters?: unknown) => safeInvoke(IPC_CHANNELS.SECTIONS_LIST, filters),
  createSection: (data: unknown) => safeInvoke(IPC_CHANNELS.SECTIONS_CREATE, data),
  getSection: (id: string) => safeInvoke(IPC_CHANNELS.SECTIONS_GET, { id }),
  updateSection: (data: unknown) => safeInvoke(IPC_CHANNELS.SECTIONS_UPDATE, data),
  deleteSection: (id: string) => safeInvoke(IPC_CHANNELS.SECTIONS_DELETE, { id }),
  getSectionSchedule: (id: string, filters?: unknown) =>
    safeInvoke(IPC_CHANNELS.SECTIONS_GET_SCHEDULE, { id, ...((filters as object) ?? {}) }),

  // Personnel
  listPersonnel: (filters?: unknown) => safeInvoke(IPC_CHANNELS.PERSONNEL_LIST, filters),
  createPersonnel: (data: unknown) => safeInvoke(IPC_CHANNELS.PERSONNEL_CREATE, data),
  getPersonnel: (id: string) => safeInvoke(IPC_CHANNELS.PERSONNEL_GET, { id }),
  updatePersonnel: (data: unknown) => safeInvoke(IPC_CHANNELS.PERSONNEL_UPDATE, data),
  deletePersonnel: (id: string) => safeInvoke(IPC_CHANNELS.PERSONNEL_DELETE, { id }),
  getPersonnelSchedule: (id: string) =>
    safeInvoke(IPC_CHANNELS.PERSONNEL_GET_SCHEDULE, { id }),

  // Schedule Entries
  listScheduleEntries: (filters?: unknown) => safeInvoke(IPC_CHANNELS.SCHEDULES_LIST, filters),
  listDraftEntries: (filters?: unknown) =>
    safeInvoke(IPC_CHANNELS.SCHEDULES_LIST_DRAFT, filters),
  createDraftEntry: (data: unknown) => safeInvoke(IPC_CHANNELS.SCHEDULES_CREATE_DRAFT, data),
  updateDraftEntry: (data: unknown) => safeInvoke(IPC_CHANNELS.SCHEDULES_UPDATE_DRAFT, data),
  deleteDraftEntry: (id: string) => safeInvoke(IPC_CHANNELS.SCHEDULES_DELETE_DRAFT, { id }),
  validateEntry: (data: unknown) => safeInvoke(IPC_CHANNELS.SCHEDULES_VALIDATE, data),
  publishEntries: (ids: string[]) => safeInvoke(IPC_CHANNELS.SCHEDULES_PUBLISH, { ids }),
  unpublishEntries: (ids: string[]) => safeInvoke(IPC_CHANNELS.SCHEDULES_UNPUBLISH, { ids }),
  revalidatePublished: (filters?: unknown) =>
    safeInvoke(IPC_CHANNELS.SCHEDULES_REVALIDATE, filters),
  listExamEntries: (filters?: unknown) =>
    safeInvoke(IPC_CHANNELS.SCHEDULES_LIST_EXAM, filters),

  // Templates
  listTemplates: (filters?: unknown) => safeInvoke(IPC_CHANNELS.TEMPLATES_LIST, filters),
  createTemplate: (data: unknown) => safeInvoke(IPC_CHANNELS.TEMPLATES_CREATE, data),
  getTemplate: (id: string) => safeInvoke(IPC_CHANNELS.TEMPLATES_GET, { id }),
  updateTemplate: (data: unknown) => safeInvoke(IPC_CHANNELS.TEMPLATES_UPDATE, data),
  deleteTemplate: (id: string) => safeInvoke(IPC_CHANNELS.TEMPLATES_DELETE, { id }),
  getTemplateEntries: (id: string) => safeInvoke(IPC_CHANNELS.TEMPLATES_GET_ENTRIES, { id }),
  updateTemplateEntry: (data: unknown) =>
    safeInvoke(IPC_CHANNELS.TEMPLATES_UPDATE_ENTRY, data),
  deleteTemplateEntry: (id: string) =>
    safeInvoke(IPC_CHANNELS.TEMPLATES_DELETE_ENTRY, { id }),
  applyTemplate: (data: unknown) => safeInvoke(IPC_CHANNELS.TEMPLATES_APPLY, data),
  getTemplateApplications: (id: string) =>
    safeInvoke(IPC_CHANNELS.TEMPLATES_GET_APPLICATIONS, { id }),

  // Imports
  downloadImportTemplate: (target: string) =>
    safeInvoke(IPC_CHANNELS.IMPORTS_DOWNLOAD_TEMPLATE, { target }),
  uploadImport: (data: unknown) => safeInvoke(IPC_CHANNELS.IMPORTS_UPLOAD, data),
  commitImport: (data: unknown) => safeInvoke(IPC_CHANNELS.IMPORTS_COMMIT, data),
  listImportJobs: () => safeInvoke(IPC_CHANNELS.IMPORTS_LIST_JOBS),
  getImportJob: (id: string) => safeInvoke(IPC_CHANNELS.IMPORTS_GET_JOB, { id }),

  // Exports
  exportSchedule: (data: unknown) => safeInvoke(IPC_CHANNELS.EXPORTS_SCHEDULE, data),
  exportCalendar: (data: unknown) => safeInvoke(IPC_CHANNELS.EXPORTS_CALENDAR, data),
  exportPersonnelLoad: (data: unknown) =>
    safeInvoke(IPC_CHANNELS.EXPORTS_PERSONNEL_LOAD, data),
  exportRoomUtilization: (data: unknown) =>
    safeInvoke(IPC_CHANNELS.EXPORTS_ROOM_UTILIZATION, data),
  exportSectionSchedule: (data: unknown) =>
    safeInvoke(IPC_CHANNELS.EXPORTS_SECTION_SCHEDULE, data),
  exportExamSchedule: (data: unknown) =>
    safeInvoke(IPC_CHANNELS.EXPORTS_EXAM_SCHEDULE, data),

  // Backup
  createBackup: () => safeInvoke(IPC_CHANNELS.BACKUP_CREATE),
  restoreBackup: (data: unknown) => safeInvoke(IPC_CHANNELS.BACKUP_RESTORE, data),
  listAutoBackups: () => safeInvoke(IPC_CHANNELS.BACKUP_LIST_AUTO),
  restoreAutoBackup: (filename: string) =>
    safeInvoke(IPC_CHANNELS.BACKUP_RESTORE_AUTO, { filename }),
  deleteAutoBackup: (filename: string) =>
    safeInvoke(IPC_CHANNELS.BACKUP_DELETE_AUTO, { filename }),

  // Audit
  listAuditLog: (filters?: unknown) => safeInvoke(IPC_CHANNELS.AUDIT_LIST, filters),

  // Logo
  uploadLogo: () => safeInvoke(IPC_CHANNELS.LOGO_UPLOAD),
  getLogo: () => safeInvoke(IPC_CHANNELS.LOGO_GET),
  removeLogo: () => safeInvoke(IPC_CHANNELS.LOGO_REMOVE),

  // Dialogs
  openFileDialog: (options?: unknown) => safeInvoke(IPC_CHANNELS.DIALOG_OPEN_FILE, options),
  saveFileDialog: (options?: unknown) => safeInvoke(IPC_CHANNELS.DIALOG_SAVE_FILE, options),

  // Utility
  ping: () => safeInvoke(IPC_CHANNELS.PING)
}

contextBridge.exposeInMainWorld('electronAPI', api)
