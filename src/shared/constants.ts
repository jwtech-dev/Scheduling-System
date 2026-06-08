// ============================================================
// Shared Constants — Schedule Management System
// ============================================================

import type {
  Department,
  ActivityType,
  FieldDependencyRule,
  Modality,
  PatternMode,
  RecurrencePattern,
  CalendarEventType,
  ConflictSeverity
} from './types'

// === Departments ===

export const DEPARTMENTS: readonly Department[] = ['SHS', 'COLLEGE'] as const

export const DEPARTMENT_LABELS: Record<Department, string> = {
  SHS: 'Senior High School',
  COLLEGE: 'College'
}

// === Department Start Months ===
// SHS academic year must start in June (month index 5)
// College academic year must start in August (month index 7)

export const DEPARTMENT_START_MONTH: Record<Department, number> = {
  SHS: 5, // June (0-indexed)
  COLLEGE: 7 // August (0-indexed)
}

// SHS ends in March (month 2), College ends in May (month 4) of the following year
export const DEPARTMENT_END_MONTH: Record<Department, number> = {
  SHS: 2, // March
  COLLEGE: 4 // May
}

// === Activity Types ===

export const ACTIVITY_TYPES: readonly ActivityType[] = [
  'CLASS',
  'EXAM',
  'OFFICE',
  'MEETING',
  'EVENT',
  'MAINTENANCE'
] as const

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  CLASS: 'Class',
  EXAM: 'Examination',
  OFFICE: 'Office Hours',
  MEETING: 'Meeting',
  EVENT: 'Event',
  MAINTENANCE: 'Maintenance'
}

// === Field Dependency Matrix ===
// Defines which fields are required/optional/hidden per activity type.
// Modality further refines room_id: F2F=required, ONLINE=hidden, HYBRID=optional.

export const FIELD_DEPENDENCY_MATRIX: Record<ActivityType, FieldDependencyRule> = {
  CLASS: {
    room_id: 'required', // Overridden by modality
    personnel_id: 'required',
    section_ids: 'required',
    subject: 'required',
    exam_title: 'hidden',
    exam_type: 'hidden',
    recurrence_pattern: 'required'
  },
  EXAM: {
    room_id: 'required', // Always required for EXAM, regardless of modality
    personnel_id: 'optional',
    section_ids: 'required',
    subject: 'optional',
    exam_title: 'required',
    exam_type: 'required',
    recurrence_pattern: 'hidden' // Locked to ONCE
  },
  OFFICE: {
    room_id: 'required', // Overridden by modality
    personnel_id: 'required',
    section_ids: 'hidden',
    subject: 'hidden',
    exam_title: 'hidden',
    exam_type: 'hidden',
    recurrence_pattern: 'required'
  },
  MEETING: {
    room_id: 'required', // Overridden by modality
    personnel_id: 'optional',
    section_ids: 'hidden',
    subject: 'hidden',
    exam_title: 'hidden',
    exam_type: 'hidden',
    recurrence_pattern: 'required'
  },
  EVENT: {
    room_id: 'optional',
    personnel_id: 'optional',
    section_ids: 'hidden',
    subject: 'hidden',
    exam_title: 'hidden',
    exam_type: 'hidden',
    recurrence_pattern: 'required'
  },
  MAINTENANCE: {
    room_id: 'required',
    personnel_id: 'hidden',
    section_ids: 'hidden',
    subject: 'hidden',
    exam_title: 'hidden',
    exam_type: 'hidden',
    recurrence_pattern: 'required'
  }
}

/**
 * Given an activity type and modality, resolve the effective room_id visibility.
 * EXAM always requires room. Other types depend on modality.
 */
export function resolveRoomVisibility(
  activityType: ActivityType,
  modality: Modality
): 'required' | 'optional' | 'hidden' {
  if (activityType === 'EXAM') return 'required'
  if (modality === 'F2F') return 'required'
  if (modality === 'HYBRID') return 'optional'
  return 'hidden' // ONLINE
}

// === Recurrence Patterns ===

