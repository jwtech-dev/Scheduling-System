// ============================================================
// IPC Channel Name Constants — Schedule Management System
// ============================================================
// All channel names used for main ↔ renderer communication.
// Channels are organized by domain.

export const IPC_CHANNELS = {
  // Auth & Setup (exempt from auth middleware)
  AUTH_CHECK_SETUP: 'auth:check-setup',
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_CHANGE_PASSWORD: 'auth:change-password',
  SETUP_COMPLETE: 'setup:complete',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_GET_ALL: 'settings:get-all',
  SETTINGS_UPDATE: 'settings:update',

  // Academic Years
  ACADEMIC_YEARS_LIST: 'academic-years:list',
  ACADEMIC_YEARS_CREATE: 'academic-years:create',
  ACADEMIC_YEARS_GET: 'academic-years:get',
  ACADEMIC_YEARS_UPDATE: 'academic-years:update',
  ACADEMIC_YEARS_GET_SEMESTERS: 'academic-years:get-semesters',
  ACADEMIC_YEARS_DELETE: 'academic-years:delete',
  ACADEMIC_YEARS_PUBLISH: 'academic-years:publish',

  // Semesters
  SEMESTERS_CREATE: 'semesters:create',
  SEMESTERS_UPDATE: 'semesters:update',
  SEMESTERS_PUBLISH: 'semesters:publish',
  SEMESTERS_DELETE: 'semesters:delete',

  // Active Term
  ACTIVE_TERM_GET: 'active-term:get',

  // Calendar Events
  CALENDAR_EVENTS_LIST: 'calendar-events:list',
  CALENDAR_EVENTS_CREATE: 'calendar-events:create',
  CALENDAR_EVENTS_GET: 'calendar-events:get',
  CALENDAR_EVENTS_UPDATE: 'calendar-events:update',
  CALENDAR_EVENTS_DELETE: 'calendar-events:delete',

  // Rooms
  ROOMS_LIST: 'rooms:list',
  ROOMS_CREATE: 'rooms:create',
  ROOMS_GET: 'rooms:get',
  ROOMS_UPDATE: 'rooms:update',
  ROOMS_DELETE: 'rooms:delete',
  ROOMS_GET_SCHEDULE: 'rooms:get-schedule',

  // Sections
  SECTIONS_LIST: 'sections:list',
  SECTIONS_CREATE: 'sections:create',
  SECTIONS_CREATE_BATCH: 'sections:create-batch',
  SECTIONS_GET: 'sections:get',
  SECTIONS_UPDATE: 'sections:update',
  SECTIONS_DELETE: 'sections:delete',
  SECTIONS_GET_SCHEDULE: 'sections:get-schedule',

  // Personnel
  PERSONNEL_LIST: 'personnel:list',
  PERSONNEL_CREATE: 'personnel:create',
  PERSONNEL_GET: 'personnel:get',
  PERSONNEL_UPDATE: 'personnel:update',
  PERSONNEL_DELETE: 'personnel:delete',
  PERSONNEL_GET_SCHEDULE: 'personnel:get-schedule',

  // Schedule Entries
  SCHEDULES_LIST: 'schedules:list',
  SCHEDULES_LIST_DRAFT: 'schedules:list-draft',
  SCHEDULES_CREATE_DRAFT: 'schedules:create-draft',
  SCHEDULES_UPDATE_DRAFT: 'schedules:update-draft',
  SCHEDULES_DELETE_DRAFT: 'schedules:delete-draft',
  SCHEDULES_VALIDATE: 'schedules:validate',
  SCHEDULES_PUBLISH: 'schedules:publish',
  SCHEDULES_UNPUBLISH: 'schedules:unpublish',
  SCHEDULES_REVALIDATE: 'schedules:revalidate-published',
  SCHEDULES_LIST_EXAM: 'schedules:list-exam',

  // Carry Forward
  CARRY_FORWARD_PREVIEW: 'carry-forward:preview',
  CARRY_FORWARD_EXECUTE: 'carry-forward:execute',

  // Subject Bank
  SUBJECT_BANK_LIST: 'subject-bank:list',
  SUBJECT_BANK_CREATE: 'subject-bank:create',
  SUBJECT_BANK_UPDATE: 'subject-bank:update',
  SUBJECT_BANK_DELETE: 'subject-bank:delete',

  // Imports
  IMPORTS_DOWNLOAD_TEMPLATE: 'imports:download-template',
  IMPORTS_UPLOAD: 'imports:upload',
  IMPORTS_COMMIT: 'imports:commit',
  IMPORTS_LIST_JOBS: 'imports:list-jobs',
  IMPORTS_GET_JOB: 'imports:get-job',

  // Exports
  EXPORTS_SCHEDULE: 'exports:schedule',
  EXPORTS_CALENDAR: 'exports:calendar',
  EXPORTS_CALENDAR_PDF: 'exports:calendar-pdf',
  EXPORTS_PERSONNEL_LOAD: 'exports:personnel-load',
  EXPORTS_ROOM_UTILIZATION: 'exports:room-utilization',
  EXPORTS_SECTION_SCHEDULE: 'exports:section-schedule',
  EXPORTS_EXAM_SCHEDULE: 'exports:exam-schedule',

  // Backup
  BACKUP_CREATE: 'backup:create',
  BACKUP_RESTORE: 'backup:restore',
  BACKUP_LIST_AUTO: 'backup:list-auto',
  BACKUP_RESTORE_AUTO: 'backup:restore-auto',
  BACKUP_DELETE_AUTO: 'backup:delete-auto',

  // Audit
  AUDIT_LIST: 'audit:list',

  // Logo
  LOGO_UPLOAD: 'logo:upload',
  LOGO_GET: 'logo:get',
  LOGO_REMOVE: 'logo:remove',

  // Dialogs
  DIALOG_OPEN_FILE: 'dialog:open-file',
  DIALOG_SAVE_FILE: 'dialog:save-file',

  // Trash
  TRASH_LIST: 'trash:list',
  TRASH_COUNTS: 'trash:counts',
  TRASH_RESTORE: 'trash:restore',
  TRASH_PERMANENT_DELETE: 'trash:permanent-delete',
  TRASH_PURGE_EXPIRED: 'trash:purge-expired',

  // Utility (dev/test)
  PING: 'ping'
} as const

// Channels exempt from auth middleware
export const AUTH_EXEMPT_CHANNELS: readonly string[] = [
  IPC_CHANNELS.AUTH_CHECK_SETUP,
  IPC_CHANNELS.AUTH_LOGIN,
  IPC_CHANNELS.AUTH_LOGOUT,
  IPC_CHANNELS.SETUP_COMPLETE,
  IPC_CHANNELS.PING
]
