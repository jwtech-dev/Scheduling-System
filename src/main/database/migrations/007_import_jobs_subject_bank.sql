-- ============================================================
-- Migration 007: Expand import_jobs target CHECK constraint
-- ============================================================
-- Idempotent: only recreates if the old constraint exists.

-- If import_jobs_new already exists from a partial run, drop it
DROP TABLE IF EXISTS import_jobs_new;

-- Check if import_jobs exists; if not, create with final schema
CREATE TABLE IF NOT EXISTS import_jobs (
  id TEXT PRIMARY KEY,
  target TEXT NOT NULL CHECK (target IN ('PERSONNEL', 'SECTIONS', 'ROOMS', 'CALENDAR_EVENTS', 'SUBJECT_BANK')),
  department TEXT,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  rows_created INTEGER NOT NULL DEFAULT 0,
  rows_updated INTEGER NOT NULL DEFAULT 0,
  rows_skipped INTEGER NOT NULL DEFAULT 0,
  error_details TEXT,
  academic_year_id TEXT,
  semester_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Try inserting a SUBJECT_BANK row to test the constraint.
-- If it succeeds, the constraint is already updated.
-- If it fails, we need to recreate the table.
INSERT INTO import_jobs (id, target, file_name) VALUES ('__migration_007_test__', 'SUBJECT_BANK', '__test__');
DELETE FROM import_jobs WHERE id = '__migration_007_test__';