export const RECURRENCE_PATTERNS: readonly RecurrencePattern[] = [
  'ONCE',
  'DAILY',
  'WEEKDAYS',
  'WEEKLY',
  'BI_WEEKLY',
  'MWF',
  'TTH',
  'MTH',
  'MONTHLY_DATE',
  'MONTHLY_DAY',
  'CUSTOM'
] as const

export const RECURRENCE_PATTERN_LABELS: Record<RecurrencePattern, string> = {
  ONCE: 'Once',
  DAILY: 'Daily',
  WEEKDAYS: 'Weekdays (Mon–Fri)',
  WEEKLY: 'Weekly',
  BI_WEEKLY: 'Bi-Weekly',
  MWF: 'Mon / Wed / Fri',
  TTH: 'Tue / Thu',
  MTH: 'Mon / Tue / Thu',
  MONTHLY_DATE: 'Monthly (same date)',
  MONTHLY_DAY: 'Monthly (same day)',
  CUSTOM: 'Custom Days'
}

// === Simplified Pattern Modes (UI) ===

export const PATTERN_MODE_LABELS: Record<PatternMode, string> = {
  WEEKLY: 'Weekly',
  ONCE: 'Once',
  MONTHLY: 'Monthly'
}

/** Short day-of-week labels indexed by JS day number (0=Sun, 1=Mon … 6=Sat) */
export const DAY_LABELS: readonly string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Day numbers in display order: Mon(1)…Sun(0) */
export const DAYS_IN_ORDER: readonly number[] = [1, 2, 3, 4, 5, 6, 0]

/**
 * Convert a simplified PatternMode + selected days into the backend
 * RecurrencePattern + options that schedule-entry-service expects.
 */
export function patternModeToRecurrence(
  mode: PatternMode,
  selectedDays: number[],
  dayOfMonth: number | null
): {
  recurrence_pattern: RecurrencePattern
  custom_days: number[] | null
  day_of_month: number | null
} {
  switch (mode) {
    case 'ONCE':
      return { recurrence_pattern: 'ONCE', custom_days: null, day_of_month: null }
    case 'MONTHLY':
      return { recurrence_pattern: 'MONTHLY_DATE', custom_days: null, day_of_month: dayOfMonth }
    case 'WEEKLY':
    default:
      return { recurrence_pattern: 'CUSTOM', custom_days: [...selectedDays].sort(), day_of_month: null }
  }
}

/**
 * Reverse-map a stored RecurrencePattern + custom_days back into a
 * PatternMode + selectedDays for editing existing entries.
 */
export function recurrenceToPatternMode(
  pattern: RecurrencePattern,
  customDays: string | null,
  dayOfWeek: number | null,
  dayOfMonth: number | null
): { mode: PatternMode; selectedDays: number[]; dayOfMonth: number | null } {
  switch (pattern) {
    case 'ONCE':
      return { mode: 'ONCE', selectedDays: [], dayOfMonth: null }
    case 'MONTHLY_DATE':
      return { mode: 'MONTHLY', selectedDays: [], dayOfMonth: dayOfMonth }
    case 'MONTHLY_DAY':
      return { mode: 'MONTHLY', selectedDays: [], dayOfMonth: dayOfMonth }
    case 'DAILY':
      return { mode: 'WEEKLY', selectedDays: [0, 1, 2, 3, 4, 5, 6], dayOfMonth: null }
    case 'WEEKDAYS':
      return { mode: 'WEEKLY', selectedDays: [1, 2, 3, 4, 5], dayOfMonth: null }
    case 'MWF':
      return { mode: 'WEEKLY', selectedDays: [1, 3, 5], dayOfMonth: null }
    case 'TTH':
      return { mode: 'WEEKLY', selectedDays: [2, 4], dayOfMonth: null }
    case 'MTH':
      return { mode: 'WEEKLY', selectedDays: [1, 2, 4], dayOfMonth: null }
    case 'WEEKLY':
      return { mode: 'WEEKLY', selectedDays: dayOfWeek != null ? [dayOfWeek] : [1], dayOfMonth: null }
    case 'BI_WEEKLY':
      return { mode: 'WEEKLY', selectedDays: dayOfWeek != null ? [dayOfWeek] : [1], dayOfMonth: null }
    case 'CUSTOM': {
      const days: number[] = customDays ? JSON.parse(customDays) : []
      return { mode: 'WEEKLY', selectedDays: days, dayOfMonth: null }
    }
    default:
      return { mode: 'WEEKLY', selectedDays: [1, 3, 5], dayOfMonth: null }
  }
}

