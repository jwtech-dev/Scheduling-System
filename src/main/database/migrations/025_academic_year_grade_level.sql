-- ============================================================
-- Migration 025: Add grade_level to academic_years for SHS
-- ============================================================
-- SHS Grade 11 and Grade 12 get completely separate academic years.
-- College academic years remain unchanged (grade_level = NULL).
--
-- Changes:
--   academic_years: adds grade_level column, updates UNIQUE constraint
--   Existing SHS AYs: duplicated into Grade 11 + Grade 12 copies
--   semesters, calendar_events, sections, schedule_entries: re-pointed

PRAGMA foreign_keys = OFF;

-- === 1. Rebuild academic_years with grade_level column ===

CREATE TABLE IF NOT EXISTS _academic_years_new (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL CHECK (department IN ('SHS', 'COLLEGE')),
  grade_level TEXT CHECK (grade_level IS NULL OR grade_level IN ('GRADE_11', 'GRADE_12')),
  label TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  archived_at TEXT DEFAULT NULL,
  archived_by TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED', 'COMPLETED')),
  UNIQUE (department, label, grade_level)
);

-- Copy all existing rows (College gets NULL grade_level, SHS temporarily gets NULL too)
INSERT INTO _academic_years_new (
  id, department, grade_level, label, start_date, end_date, is_active,
  created_at, updated_at, archived_at, archived_by, status
)
SELECT
  id, department, NULL, label, start_date, end_date, is_active,
  created_at, updated_at, archived_at, archived_by, status
FROM academic_years;

DROP TABLE academic_years;
ALTER TABLE _academic_years_new RENAME TO academic_years;

CREATE INDEX idx_academic_years_department ON academic_years(department);
CREATE INDEX idx_academic_years_active ON academic_years(department, is_active);
CREATE INDEX idx_academic_years_archived ON academic_years(archived_at);
CREATE INDEX idx_academic_years_grade_level ON academic_years(department, grade_level);

-- === 2. Duplicate SHS AYs into Grade 11 + Grade 12 copies ===

-- For each SHS AY, create a GRADE_11 copy with a new UUID-style id
-- The original row becomes GRADE_12

-- Create Grade 11 copies (new id = original_id || '_G11')
INSERT INTO academic_years (
  id, department, grade_level, label, start_date, end_date, is_active,
  created_at, updated_at, archived_at, archived_by, status
)
SELECT
  id || '_G11', department, 'GRADE_11', label, start_date, end_date, is_active,
  created_at, updated_at, archived_at, archived_by, status
FROM academic_years
WHERE department = 'SHS';

-- Update original SHS rows to be GRADE_12 copies (new id = original_id || '_G12')
INSERT INTO academic_years (
  id, department, grade_level, label, start_date, end_date, is_active,
  created_at, updated_at, archived_at, archived_by, status
)
SELECT
  id || '_G12', department, 'GRADE_12', label, start_date, end_date, is_active,
  created_at, updated_at, archived_at, archived_by, status
FROM academic_years
WHERE department = 'SHS' AND grade_level IS NULL;

-- === 3. Re-point semesters to the new grade-level-specific AYs ===

-- Semesters with grade_level = 'GRADE_11' → point to the G11 AY copy
UPDATE semesters
SET academic_year_id = academic_year_id || '_G11'
WHERE department = 'SHS'
  AND grade_level = 'GRADE_11'
  AND EXISTS (SELECT 1 FROM academic_years WHERE id = semesters.academic_year_id || '_G11');

-- Semesters with grade_level = 'GRADE_12' → point to the G12 AY copy
UPDATE semesters
SET academic_year_id = academic_year_id || '_G12'
WHERE department = 'SHS'
  AND grade_level = 'GRADE_12'
  AND EXISTS (SELECT 1 FROM academic_years WHERE id = semesters.academic_year_id || '_G12');

-- Semesters with NULL grade_level (legacy) → point to G11 copy by default
UPDATE semesters
SET academic_year_id = academic_year_id || '_G11',
    grade_level = 'GRADE_11'
WHERE department = 'SHS'
  AND grade_level IS NULL
  AND EXISTS (SELECT 1 FROM academic_years WHERE id = semesters.academic_year_id || '_G11');

-- === 4. Re-point calendar_events ===
-- Events linked to SHS AYs: if they have a semester_id, follow the semester's new AY.
-- If they only have an academic_year_id (no semester), duplicate to both grade levels isn't practical,
-- so default them to the G11 copy.

UPDATE calendar_events
SET academic_year_id = (
  SELECT s.academic_year_id FROM semesters s WHERE s.id = calendar_events.semester_id
)
WHERE semester_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM semesters s WHERE s.id = calendar_events.semester_id AND s.department = 'SHS');

-- Events with only academic_year_id (no semester) → default to G11
UPDATE calendar_events
SET academic_year_id = academic_year_id || '_G11'
WHERE semester_id IS NULL
  AND academic_year_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM academic_years WHERE id = calendar_events.academic_year_id || '_G11');

-- === 5. Re-point sections ===

UPDATE sections
SET academic_year_id = (
  SELECT s.academic_year_id FROM semesters s WHERE s.id = sections.semester_id
)
WHERE semester_id IS NOT NULL
  AND department = 'SHS'
  AND EXISTS (SELECT 1 FROM semesters s WHERE s.id = sections.semester_id);

-- Sections with academic_year_id but no semester → default to G11
UPDATE sections
SET academic_year_id = academic_year_id || '_G11'
WHERE department = 'SHS'
  AND (semester_id IS NULL OR NOT EXISTS (SELECT 1 FROM semesters s WHERE s.id = sections.semester_id))
  AND academic_year_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM academic_years WHERE id = sections.academic_year_id || '_G11');

-- === 6. Re-point schedule_entries ===

UPDATE schedule_entries
SET academic_year_id = (
  SELECT s.academic_year_id FROM semesters s WHERE s.id = schedule_entries.semester_id
)
WHERE semester_id IS NOT NULL
  AND department = 'SHS'
  AND EXISTS (SELECT 1 FROM semesters s WHERE s.id = schedule_entries.semester_id);

-- Schedule entries with academic_year_id but no semester → default to G11
UPDATE schedule_entries
SET academic_year_id = academic_year_id || '_G11'
WHERE department = 'SHS'
  AND (semester_id IS NULL OR NOT EXISTS (SELECT 1 FROM semesters s WHERE s.id = schedule_entries.semester_id))
  AND academic_year_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM academic_years WHERE id = schedule_entries.academic_year_id || '_G11');

-- === 7. Re-point import_jobs (soft reference, no FK constraint) ===

UPDATE import_jobs
SET academic_year_id = academic_year_id || '_G11'
WHERE academic_year_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM academic_years WHERE id = import_jobs.academic_year_id || '_G11');

-- === 8. Remove the original SHS AY rows (grade_level IS NULL) ===
-- These are the originals that have been duplicated into G11 + G12 copies

DELETE FROM academic_years
WHERE department = 'SHS' AND grade_level IS NULL;

PRAGMA foreign_keys = ON;
