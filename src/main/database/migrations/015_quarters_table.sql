-- Migration 015: Add quarters table
-- Quarters are first-class entities nested under semesters (SHS only).
-- Q1 start = parent semester start; last quarter end = parent semester end.

CREATE TABLE IF NOT EXISTS quarters (
  id           TEXT PRIMARY KEY NOT NULL,
  semester_id  TEXT NOT NULL REFERENCES semesters(id),
  department   TEXT NOT NULL CHECK(department IN ('SHS', 'COLLEGE')),
  quarter_label TEXT NOT NULL CHECK(quarter_label IN ('Q1', 'Q2', 'Q3', 'Q4')),
  start_date   TEXT NOT NULL,
  end_date     TEXT NOT NULL,
  is_active    INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'PUBLISHED')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  archived_at  TEXT,
  archived_by  TEXT
);

-- Unique: one quarter_label per semester (ignoring archived)
CREATE UNIQUE INDEX IF NOT EXISTS uq_quarters_sem_label
  ON quarters(semester_id, quarter_label)
  WHERE archived_at IS NULL;