export const MAX_RECURRENCE_OCCURRENCES = 200

// === Calendar Event Types ===

export const CALENDAR_EVENT_TYPES: readonly CalendarEventType[] = [
  'HOLIDAY',
  'EXAM_PERIOD',
  'BREAK',
  'INSTITUTIONAL_EVENT',
  'CUSTOM'
] as const

// === Conflict Codes ===

export const CONFLICT_CODES = {
  ROOM_CONFLICT: { code: 'room_conflict', severity: 'HARD' as ConflictSeverity },
  PERSONNEL_CONFLICT: { code: 'personnel_conflict', severity: 'HARD' as ConflictSeverity },
  SECTION_CONFLICT: { code: 'section_conflict', severity: 'HARD' as ConflictSeverity },
  BLOCKED_BY_EVENT: { code: 'blocked_by_event', severity: 'HARD' as ConflictSeverity },
  PERSONNEL_OVERLOAD: { code: 'personnel_overload', severity: 'HARD' as ConflictSeverity },
  CAPACITY_EXCEEDED: { code: 'capacity_exceeded', severity: 'SOFT' as ConflictSeverity },
  WORKLOAD_APPROACHING: { code: 'workload_approaching', severity: 'SOFT' as ConflictSeverity },
  SPECIALIZATION_MISMATCH: {
    code: 'specialization_mismatch',
    severity: 'SOFT' as ConflictSeverity
  },
  ROOM_UNAVAILABLE: { code: 'room_unavailable', severity: 'HARD' as ConflictSeverity },
  ROOM_DEPT_MISMATCH: { code: 'room_dept_mismatch', severity: 'HARD' as ConflictSeverity },
  PERSONNEL_DEPT_MISMATCH: {
    code: 'personnel_dept_mismatch',
    severity: 'SOFT' as ConflictSeverity
  },
  EXAM_PERIOD_MISMATCH: { code: 'exam_period_mismatch', severity: 'SOFT' as ConflictSeverity },
  EXAM_QUARTER_MISMATCH: { code: 'exam_quarter_mismatch', severity: 'SOFT' as ConflictSeverity },
  PERSONNEL_INACTIVE: { code: 'personnel_inactive', severity: 'HARD' as ConflictSeverity },
  SECTION_INACTIVE: { code: 'section_inactive', severity: 'HARD' as ConflictSeverity }
} as const

// === Error Codes ===

