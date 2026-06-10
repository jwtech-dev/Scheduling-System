-- ============================================================
-- Migration 009: Allow Multiple Subjects Per Section
-- ============================================================
-- Recreates the sections table to change the UNIQUE constraint
-- from (department, section_code, academic_year_id, semester_id)
-- to include subject, allowing batch creation of section+subject
-- entries from the Subject Bank.
--
-- Uses COALESCE(subject, '') so NULL subjects are treated as empty
-- string for uniqueness purposes.

-- Step 1: Create new table without inline UNIQUE constraint
CREATE TABLE IF NOT EXISTS sections_new (
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
  archived_at TEXT DEFAULT NULL,
  archived_by TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Step 2: Copy existing data
INSERT INTO sections_new
  SELECT id, department, section_code, section_name, strand_track, subject,
         course_program, year_level, student_count, academic_year_id, semester_id,
         adviser_id, status, is_active, archived_at, archived_by, created_at, updated_at
  FROM sections;

-- Step 3: Drop old table (cascades old indexes and constraints)
DROP TABLE IF EXISTS sections;

-- Step 4: Rename new table
ALTER TABLE sections_new RENAME TO sections;

-- Step 5: Create expression-based UNIQUE index (includes subject via COALESCE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sections_unique
  ON sections(department, section_code, COALESCE(subject, ''), academic_year_id, semester_id);

-- Step 6: Recreate other indexes
CREATE INDEX IF NOT EXISTS idx_sections_scope
  ON sections(department, academic_year_id, semester_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sections_archived
  ON sections(archived_at);
