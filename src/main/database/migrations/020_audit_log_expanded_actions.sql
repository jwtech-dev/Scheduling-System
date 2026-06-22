-- ============================================================
-- 020: Expand audit_log action CHECK constraint
-- ============================================================
-- The RESTORE and PERMANENT_DELETE actions were used in services
-- but not included in the original CHECK constraint. This migration
-- rebuilds the audit_log table with the expanded constraint.

-- Must disable FK to rebuild table
PRAGMA foreign_keys = OFF;

-- Create new table with expanded constraint
CREATE TABLE IF NOT EXISTS _audit_log_new (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  department TEXT,
  action TEXT NOT NULL CHECK (action IN (
    'CREATE', 'UPDATE', 'DELETE', 'OVERRIDE',
    'PUBLISH', 'UNPUBLISH', 'RESTORE', 'PERMANENT_DELETE'
  )),
  before_snapshot TEXT,
  after_snapshot TEXT,
  conflict_snapshot TEXT,
  override_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Copy existing data
INSERT INTO _audit_log_new SELECT * FROM audit_log;

-- Swap tables
DROP TABLE audit_log;
ALTER TABLE _audit_log_new RENAME TO audit_log;

-- Re-create indexes
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_dept ON audit_log(department);

-- Re-create append-only triggers
CREATE TRIGGER IF NOT EXISTS audit_log_no_update
BEFORE UPDATE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'Audit log records cannot be modified');
END;

CREATE TRIGGER IF NOT EXISTS audit_log_no_delete
BEFORE DELETE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'Audit log records cannot be deleted');
END;

PRAGMA foreign_keys = ON;
