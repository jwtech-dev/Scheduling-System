-- ============================================================
-- Migration 006: Subject Bank
-- ============================================================

CREATE TABLE IF NOT EXISTS subject_bank (
  id TEXT PRIMARY KEY,
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  description TEXT,
  course_program TEXT NOT NULL,
  year_level TEXT NOT NULL,
  semester_type TEXT NOT NULL CHECK (semester_type IN ('1ST', '2ND', 'SUMMER')),
  lec_units INTEGER NOT NULL DEFAULT 0,
  lab_units INTEGER NOT NULL DEFAULT 0,
  pre_requisites TEXT,
  department TEXT NOT NULL CHECK (department IN ('SHS', 'COLLEGE')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (subject_code, course_program, year_level, semester_type, department)
);

CREATE INDEX IF NOT EXISTS idx_subject_bank_dept ON subject_bank(department);
CREATE INDEX IF NOT EXISTS idx_subject_bank_course ON subject_bank(course_program);
CREATE INDEX IF NOT EXISTS idx_subject_bank_active ON subject_bank(is_active);
