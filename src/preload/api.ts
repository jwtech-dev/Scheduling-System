// ============================================================
// Typed ElectronAPI Interface
// ============================================================
// Defines the shape of window.electronAPI available in the renderer.
// The preload script implements this interface.

export interface ElectronAPI {

  // Auth & Setup
  checkSetup: () => Promise<unknown>
  login: (password: string) => Promise<unknown>
  logout: () => Promise<unknown>
  changePassword: (current: string, newPassword: string) => Promise<unknown>
  completeSetup: (data: unknown) => Promise<unknown>

  // Settings
  getSetting: (key: string) => Promise<unknown>
  getAllSettings: () => Promise<unknown>
  updateSetting: (key: string, value: string) => Promise<unknown>

  // Academic Years
  listAcademicYears: (department: string) => Promise<unknown>
  createAcademicYear: (data: unknown) => Promise<unknown>
  getAcademicYear: (id: string) => Promise<unknown>
  updateAcademicYear: (data: unknown) => Promise<unknown>
  getAcademicYearSemesters: (id: string) => Promise<unknown>

  // Semesters
  createSemester: (data: unknown) => Promise<unknown>
  updateSemester: (data: unknown) => Promise<unknown>

  // Active Term
  getActiveTerm: (department: string) => Promise<unknown>

  // Calendar Events
  listCalendarEvents: (filters?: unknown) => Promise<unknown>
  createCalendarEvent: (data: unknown) => Promise<unknown>
  getCalendarEvent: (id: string) => Promise<unknown>
  updateCalendarEvent: (data: unknown) => Promise<unknown>
  deleteCalendarEvent: (id: string) => Promise<unknown>

  // Rooms
  listRooms: (filters?: unknown) => Promise<unknown>
  createRoom: (data: unknown) => Promise<unknown>
  getRoom: (id: string) => Promise<unknown>
  updateRoom: (data: unknown) => Promise<unknown>
  deleteRoom: (id: string) => Promise<unknown>
  getRoomSchedule: (id: string, filters?: unknown) => Promise<unknown>

  // Sections
  listSections: (filters?: unknown) => Promise<unknown>
  createSection: (data: unknown) => Promise<unknown>
  getSection: (id: string) => Promise<unknown>
  updateSection: (data: unknown) => Promise<unknown>
  deleteSection: (id: string) => Promise<unknown>
  getSectionSchedule: (id: string, filters?: unknown) => Promise<unknown>

  // Personnel
  listPersonnel: (filters?: unknown) => Promise<unknown>
  createPersonnel: (data: unknown) => Promise<unknown>
  getPersonnel: (id: string) => Promise<unknown>
  updatePersonnel: (data: unknown) => Promise<unknown>
  deletePersonnel: (id: string) => Promise<unknown>
  getPersonnelSchedule: (id: string) => Promise<unknown>

  // Schedule Entries
  listScheduleEntries: (filters?: unknown) => Promise<unknown>
  listDraftEntries: (filters?: unknown) => Promise<unknown>
  createDraftEntry: (data: unknown) => Promise<unknown>
  updateDraftEntry: (data: unknown) => Promise<unknown>
  deleteDraftEntry: (id: string) => Promise<unknown>
  validateEntry: (data: unknown) => Promise<unknown>
  publishEntries: (ids: string[]) => Promise<unknown>
  unpublishEntries: (ids: string[]) => Promise<unknown>
  revalidatePublished: (filters?: unknown) => Promise<unknown>
  listExamEntries: (filters?: unknown) => Promise<unknown>

  // Templates
  listTemplates: (filters?: unknown) => Promise<unknown>
  createTemplate: (data: unknown) => Promise<unknown>
  getTemplate: (id: string) => Promise<unknown>
  updateTemplate: (data: unknown) => Promise<unknown>
  deleteTemplate: (id: string) => Promise<unknown>
  getTemplateEntries: (id: string) => Promise<unknown>
  updateTemplateEntry: (data: unknown) => Promise<unknown>
  deleteTemplateEntry: (id: string) => Promise<unknown>
  applyTemplate: (data: unknown) => Promise<unknown>
  getTemplateApplications: (id: string) => Promise<unknown>

  // Imports
  downloadImportTemplate: (target: string) => Promise<unknown>
  uploadImport: (data: unknown) => Promise<unknown>
  commitImport: (data: unknown) => Promise<unknown>
  listImportJobs: () => Promise<unknown>
  getImportJob: (id: string) => Promise<unknown>

  // Exports
  exportSchedule: (data: unknown) => Promise<unknown>
  exportCalendar: (data: unknown) => Promise<unknown>
  exportPersonnelLoad: (data: unknown) => Promise<unknown>
  exportRoomUtilization: (data: unknown) => Promise<unknown>
  exportSectionSchedule: (data: unknown) => Promise<unknown>
  exportExamSchedule: (data: unknown) => Promise<unknown>

  // Backup
  createBackup: () => Promise<unknown>
  restoreBackup: (data: unknown) => Promise<unknown>
  listAutoBackups: () => Promise<unknown>
  restoreAutoBackup: (filename: string) => Promise<unknown>
  deleteAutoBackup: (filename: string) => Promise<unknown>

  // Audit
  listAuditLog: (filters?: unknown) => Promise<unknown>

  // Logo
  uploadLogo: () => Promise<unknown>
  getLogo: () => Promise<unknown>
  removeLogo: () => Promise<unknown>

  // Dialogs
  openFileDialog: (options?: unknown) => Promise<unknown>
  saveFileDialog: (options?: unknown) => Promise<unknown>

  // Trash
  trashList: (args: { entityType: string }) => Promise<unknown>
  trashCounts: () => Promise<unknown>
  trashRestore: (args: { entityType: string; id: string }) => Promise<unknown>
  trashPermanentDelete: (args: { entityType: string; id: string }) => Promise<unknown>
  trashPurgeExpired: (args?: { retentionDays?: number }) => Promise<unknown>

  // Utility
  ping: () => Promise<unknown>
}

// Augment the Window interface for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
