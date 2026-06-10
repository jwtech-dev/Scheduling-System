-- ============================================================
-- 011_calendar_event_exam_type.sql
-- ============================================================
-- Adds exam_type column to calendar_events so EXAM_PERIOD events
-- can specify which exam type they cover (e.g. PRELIM, MIDTERM).

ALTER TABLE calendar_events ADD COLUMN exam_type TEXT DEFAULT NULL;
