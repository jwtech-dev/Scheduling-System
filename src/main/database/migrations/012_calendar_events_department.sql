-- ============================================================
-- Migration 012: Add department column to calendar_events
-- ============================================================
-- Calendar events need department isolation so SHS and College
-- see only their own events. NULL department = visible to both.
-- ============================================================

ALTER TABLE calendar_events ADD COLUMN department TEXT CHECK (department IN ('SHS', 'COLLEGE'));

-- Backfill: derive department from linked semester
UPDATE calendar_events
SET department = (
  SELECT s.department FROM semesters s WHERE s.id = calendar_events.semester_id
)
WHERE semester_id IS NOT NULL
  AND department IS NULL;
