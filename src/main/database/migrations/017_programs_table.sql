-- ============================================================
-- 017: Programs Table
-- ============================================================
-- Stores curriculum/program definitions (e.g. BSIT, STEM).
-- Programs must be created before subjects can reference them.

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  department TEXT NOT NULL CHECK(department IN ('SHS','COLLEGE')),
  is_active INTEGER NOT NULL DEFAULT 1,
  archived_at TEXT,
  archived_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Unique program name per department (only among active/non-archived)
CREATE UNIQUE INDEX IF NOT EXISTS idx_programs_name_dept
  ON programs(name, department) WHERE archived_at IS NULL;

-- Auto-populate from existing subject_bank data
INSERT OR IGNORE INTO programs (id, name, department, created_at, updated_at)
SELECT
  lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))),
  course_program,
  department,
  datetime('now'),
  datetime('now')
FROM subject_bank
WHERE is_active = 1 AND archived_at IS NULL AND course_program IS NOT NULL AND course_program != ''
GROUP BY course_program, department;

-- Auto-populate from existing sections data (picks up programs not in subject_bank)
INSERT OR IGNORE INTO programs (id, name, department, created_at, updated_at)
SELECT
  lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))),
  course_program,
  department,
  datetime('now'),
  datetime('now')
FROM sections
WHERE is_active = 1 AND archived_at IS NULL AND course_program IS NOT NULL AND course_program != ''
GROUP BY course_program, department
HAVING course_program NOT IN (SELECT name FROM programs WHERE department = sections.department);

-- Also pick up SHS strand_track values as programs
INSERT OR IGNORE INTO programs (id, name, department, created_at, updated_at)
SELECT
  lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))),
  strand_track,
  department,
  datetime('now'),
  datetime('now')
FROM sections
WHERE is_active = 1 AND archived_at IS NULL AND strand_track IS NOT NULL AND strand_track != '' AND department = 'SHS'
GROUP BY strand_track, department
HAVING strand_track NOT IN (SELECT name FROM programs WHERE department = sections.department);
