-- ============================================================
-- Migration 018: Grade-Level-Scoped Term Types
-- ============================================================
-- Adds term type configuration per SHS grade level.
-- - academic_years: grade_11_term_type, grade_12_term_type
-- - semesters: grade_level, term_type + updated CHECK/UNIQUE
-- - sections: grade_level
-- Rebuilds semesters table to add 3RD_SEMESTER to CHECK constraint
-- and update unique index to include grade_level.

-- === 1. Academic Years: Add term type columns ===
ALTER TABLE academic_years ADD COLUMN grade_11_term_type TEXT
  CHECK(grade_11_term_type IS NULL OR grade_11_term_type IN ('TWO_SEMESTER', 'TRIMESTRAL'));

ALTER TABLE academic_years ADD COLUMN grade_12_term_type TEXT
  CHECK(grade_12_term_type IS NULL OR grade_12_term_type IN ('TWO_SEMESTER', 'TRIMESTRAL'));

-- === 2. Semesters: Rebuild table with new columns, CHECK, and UNIQUE ===
-- SQLite does not support ALTER TABLE for modifying CHECK or UNIQUE constraints.
-- Strategy: rename → create new → copy → drop old → rename new.

ALTER TABLE semesters RENAME TO _semesters_old;

CREATE TABLE semesters (
  id TEXT PRIMARY KEY,
  academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
  department TEXT NOT NULL CHECK (department IN ('SHS', 'COLLEGE')),
  semester_type TEXT NOT NULL CHECK (semester_type IN ('1ST_SEMESTER', '2ND_SEMESTER', '3RD_SEMESTER', 'SUMMER')),
  grade_level TEXT CHECK (grade_level IS NULL OR grade_level IN ('GRADE_11', 'GRADE_12')),
  term_type TEXT CHECK (term_type IS NULL OR term_type IN ('TWO_SEMESTER', 'TRIMESTRAL')),
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

-- Copy data from old table, backfilling term_type for SHS
INSERT INTO semesters (
  id, academic_year_id, department, semester_type,
  grade_level, term_type,
  start_date, end_date, is_active, status,
  q1_end_date, q3_end_date,
  created_at, updated_at, archived_at, archived_by
)
SELECT
  id, academic_year_id, department, semester_type,
  NULL,  -- grade_level: NULL for legacy data
  CASE WHEN department = 'SHS' THEN 'TWO_SEMESTER' ELSE NULL END,  -- term_type backfill
  start_date, end_date, is_active, status,
  q1_end_date, q3_end_date,
  created_at, updated_at, archived_at, archived_by
FROM _semesters_old;

DROP TABLE _semesters_old;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_semesters_ay ON semesters(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_semesters_active ON semesters(academic_year_id, is_active);
CREATE INDEX IF NOT EXISTS idx_semesters_archived ON semesters(archived_at);
CREATE INDEX IF NOT EXISTS idx_semesters_grade_level ON semesters(academic_year_id, grade_level);

-- New unique index: one semester_type per grade_level per academic year (among non-archived)
CREATE UNIQUE INDEX IF NOT EXISTS uq_semesters_ay_type_grade
  ON semesters(academic_year_id, semester_type, grade_level)
  WHERE archived_at IS NULL;

-- === 3. Sections: Add grade_level column ===
ALTER TABLE sections ADD COLUMN grade_level TEXT
  CHECK(grade_level IS NULL OR grade_level IN ('GRADE_11', 'GRADE_12'));
