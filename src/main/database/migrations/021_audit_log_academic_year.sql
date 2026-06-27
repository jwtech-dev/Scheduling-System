-- ============================================================
-- 021: Add academic_year_id to audit_log for term scoping
-- ============================================================
-- Links audit records to an academic year so the audit log can
-- be filtered per term and appears empty for new academic years.
-- Existing records are backfilled to the active academic year per
-- department so they remain visible after upgrade.

PRAGMA foreign_keys = OFF;

-- Rebuild audit_log with the new column
CREATE TABLE IF NOT EXISTS _audit_log_new (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  department TEXT,
  academic_year_id TEXT,
  action TEXT NOT NULL CHECK (action IN (
    'CREATE', 'UPDATE', 'DELETE', 'OVERRIDE',
    'PUBLISH', 'UNPUBLISH', 'RESTORE', 'PERMANENT_DELETE'
  )),
  before_snapshot TEXT,
  after_snapshot TEXT,
  conflict_snapshot TEXT,
  override_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
);

-- Copy existing data (academic_year_id will be NULL for old records)
INSERT INTO _audit_log_new (id, entity_type, entity_id, department, action,
  before_snapshot, after_snapshot, conflict_snapshot, override_reason, created_at)
  SELECT id, entity_type, entity_id, department, action,
  before_snapshot, after_snapshot, conflict_snapshot, override_reason, created_at
  FROM audit_log;

-- Swap tables
DROP TABLE audit_log;
ALTER TABLE _audit_log_new RENAME TO audit_log;

-- Re-create indexes
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_dept ON audit_log(department);
CREATE INDEX IF NOT EXISTS idx_audit_ay ON audit_log(academic_year_id);

-- Backfill: assign existing records to their department's active AY
-- so pre-upgrade audit history remains visible in the new per-term view.
-- Must happen BEFORE append-only triggers are re-created.
UPDATE audit_log SET academic_year_id = (
  SELECT ay.id FROM academic_years ay
  WHERE ay.department = audit_log.department
    AND ay.is_active = 1
    AND ay.archived_at IS NULL
  LIMIT 1
) WHERE academic_year_id IS NULL AND department IS NOT NULL;

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
