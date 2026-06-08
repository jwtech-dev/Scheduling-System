-- ============================================================
-- 003_semester_status.sql — Semester Draft/Published lifecycle
-- ============================================================
-- Adds a status column to semesters table.
-- Existing semesters default to 'PUBLISHED' for backward compat.

ALTER TABLE semesters ADD COLUMN status TEXT NOT NULL DEFAULT 'PUBLISHED'
  CHECK (status IN ('DRAFT', 'PUBLISHED'));
