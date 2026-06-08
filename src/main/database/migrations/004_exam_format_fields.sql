-- ============================================================
-- 004_exam_format_fields.sql — Add exam format fields
-- ============================================================
-- Adds subject_code, lec_units, lab_units to schedule_entries
-- and honorific, credentials to personnel for institutional
-- exam schedule export format.

-- Schedule entry exam-specific display fields
ALTER TABLE schedule_entries ADD COLUMN subject_code TEXT;
ALTER TABLE schedule_entries ADD COLUMN lec_units INTEGER NOT NULL DEFAULT 0;
ALTER TABLE schedule_entries ADD COLUMN lab_units INTEGER NOT NULL DEFAULT 0;

-- Personnel name formatting fields
ALTER TABLE personnel ADD COLUMN honorific TEXT;
ALTER TABLE personnel ADD COLUMN credentials TEXT;
