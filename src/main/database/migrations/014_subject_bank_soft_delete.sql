-- ============================================================
-- Migration 014: Subject Bank Soft Delete Support
-- ============================================================

ALTER TABLE subject_bank ADD COLUMN archived_at TEXT DEFAULT NULL;
ALTER TABLE subject_bank ADD COLUMN archived_by TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_subject_bank_archived ON subject_bank(archived_at);
