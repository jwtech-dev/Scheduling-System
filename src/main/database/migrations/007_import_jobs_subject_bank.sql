-- ============================================================
-- Migration 007: Expand import_jobs target CHECK constraint
-- ============================================================
-- SQLite does not support ALTER TABLE ... DROP CONSTRAINT,
-- so we recreate the table with the expanded CHECK.

CREATE TABLE IF NOT EXISTS import_jobs_new (
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

INSERT INTO import_jobs_new SELECT * FROM import_jobs;
DROP TABLE import_jobs;
ALTER TABLE import_jobs_new RENAME TO import_jobs;
