-- ============================================================
-- 001_initial_schema.sql — Full database schema
-- ============================================================
-- Creates all 14 tables for the Schedule Management System.
-- Tables: _schema_versions (created by migrator), app_settings,
--   academic_years, semesters, calendar_events, rooms, sections,
--   personnel, schedule_entries, audit_log, schedule_templates,
--   schedule_template_entries, schedule_template_applications, import_jobs

-- === App Settings ===
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- === Academic Years ===
CREATE TABLE IF NOT EXISTS academic_years (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL CHECK (department IN ('SHS', 'COLLEGE')),
  label TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (department, label)
);
CREATE INDEX IF NOT EXISTS idx_academic_years_department ON academic_years(department);
CREATE INDEX IF NOT EXISTS idx_academic_years_active ON academic_years(department, is_active);

-- === Semesters ===
CREATE TABLE IF NOT EXISTS semesters (
  id TEXT PRIMARY KEY,
  academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
  department TEXT NOT NULL CHECK (department IN ('SHS', 'COLLEGE')),
  semester_type TEXT NOT NULL CHECK (semester_type IN ('1ST_SEMESTER', '2ND_SEMESTER', 'SUMMER')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  q1_end_date TEXT,
  q3_end_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (academic_year_id, semester_type)
);
CREATE INDEX IF NOT EXISTS idx_semesters_ay ON semesters(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_semesters_active ON semesters(academic_year_id, is_active);

-- === Calendar Events ===
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('HOLIDAY', 'EXAM_PERIOD', 'BREAK', 'INSTITUTIONAL_EVENT', 'CUSTOM')),
  is_blocking INTEGER NOT NULL DEFAULT 0,
  is_all_day INTEGER NOT NULL DEFAULT 0,
  start_datetime TEXT NOT NULL,
  end_datetime TEXT NOT NULL,
  academic_year_id TEXT REFERENCES academic_years(id),
  semester_id TEXT REFERENCES semesters(id),
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON calendar_events(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_blocking ON calendar_events(is_blocking, is_active);

-- === Rooms ===
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  room_name TEXT NOT NULL,
  building TEXT,
  floor TEXT,
  capacity INTEGER NOT NULL DEFAULT 30 CHECK (capacity >= 1),
  room_type TEXT,
  department_availability TEXT NOT NULL DEFAULT 'SHARED' CHECK (department_availability IN ('SHS_ONLY', 'COLLEGE_ONLY', 'SHARED')),
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'MAINTENANCE', 'INACTIVE')),
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rooms_dept ON rooms(department_availability, is_active);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status, is_active);

-- === Personnel ===
CREATE TABLE IF NOT EXISTS personnel (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL CHECK (department IN ('SHS', 'COLLEGE')),
  is_shared INTEGER NOT NULL DEFAULT 0,
  personnel_type TEXT NOT NULL DEFAULT 'FACULTY' CHECK (personnel_type IN ('FACULTY', 'STAFF', 'ADMIN')),
  specializations TEXT NOT NULL DEFAULT '[]',
  max_weekly_hours INTEGER NOT NULL DEFAULT 40 CHECK (max_weekly_hours >= 1 AND max_weekly_hours <= 80),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_personnel_dept ON personnel(department, is_active);
CREATE INDEX IF NOT EXISTS idx_personnel_shared ON personnel(is_shared, is_active);

-- === Sections ===
CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL CHECK (department IN ('SHS', 'COLLEGE')),
  section_code TEXT NOT NULL,
  section_name TEXT,
  strand_track TEXT,
  subject TEXT,
  course_program TEXT,
  year_level TEXT,
  student_count INTEGER NOT NULL DEFAULT 0 CHECK (student_count >= 0),
  academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
  semester_id TEXT NOT NULL REFERENCES semesters(id),
  adviser_id TEXT REFERENCES personnel(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (department, section_code, academic_year_id, semester_id)
);
CREATE INDEX IF NOT EXISTS idx_sections_scope ON sections(department, academic_year_id, semester_id, is_active);

-- === Schedule Entries ===
CREATE TABLE IF NOT EXISTS schedule_entries (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL CHECK (department IN ('SHS', 'COLLEGE')),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('CLASS', 'EXAM', 'OFFICE', 'MEETING', 'EVENT', 'MAINTENANCE')),
  room_id TEXT REFERENCES rooms(id),
  personnel_id TEXT REFERENCES personnel(id),
  section_ids TEXT NOT NULL DEFAULT '[]',
  subject TEXT,
  exam_title TEXT,
  exam_type TEXT,
  modality TEXT NOT NULL DEFAULT 'F2F' CHECK (modality IN ('F2F', 'ONLINE', 'HYBRID')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  recurrence_pattern TEXT NOT NULL DEFAULT 'ONCE' CHECK (recurrence_pattern IN (
    'ONCE', 'DAILY', 'WEEKDAYS', 'WEEKLY', 'BI_WEEKLY', 'MWF', 'TTH', 'MTH',
    'MONTHLY_DATE', 'MONTHLY_DAY', 'CUSTOM'
  )),
  recurrence_start_date TEXT NOT NULL,
  recurrence_end_date TEXT,
  day_of_week INTEGER,
  day_of_month INTEGER,
  week_of_month INTEGER,
  custom_days TEXT,
  academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
  semester_id TEXT REFERENCES semesters(id),
  source_template_id TEXT REFERENCES schedule_templates(id),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED')),
  conflict_flags TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_entries_dept_status ON schedule_entries(department, status, is_active);
CREATE INDEX IF NOT EXISTS idx_entries_room ON schedule_entries(room_id, is_active);
CREATE INDEX IF NOT EXISTS idx_entries_personnel ON schedule_entries(personnel_id, is_active);
CREATE INDEX IF NOT EXISTS idx_entries_semester ON schedule_entries(semester_id, is_active);
CREATE INDEX IF NOT EXISTS idx_entries_ay ON schedule_entries(academic_year_id, is_active);
CREATE INDEX IF NOT EXISTS idx_entries_dates ON schedule_entries(recurrence_start_date, recurrence_end_date);
CREATE INDEX IF NOT EXISTS idx_entries_activity ON schedule_entries(activity_type, is_active);

-- === Audit Log ===
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  department TEXT,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'OVERRIDE', 'PUBLISH', 'UNPUBLISH')),
  before_snapshot TEXT,
  after_snapshot TEXT,
  conflict_snapshot TEXT,
  override_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_dept ON audit_log(department);

