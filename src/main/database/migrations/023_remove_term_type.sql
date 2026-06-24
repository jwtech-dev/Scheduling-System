-- ============================================================
-- Migration 023: Remove Term Type from SHS
-- ============================================================
-- Removes the TWO_SEMESTER / TRIMESTRAL term type concept.
-- SHS grade levels now simply have 1ST, 2ND, 3RD_SEMESTER available.
--
-- Changes:
--   academic_years: drops grade_11_term_type, grade_12_term_type columns
--   semesters: drops term_type column

-- === 1. Rebuild academic_years without term type columns ===

CREATE TABLE IF NOT EXISTS _academic_years_new (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL CHECK (department IN ('SHS', 'COLLEGE')),
  label TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  archived_at TEXT DEFAULT NULL,
  archived_by TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED', 'COMPLETED')),
  UNIQUE (department, label)
);

INSERT INTO _academic_years_new (
  id, department, label, start_date, end_date, is_active,
  created_at, updated_at, archived_at, archived_by, status
)
SELECT
  id, department, label, start_date, end_date, is_active,
  created_at, updated_at, archived_at, archived_by, status
FROM academic_years;

DROP TABLE academic_years;
ALTER TABLE _academic_years_new RENAME TO academic_years;

CREATE INDEX idx_academic_years_department ON academic_years(department);
CREATE INDEX idx_academic_years_active ON academic_years(department, is_active);
CREATE INDEX idx_academic_years_archived ON academic_years(archived_at);

-- === 2. Rebuild semesters without term_type column ===

CREATE TABLE IF NOT EXISTS _semesters_new (
  id TEXT PRIMARY KEY,
  academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
  department TEXT NOT NULL CHECK (department IN ('SHS', 'COLLEGE')),
  semester_type TEXT NOT NULL CHECK (semester_type IN ('1ST_SEMESTER', '2ND_SEMESTER', '3RD_SEMESTER', 'SUMMER')),
  grade_level TEXT CHECK (grade_level IS NULL OR grade_level IN ('GRADE_11', 'GRADE_12')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED')),
  q1_end_date TEXT,
  q3_end_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  archived_at TEXT DEFAULT NULL,
  archived_by TEXT DEFAULT NULL
);

INSERT INTO _semesters_new (
  id, academic_year_id, department, semester_type, grade_level,
  start_date, end_date, is_active, status,
  q1_end_date, q3_end_date,
  created_at, updated_at, archived_at, archived_by
)
SELECT
  id, academic_year_id, department, semester_type, grade_level,
  start_date, end_date, is_active, status,
  q1_end_date, q3_end_date,
  created_at, updated_at, archived_at, archived_by
FROM semesters;

DROP TABLE semesters;
ALTER TABLE _semesters_new RENAME TO semesters;

CREATE INDEX idx_semesters_ay ON semesters(academic_year_id);
CREATE INDEX idx_semesters_active ON semesters(academic_year_id, is_active);
CREATE INDEX idx_semesters_archived ON semesters(archived_at);
CREATE INDEX idx_semesters_grade_level ON semesters(academic_year_id, grade_level);

CREATE UNIQUE INDEX uq_semesters_ay_type_grade
  ON semesters(academic_year_id, semester_type, grade_level)
  WHERE archived_at IS NULL;