export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
  PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
  PASSWORD_MISMATCH: 'PASSWORD_MISMATCH',
  RATE_LIMITED: 'RATE_LIMITED',
  FORBIDDEN_SETTING: 'FORBIDDEN_SETTING',
  WRONG_CURRENT_PASSWORD: 'WRONG_CURRENT_PASSWORD',

  // Setup
  SETUP_ALREADY_COMPLETE: 'SETUP_ALREADY_COMPLETE',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_TIME_RANGE: 'INVALID_TIME_RANGE',
  MIDNIGHT_SPANNING: 'MIDNIGHT_SPANNING',
  INVALID_START_MONTH: 'INVALID_START_MONTH',
  DATE_OUT_OF_RANGE: 'DATE_OUT_OF_RANGE',

  // Uniqueness
  DUPLICATE_LABEL: 'DUPLICATE_LABEL',
  DUPLICATE_ROOM_CODE: 'DUPLICATE_ROOM_CODE',
  DUPLICATE_SECTION_CODE: 'DUPLICATE_SECTION_CODE',
  DUPLICATE_EMPLOYEE_ID: 'DUPLICATE_EMPLOYEE_ID',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  DUPLICATE_SEMESTER_TYPE: 'DUPLICATE_SEMESTER_TYPE',
  DUPLICATE_TITLE: 'DUPLICATE_TITLE',
  DUPLICATE_TEMPLATE_NAME: 'DUPLICATE_TEMPLATE_NAME',

  // Protection
  DELETE_PROTECTED: 'DELETE_PROTECTED',
  CANNOT_EDIT_PUBLISHED: 'CANNOT_EDIT_PUBLISHED',

  // Scheduling
  NO_ACTIVE_TERM: 'NO_ACTIVE_TERM',
  NO_ACTIVE_SEMESTER: 'NO_ACTIVE_SEMESTER',
  SEMESTER_INACTIVE: 'SEMESTER_INACTIVE',
  ROOM_REQUIRED: 'ROOM_REQUIRED',
  EXAM_ONCE_ONLY: 'EXAM_ONCE_ONLY',
  INVALID_EXAM_TYPE: 'INVALID_EXAM_TYPE',
  CROSS_DEPT_SECTIONS: 'CROSS_DEPT_SECTIONS',
  MAX_OCCURRENCES_EXCEEDED: 'MAX_OCCURRENCES_EXCEEDED',
  HARD_CONFLICT: 'HARD_CONFLICT',

  // Import
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  ROW_LIMIT_EXCEEDED: 'ROW_LIMIT_EXCEEDED',
  INVALID_HEADERS: 'INVALID_HEADERS',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  PARSE_TIMEOUT: 'PARSE_TIMEOUT',

  // Backup
  INTEGRITY_CHECK_FAILED: 'INTEGRITY_CHECK_FAILED',

  // Generic
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const

// === SHS Exam Types ===

export const SHS_EXAM_TYPES = ['Q1_EXAM', 'Q2_EXAM', 'Q3_EXAM', 'Q4_EXAM'] as const
export const COLLEGE_EXAM_TYPES = ['PRELIM', 'MIDTERM', 'PRE_FINALS', 'FINALS'] as const

// === Semester Types per Department ===

export const SHS_SEMESTER_TYPES = ['1ST_SEMESTER', '2ND_SEMESTER'] as const
export const COLLEGE_SEMESTER_TYPES = ['1ST_SEMESTER', '2ND_SEMESTER', 'SUMMER'] as const

// === Settings Keys ===

export const SETTINGS_KEYS = {
  ADMIN_PASSWORD_HASH: 'admin_password_hash',
  SHS_PERIOD_LENGTH: 'shs_period_length',
  COLLEGE_PERIOD_LENGTH: 'college_period_length',
  SHS_TIME_SLOT_START: 'shs_time_slot_start',
  SHS_TIME_SLOT_END: 'shs_time_slot_end',
  COLLEGE_TIME_SLOT_START: 'college_time_slot_start',
  COLLEGE_TIME_SLOT_END: 'college_time_slot_end',
  INSTITUTION_LOGO: 'institution_logo',
  FOOTER_CREDIT: 'footer_credit',
  LAST_BACKUP_DATE: 'last_backup_date'
} as const

// === Defaults ===

export const DEFAULTS = {
  SHS_PERIOD_LENGTH: 60,
  COLLEGE_PERIOD_LENGTH: 90,
  TIME_SLOT_START: '07:00',
  TIME_SLOT_END: '21:00',
  MAX_WEEKLY_HOURS: 40,
  MIN_WEEKLY_HOURS: 1,
  MAX_WEEKLY_HOURS_LIMIT: 80,
  PASSWORD_MIN_LENGTH: 8,
  BCRYPT_COST: 10,
  IMPORT_MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  IMPORT_MAX_ROWS: 1000,
  IMPORT_PARSE_TIMEOUT: 30000, // 30s
  TEMPLATE_NAME_MIN_LENGTH: 3,
  FOOTER_CREDIT_MAX_LENGTH: 200,
  LOGO_MAX_SIZE: 2 * 1024 * 1024, // 2MB
  CALENDAR_TITLE_MIN_LENGTH: 2,
  AUTO_BACKUP_MAX_FILES: 5,
  BACKUP_REMINDER_DAYS: 7,
  AUDIT_RETENTION_MONTHS: 24,
  TRASH_RETENTION_DAYS: 90
} as const
