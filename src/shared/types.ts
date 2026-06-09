// ============================================================
// Shared Type Definitions — Schedule Management System
// ============================================================
// Used by main, preload, and renderer processes.
// Keep types aligned with the SQLite schema (001_initial_schema.sql).

// === Department & Core Enums ===

export type Department = 'SHS' | 'COLLEGE'

export type ActivityType = 'CLASS' | 'EXAM' | 'OFFICE' | 'MEETING' | 'EVENT' | 'MAINTENANCE'

export type Modality = 'F2F' | 'ONLINE' | 'HYBRID'

export type EntryStatus = 'DRAFT' | 'PUBLISHED'

export type RoomStatus = 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE'

export type DepartmentAvailability = 'SHS_ONLY' | 'COLLEGE_ONLY' | 'SHARED'

export type SemesterType = '1ST_SEMESTER' | '2ND_SEMESTER' | 'SUMMER'

export type SemesterStatus = 'DRAFT' | 'PUBLISHED'

export type PersonnelStatus = 'ACTIVE' | 'INACTIVE'

export type SectionStatus = 'ACTIVE' | 'INACTIVE'

export type PersonnelType = 'FACULTY' | 'STAFF' | 'ADMIN'

export type CalendarEventType =
  | 'HOLIDAY'
  | 'EXAM_PERIOD'
  | 'BREAK'
  | 'INSTITUTIONAL_EVENT'
  | 'CUSTOM'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'OVERRIDE'
  | 'PUBLISH'
  | 'UNPUBLISH'

export type ConflictSeverity = 'HARD' | 'SOFT'

export type RecurrencePattern =
  | 'ONCE'
  | 'DAILY'
  | 'WEEKDAYS'
  | 'WEEKLY'
  | 'BI_WEEKLY'
  | 'MWF'
  | 'TTH'
  | 'MTH'
  | 'MONTHLY_DATE'
  | 'MONTHLY_DAY'
  | 'CUSTOM'

/** Simplified UI pattern modes (maps to RecurrencePattern + options on submit) */
export type PatternMode = 'WEEKLY' | 'ONCE' | 'MONTHLY'

export type SHSExamType = 'Q1_EXAM' | 'Q2_EXAM' | 'Q3_EXAM' | 'Q4_EXAM'

export type CollegeExamType = 'PRELIM' | 'MIDTERM' | 'PRE_FINALS' | 'FINALS'

export type ExamType = SHSExamType | CollegeExamType

export type ImportTarget = 'PERSONNEL' | 'SECTIONS' | 'ROOMS' | 'CALENDAR_EVENTS' | 'SUBJECT_BANK'

export type TemplateScope = 'ALL_ENTRIES' | 'CLASS_ONLY' | 'EXAM_ONLY'

export type TemplateDeptScope = 'SHS' | 'COLLEGE' | 'CROSS_DEPARTMENT'

// === Entity Interfaces ===

export interface AcademicYear {
  id: string
  department: Department
  label: string
  start_date: string
  end_date: string
  is_active: number
  created_at: string
  updated_at: string
}

export interface Semester {
  id: string
  academic_year_id: string
  department: Department
  semester_type: SemesterType
  start_date: string
  end_date: string
  is_active: number
  status: SemesterStatus
  q1_end_date: string | null
  q3_end_date: string | null
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: string
  title: string
  event_type: CalendarEventType
  is_blocking: number
  is_all_day: number
  start_datetime: string
  end_datetime: string
  academic_year_id: string | null
  semester_id: string | null
  description: string | null
  is_active: number
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  room_code: string
  room_name: string
  building: string | null
  floor: string | null
  capacity: number
  room_type: string | null
  department_availability: DepartmentAvailability
  status: RoomStatus
  notes: string | null
  is_active: number
  created_at: string
  updated_at: string
}

export interface Section {
  id: string
  department: Department
  section_code: string
  section_name: string | null
  strand_track: string | null
  subject: string | null
  course_program: string | null
  year_level: string | null
  student_count: number
  academic_year_id: string
  semester_id: string
  adviser_id: string | null
  status: SectionStatus
  is_active: number
  created_at: string
  updated_at: string
}

