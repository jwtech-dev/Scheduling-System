-- Migration 013: Add status column to academic_years
-- Mirrors the DRAFT/PUBLISHED lifecycle already present on semesters (migration 003).

ALTER TABLE academic_years ADD COLUMN status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED'));
