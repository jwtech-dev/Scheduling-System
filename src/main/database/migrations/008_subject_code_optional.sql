-- ============================================================
-- Migration 008: Make subject_code optional, dedup by subject_name
-- ============================================================
-- Curriculum imports don't have subject codes.
-- Allow empty subject_code and change unique constraint to use subject_name.

CREATE TABLE IF NOT EXISTS subject_bank_new (
  id TEXT PRIMARY KEY,
  subject_code TEXT NOT NULL DEFAULT '',
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
  UNIQUE (subject_name, course_program, year_level, semester_type, department)
);

INSERT OR IGNORE INTO subject_bank_new SELECT * FROM subject_bank;
DROP TABLE subject_bank;
ALTER TABLE subject_bank_new RENAME TO subject_bank;

CREATE INDEX IF NOT EXISTS idx_subject_bank_dept ON subject_bank(department);
CREATE INDEX IF NOT EXISTS idx_subject_bank_course ON subject_bank(course_program);
CREATE INDEX IF NOT EXISTS idx_subject_bank_active ON subject_bank(is_active);
