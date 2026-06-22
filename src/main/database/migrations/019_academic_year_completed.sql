-- ============================================================
-- Migration 019: Academic Year Completed Status
-- ============================================================
-- Adds 'COMPLETED' to the academic_years status CHECK constraint.
-- Uses safe table-rebuild pattern (same as migration 018).
--
-- Status lifecycle: DRAFT → PUBLISHED → COMPLETED (auto-transition)

-- === 1. Create new table with updated CHECK constraint ===
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
  grade_11_term_type TEXT CHECK(grade_11_term_type IS NULL OR grade_11_term_type IN ('TWO_SEMESTER', 'TRIMESTRAL')),
  grade_12_term_type TEXT CHECK(grade_12_term_type IS NULL OR grade_12_term_type IN ('TWO_SEMESTER', 'TRIMESTRAL')),
  UNIQUE (department, label)
);

-- === 2. Copy existing data ===
INSERT INTO _academic_years_new (
  id, department, label, start_date, end_date, is_active,
  created_at, updated_at, archived_at, archived_by,
  status, grade_11_term_type, grade_12_term_type
)
SELECT
  id, department, label, start_date, end_date, is_active,
  created_at, updated_at, archived_at, archived_by,
  status, grade_11_term_type, grade_12_term_type
FROM academic_years;

-- === 3. Drop old table and rename ===
DROP TABLE academic_years;
ALTER TABLE _academic_years_new RENAME TO academic_years;

-- === 4. Recreate indexes ===
CREATE INDEX idx_academic_years_department ON academic_years(department);
CREATE INDEX idx_academic_years_active ON academic_years(department, is_active);
CREATE INDEX idx_academic_years_archived ON academic_years(archived_at);
