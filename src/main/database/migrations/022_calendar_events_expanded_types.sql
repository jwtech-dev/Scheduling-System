-- ============================================================
-- 022: Expand calendar_events event_type CHECK constraint
-- ============================================================
-- Adds new event types: EXAMINATION, SCHOOL_EVENT, SPECIAL_EVENT,
-- CLASS, ENROLLMENT. Preserves all existing types.
-- Existing data is unchanged — only the constraint is widened.

PRAGMA foreign_keys = OFF;

-- Rebuild calendar_events with expanded CHECK constraint
CREATE TABLE IF NOT EXISTS _calendar_events_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'HOLIDAY', 'EXAM_PERIOD', 'EXAMINATION', 'BREAK',
    'INSTITUTIONAL_EVENT', 'SCHOOL_EVENT', 'SPECIAL_EVENT',
    'CLASS', 'ENROLLMENT', 'CUSTOM'
  )),
  is_blocking INTEGER NOT NULL DEFAULT 0,
  is_all_day INTEGER NOT NULL DEFAULT 0,
  start_datetime TEXT NOT NULL,
  end_datetime TEXT NOT NULL,
  description TEXT,
  academic_year_id TEXT,
  semester_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  archived_at TEXT DEFAULT NULL,
  archived_by TEXT DEFAULT NULL,
  exam_type TEXT DEFAULT NULL,
  department TEXT CHECK (department IN ('SHS', 'COLLEGE')),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
);

-- Copy all existing data
INSERT INTO _calendar_events_new (
  id, title, event_type, is_blocking, is_all_day,
  start_datetime, end_datetime, description,
  academic_year_id, semester_id, is_active,
  created_at, updated_at, archived_at, archived_by,
  exam_type, department
)
SELECT
  id, title, event_type, is_blocking, is_all_day,
  start_datetime, end_datetime, description,
  academic_year_id, semester_id, is_active,
  created_at, updated_at, archived_at, archived_by,
  exam_type, department
FROM calendar_events;

-- Swap tables
DROP TABLE calendar_events;
ALTER TABLE _calendar_events_new RENAME TO calendar_events;

-- Re-create all indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON calendar_events(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_blocking ON calendar_events(is_blocking, is_active);
CREATE INDEX IF NOT EXISTS idx_calendar_events_archived ON calendar_events(archived_at);

PRAGMA foreign_keys = ON;
