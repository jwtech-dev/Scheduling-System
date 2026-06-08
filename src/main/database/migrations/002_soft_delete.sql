-- ============================================================
-- Migration 002: Soft Delete System
-- ============================================================
-- Adds archived_at and archived_by columns to all entity tables
-- for the 3-layer delete protection system.

-- Academic Years
ALTER TABLE academic_years ADD COLUMN archived_at TEXT DEFAULT NULL;
ALTER TABLE academic_years ADD COLUMN archived_by TEXT DEFAULT NULL;

-- Semesters
ALTER TABLE semesters ADD COLUMN archived_at TEXT DEFAULT NULL;
ALTER TABLE semesters ADD COLUMN archived_by TEXT DEFAULT NULL;

-- Personnel
ALTER TABLE personnel ADD COLUMN archived_at TEXT DEFAULT NULL;
ALTER TABLE personnel ADD COLUMN archived_by TEXT DEFAULT NULL;

-- Rooms
ALTER TABLE rooms ADD COLUMN archived_at TEXT DEFAULT NULL;
ALTER TABLE rooms ADD COLUMN archived_by TEXT DEFAULT NULL;

-- Sections
ALTER TABLE sections ADD COLUMN archived_at TEXT DEFAULT NULL;
ALTER TABLE sections ADD COLUMN archived_by TEXT DEFAULT NULL;

-- Schedule Entries
ALTER TABLE schedule_entries ADD COLUMN archived_at TEXT DEFAULT NULL;
ALTER TABLE schedule_entries ADD COLUMN archived_by TEXT DEFAULT NULL;

-- Calendar Events
ALTER TABLE calendar_events ADD COLUMN archived_at TEXT DEFAULT NULL;
ALTER TABLE calendar_events ADD COLUMN archived_by TEXT DEFAULT NULL;

-- Indexes for efficient filtering on archived status
CREATE INDEX IF NOT EXISTS idx_academic_years_archived ON academic_years(archived_at);
CREATE INDEX IF NOT EXISTS idx_semesters_archived ON semesters(archived_at);
CREATE INDEX IF NOT EXISTS idx_personnel_archived ON personnel(archived_at);
CREATE INDEX IF NOT EXISTS idx_rooms_archived ON rooms(archived_at);
CREATE INDEX IF NOT EXISTS idx_sections_archived ON sections(archived_at);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_archived ON schedule_entries(archived_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_archived ON calendar_events(archived_at);

-- Trash settings table
CREATE TABLE IF NOT EXISTS trash_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  retention_days INTEGER NOT NULL DEFAULT 90,
  auto_purge_enabled INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO trash_settings (id, retention_days, auto_purge_enabled) VALUES (1, 90, 1);
