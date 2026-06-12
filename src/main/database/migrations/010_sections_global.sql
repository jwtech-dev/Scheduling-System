-- Migration 010: Make sections year-independent (global templates)
-- Adds semester_type directly on the sections row so sections can exist
-- without being tied to a specific academic_year/semester record.
-- Backfills semester_type from the joined semesters table for existing rows.

-- 1. Add semester_type column (nullable for backward compat)
ALTER TABLE sections ADD COLUMN semester_type TEXT;

-- 2. Backfill from semesters table for existing rows that have semester_id
UPDATE sections
SET semester_type = (
  CASE
    WHEN (SELECT semester_type FROM semesters WHERE id = sections.semester_id) = '1ST_SEMESTER' THEN '1ST'
    WHEN (SELECT semester_type FROM semesters WHERE id = sections.semester_id) = '2ND_SEMESTER' THEN '2ND'
    WHEN (SELECT semester_type FROM semesters WHERE id = sections.semester_id) = 'SUMMER'       THEN 'SUMMER'
    ELSE NULL
  END
)
WHERE semester_id IS NOT NULL;
