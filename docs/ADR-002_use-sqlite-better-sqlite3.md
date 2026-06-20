# Architecture Decision Record

| Field    | Value                                        |
|----------|----------------------------------------------|
| ADR      | ADR-002                                      |
| Title    | Use SQLite with better-sqlite3 (Synchronous Driver) |
| Date     | 2026-05-27                                   |
| Status   | Accepted                                     |
| Deciders | Developer (Tech Lead)                        |
| Version  | 1.0                                          |
| References | VibeLock System Guide · [Architecture doc](../Architecture_ScheduleManagement.md) |
| Supersedes | —                                          |
| Superseded By | —                                      |

---

## Context

The Schedule Management System requires persistent data storage for schedule entries, academic terms, personnel, rooms, sections, audit logs, and configuration. Key storage requirements:

- **Fully offline:** No network-dependent databases (no PostgreSQL, MySQL, cloud DBs)
- **Single-file persistence:** Data must be portable via file copy for backup/restore (FR-19)
- **Single-user, single-writer:** Only one admin user, no concurrent write conflicts
- **Transactional integrity:** Audit logs must be written in the same transaction as mutations (FR-12.8, NFR-R-001)
- **Backup API:** The database must support programmatic backup without stopping the application (FR-19.1–19.4)
- **Moderate data volume:** Expected < 10,000 schedule entries, < 1,000 personnel/rooms/sections

The Electron main process (Node.js) will be the sole database accessor. The renderer process never touches the database directly (see ADR-004).

---

## Decision

We will use **SQLite** as the database engine with **better-sqlite3** as the Node.js driver.

SQLite is chosen because it is the standard embedded database — single-file, zero-configuration, ACID-compliant, and perfectly suited for a single-user desktop application. `better-sqlite3` is chosen over other SQLite bindings because it provides a **synchronous API**, which eliminates callback/promise complexity in the main process and enables straightforward transaction blocks.

Database configuration:
- `journal_mode = WAL` — Write-Ahead Logging for safe concurrent reads during backup
- `foreign_keys = ON` — Enforce referential integrity at the database level
- `busy_timeout = 5000` — Wait up to 5s for locks (safety margin)
- `synchronous = NORMAL` — Balance between durability and performance with WAL mode
- `cache_size = -64000` — 64MB page cache for responsive queries

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| better-sqlite3 (chosen) | Synchronous API simplifies transaction logic, native C++ binding for performance, built-in Backup API (`database.backup()`), actively maintained, WAL mode support | Native module requires `electron-rebuild`, synchronous calls block the event loop (mitigated by fast queries on SSD) |
| sql.js (WASM-compiled SQLite) | No native module — pure JavaScript, no `electron-rebuild` needed | Async-only API, no native Backup API, entire DB loaded into memory (problematic for large DBs), slower than native binding |
| Sequelize / knex (ORMs) | Familiar ORM patterns, migration tools built-in | Async-only, ORM overhead for simple queries, abstracts away SQLite-specific features (PRAGMAs, Backup API), unnecessary complexity for a single-DB app |
| IndexedDB (browser) | Built into Chromium, no native module | Renderer-only (violates ADR-004 architecture), no SQL, limited query capabilities, no file-based backup |
| LevelDB / RocksDB | Embedded, key-value store | No SQL, no relational model, poor fit for structured scheduling data with complex queries |

---

## Consequences

### Positive

- **Synchronous transactions** — `db.transaction(() => { ... })()` makes multi-step mutations (create entry + audit log) simple and atomic
- **Native Backup API** — `database.backup(targetPath)` enables safe hot backups without stopping the app (FR-19)
- **Zero configuration** — No database server to install, configure, or maintain
- **Single-file portability** — Database backup/restore is a file copy operation
- **SQL power** — Complex queries for conflict detection, pagination, filtering, and reporting

### Negative

- **Synchronous event loop blocking** — Long-running queries block the Electron main process. Mitigated by: fast queries on local SSD, small dataset (< 10K entries), indexed columns, and batch size limits (max 200 recurrence expansions per NFR-P-008)
- **Native module rebuild** — `better-sqlite3` requires `electron-rebuild` after each Electron version update. Mitigated by: running in `postinstall` script, pinning Electron version.
- **No concurrent writers** — Only one process can write at a time. Not a limitation for single-user app.

### Risks

- **`electron-rebuild` failure on target machines:** The build machine must have compatible C++ build tools. Mitigation: pre-build native modules and bundle in the `.exe` installer via `electron-builder`.
- **Data corruption on power loss:** WAL mode + `synchronous = NORMAL` has a theoretical risk of losing the last transaction on sudden power loss. Mitigation: auto-backup on close (FR-19.17–19.21) + 7-day backup reminder (FR-19.14–19.16).

---

## External References

- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [SQLite WAL Mode](https://www.sqlite.org/wal.html)
- SRS Appendix B: Data Dictionary (14 tables)
- SRS FR-19: Backup & Restore
- SRS NFR-D-001 through NFR-D-004 (Data integrity requirements)
- SRS NFR-R-001, NFR-R-004, NFR-R-005 (Reliability requirements)

---

**ADR Rules**

- One decision per ADR. If a decision involves multiple independent choices, create separate records.
- ADRs are immutable once accepted. To change a decision, create a new ADR that supersedes the original. Update the original's Status to "Superseded", fill its "Superseded By" field, and fill the new ADR's "Supersedes" field. Both references must point to each other.
- Store all ADRs in `docs/` within the project repository, numbered sequentially.
- Keep each ADR to ≤500 words in the Decision + Rationale sections combined. ADRs are decision records, not design documents. Move detailed analysis to appendices or linked documents.
- **Bidirectional link enforcement:** Every accepted ADR must be linked from the Architecture doc's Tech Stack table or Resolved Design Questions table. When creating a new ADR, also update the Architecture doc to reference it. An accepted ADR with no Architecture doc link is a compliance gap.