export interface SubjectBankEntry {
  id: string
  subject_code: string
  subject_name: string
  description: string | null
  course_program: string
  year_level: string
  semester_type: '1ST' | '2ND' | 'SUMMER'
  lec_units: number
  lab_units: number
  pre_requisites: string | null
  department: Department
  is_active: number
  created_at: string
  updated_at: string
}

export interface Personnel {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  email: string
  department: Department
  is_shared: number
  personnel_type: PersonnelType
  specializations: string
  max_weekly_hours: number
  honorific: string | null
  credentials: string | null
  status: PersonnelStatus
  is_active: number
  created_at: string
  updated_at: string
}

export interface ScheduleEntry {
  id: string
  department: Department
  activity_type: ActivityType
  room_id: string | null
  personnel_id: string | null
  section_ids: string
  subject: string | null
  subject_code: string | null
  lec_units: number
  lab_units: number
  exam_title: string | null
  exam_type: ExamType | null
  modality: Modality
  start_time: string
  end_time: string
  recurrence_pattern: RecurrencePattern
  recurrence_start_date: string
  recurrence_end_date: string | null
  day_of_week: number | null
  day_of_month: number | null
  week_of_month: number | null
  custom_days: string | null
  academic_year_id: string
  semester_id: string | null
  source_template_id: string | null
  status: EntryStatus
  conflict_flags: string
  notes: string | null
  is_active: number
  created_at: string
  updated_at: string
}

export interface AuditLogEntry {
  id: string
  entity_type: string
  entity_id: string
  department: Department | null
  action: AuditAction
  before_snapshot: string | null
  after_snapshot: string | null
  conflict_snapshot: string | null
  override_reason: string | null
  created_at: string
}

export interface ScheduleTemplate {
  id: string
  name: string
  description: string | null
  department_scope: TemplateDeptScope
  scope: TemplateScope
  source_department: Department
  source_academic_year_label: string
  source_semester_name: string
  is_active: number
  created_at: string
  updated_at: string
}

export interface ScheduleTemplateEntry {
  id: string
  template_id: string
  activity_type: ActivityType
  room_code: string | null
  employee_id: string | null
  section_codes: string | null
  subject: string | null
  exam_title: string | null
  exam_type: ExamType | null
  modality: Modality
  start_time: string
  end_time: string
  recurrence_pattern: RecurrencePattern
  day_of_week: number | null
  day_of_month: number | null
  week_of_month: number | null
  custom_days: string | null
  notes: string | null
  is_active: number
  created_at: string
  updated_at: string
}

export interface TemplateApplication {
  id: string
  template_id: string
  target_academic_year_id: string
  target_semester_id: string
  applied_at: string
  entry_count: number
  conflict_count: number
}

export interface ImportJob {
  id: string
  target: ImportTarget
  department: Department | null
  file_name: string
  total_rows: number
  rows_created: number
  rows_updated: number
  rows_skipped: number
  error_details: string | null
  academic_year_id: string | null
  semester_id: string | null
  created_at: string
}

export interface AppSetting {
  key: string
  value: string
  updated_at: string
}

// === IPC Request/Response Shapes ===

export interface IpcResponse<T = unknown> {
  data: T | null
  error: IpcError | null
}

export interface IpcError {
  code: string
  message: string
  details?: unknown
}

// === Conflict Types ===

export interface ConflictFlag {
  code: string
  severity: ConflictSeverity
  message: string
  details?: Record<string, unknown>
}

// === Active Term ===

export interface ActiveTerm {
  academicYear: AcademicYear | null
  semester: Semester | null
  quarter: string | null
}

// === Field Dependency Matrix ===

export type FieldVisibility = 'required' | 'optional' | 'hidden'

export interface FieldDependencyRule {
  room_id: FieldVisibility
  personnel_id: FieldVisibility
  section_ids: FieldVisibility
  subject: FieldVisibility
  exam_title: FieldVisibility
  exam_type: FieldVisibility
  recurrence_pattern: FieldVisibility
}