-- Append-only trigger: block UPDATE and DELETE on audit_log
CREATE TRIGGER IF NOT EXISTS audit_log_no_update
  BEFORE UPDATE ON audit_log
  BEGIN
    SELECT RAISE(ABORT, 'Audit log records cannot be updated');
  END;

CREATE TRIGGER IF NOT EXISTS audit_log_no_delete
  BEFORE DELETE ON audit_log
  BEGIN
    SELECT RAISE(ABORT, 'Audit log records cannot be deleted');
  END;

-- === Schedule Templates ===
CREATE TABLE IF NOT EXISTS schedule_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  department_scope TEXT NOT NULL DEFAULT 'SHS' CHECK (department_scope IN ('SHS', 'COLLEGE', 'CROSS_DEPARTMENT')),
  scope TEXT NOT NULL DEFAULT 'ALL_ENTRIES' CHECK (scope IN ('ALL_ENTRIES', 'CLASS_ONLY', 'EXAM_ONLY')),
  source_department TEXT NOT NULL CHECK (source_department IN ('SHS', 'COLLEGE')),
  source_academic_year_label TEXT NOT NULL,
  source_semester_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- === Schedule Template Entries ===
CREATE TABLE IF NOT EXISTS schedule_template_entries (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES schedule_templates(id),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('CLASS', 'EXAM', 'OFFICE', 'MEETING', 'EVENT', 'MAINTENANCE')),
  room_code TEXT,
  employee_id TEXT,
  section_codes TEXT,
  subject TEXT,
  exam_title TEXT,
  exam_type TEXT,
  modality TEXT NOT NULL DEFAULT 'F2F' CHECK (modality IN ('F2F', 'ONLINE', 'HYBRID')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  recurrence_pattern TEXT NOT NULL DEFAULT 'ONCE',
  day_of_week INTEGER,
  day_of_month INTEGER,
  week_of_month INTEGER,
  custom_days TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_template_entries_template ON schedule_template_entries(template_id);

-- === Schedule Template Applications ===
CREATE TABLE IF NOT EXISTS schedule_template_applications (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES schedule_templates(id),
  target_academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
  target_semester_id TEXT NOT NULL REFERENCES semesters(id),
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  entry_count INTEGER NOT NULL DEFAULT 0,
  conflict_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_template_apps_template ON schedule_template_applications(template_id);

-- === Import Jobs ===
CREATE TABLE IF NOT EXISTS import_jobs (
  id TEXT PRIMARY KEY,
  target TEXT NOT NULL CHECK (target IN ('PERSONNEL', 'SECTIONS', 'ROOMS', 'CALENDAR_EVENTS')),
  department TEXT,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  rows_created INTEGER NOT NULL DEFAULT 0,
  rows_updated INTEGER NOT NULL DEFAULT 0,
  rows_skipped INTEGER NOT NULL DEFAULT 0,
  error_details TEXT,
  academic_year_id TEXT REFERENCES academic_years(id),
  semester_id TEXT REFERENCES semesters(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
