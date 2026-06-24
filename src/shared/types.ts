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


export type GradeLevel = 'GRADE_11' | 'GRADE_12'

export type SemesterType = '1ST_SEMESTER' | '2ND_SEMESTER' | '3RD_SEMESTER' | 'SUMMER'

export type SemesterStatus = 'DRAFT' | 'PUBLISHED'

export type QuarterLabel = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export type QuarterStatus = 'DRAFT' | 'PUBLISHED'

export type AcademicYearStatus = 'DRAFT' | 'PUBLISHED' | 'COMPLETED'

export type PersonnelStatus = 'ACTIVE' | 'INACTIVE'

export type SectionStatus = 'ACTIVE' | 'INACTIVE'

export type PersonnelType = 'FACULTY' | 'STAFF' | 'ADMIN'

export type CalendarEventType =
  | 'HOLIDAY'
  | 'EXAM_PERIOD'
  | 'EXAMINATION'
  | 'BREAK'
  | 'INSTITUTIONAL_EVENT'
  | 'SCHOOL_EVENT'
  | 'SPECIAL_EVENT'
  | 'CLASS'
  | 'ENROLLMENT'
  | 'CUSTOM'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'OVERRIDE'
  | 'PUBLISH'
  | 'UNPUBLISH'
  | 'RESTORE'
  | 'PERMANENT_DELETE'

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

export type SHSTriExamType = 'T1_EXAM' | 'T2_EXAM' | 'T3_EXAM'

export type CollegeExamType = 'PRELIM' | 'MIDTERM' | 'PRE_FINALS' | 'FINALS'

export type ExamType = SHSExamType | SHSTriExamType | CollegeExamType

export type ImportTarget = 'PERSONNEL' | 'SECTIONS' | 'ROOMS' | 'CALENDAR_EVENTS' | 'SUBJECT_BANK'

export type CarryForwardEntity = 'SECTIONS' | 'CLASS_SCHEDULES' | 'EXAM_SCHEDULES' | 'CALENDAR_EVENTS'

// === Entity Interfaces ===

export interface AcademicYear {
  id: string
  department: Department
  label: string
  start_date: string
  end_date: string
  is_active: number
  status: AcademicYearStatus
  created_at: string
  updated_at: string
}

export interface Semester {
  id: string
  academic_year_id: string
  department: Department
  semester_type: SemesterType
  grade_level: GradeLevel | null
  start_date: string
  end_date: string
  is_active: number
  status: SemesterStatus
  q1_end_date: string | null
  q3_end_date: string | null
  created_at: string
  updated_at: string
}

export interface Quarter {
  id: string
  semester_id: string
  department: Department
  quarter_label: QuarterLabel
  start_date: string
  end_date: string
  is_active: number
  status: QuarterStatus
  created_at: string
  updated_at: string
  archived_at: string | null
  archived_by: string | null
}

export interface CalendarEvent {
  id: string
  title: string
  event_type: CalendarEventType
  exam_type: ExamType | null
  department: Department | null
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
  grade_level: GradeLevel | null
  student_count: number
  academic_year_id: string | null
  semester_id: string | null
  semester_type: string | null
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
  semester_type: '1ST' | '2ND' | '3RD' | 'SUMMER'
  lec_units: number
  lab_units: number
  pre_requisites: string | null
  department: Department
  is_active: number
  created_at: string
  updated_at: string
}

export interface Program {
  id: string
  name: string
  description: string | null
  department: Department
  is_active: number
  archived_at: string | null
  archived_by: string | null
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

// === Carry Forward ===

export interface CarryForwardRequest {
  source_academic_year_id: string
  source_semester_id: string
  target_academic_year_id: string
  target_semester_id: string
  department: Department
  entities: CarryForwardEntity[]
}

export interface CarryForwardEntityResult {
  entity: CarryForwardEntity
  created: number
  skipped: number
  skipped_reasons: string[]
}

export interface CarryForwardPreview {
  source_label: string
  target_label: string
  counts: Record<CarryForwardEntity, number>
}

export interface CarryForwardResult {
  results: CarryForwardEntityResult[]
  total_created: number
  total_skipped: number
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

export interface GradeLevelTerm {
  semester: Semester | null
  quarter: Quarter | null
}

export interface ActiveTerm {
  academicYear: AcademicYear | null
  semester: Semester | null
  quarter: Quarter | null
  /** SHS only: per-grade-level active semesters (populated when no specific grade_level is requested) */
  gradeLevelTerms?: Record<GradeLevel, GradeLevelTerm> | null
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

// === Auto-Update ===

export type UpdateStatus =
  | 'checking'
  | 'up-to-date'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface UpdateInfo {
  status: UpdateStatus
  currentVersion: string
  availableVersion?: string
  error?: string
  isDismissed?: boolean
}

export interface UpdateDownloadProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

