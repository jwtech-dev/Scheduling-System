# Architecture Decision Record

| Field    | Value                                        |
|----------|----------------------------------------------|
| ADR      | ADR-004                                      |
| Title    | All Business Logic in Main Process with IPC-Only Communication |
| Date     | 2026-05-27                                   |
| Status   | Accepted                                     |
| Deciders | Developer (Tech Lead)                        |
| Version  | 1.0                                          |
| References | VibeLock System Guide · [Architecture doc](../Architecture_ScheduleManagement.md) |
| Supersedes | —                                          |
| Superseded By | —                                      |

---

## Context

Electron applications have two process types:

1. **Main process** (Node.js) — Full access to the filesystem, native modules, and system APIs
2. **Renderer process** (Chromium) — Displays the UI, runs in a sandboxed browser context

Business logic (validation, conflict detection, audit logging, database mutations) must live in one or both of these processes. The choice directly impacts security, data integrity, testability, and architectural complexity.

The Schedule Management System has strict requirements:
- All database mutations must be audited in the same transaction (FR-12.8, NFR-R-001)
- Conflict detection must evaluate against the full dataset (FR-10, all 15 detectors)
- Security: the renderer must not have direct Node.js or filesystem access (NFR-S-002, NFR-S-003)
- Single writer: no concurrent database access conflicts

---

## Decision

We will place **all business logic, validation, and database access in the Electron main process**. The renderer process is a display-only layer that communicates with the main process exclusively through IPC (Inter-Process Communication) via Electron's `contextBridge`.

Architecture:
```
Renderer (React)
  → contextBridge.exposeInMainWorld('electronAPI', { ... })
    → ipcRenderer.invoke(channel, args)
      → Main Process IPC Handler
        → Service Layer (validation, business rules)
          → Repository Layer (parameterized SQL)
            → SQLite (better-sqlite3)
```

Security configuration:
- `contextIsolation: true` — Renderer cannot access Node.js globals
- `nodeIntegration: false` — No `require()` in renderer
- `sandbox: true` — Renderer runs in Chromium sandbox
- Channel whitelisting — Only explicitly exposed IPC channels are callable from renderer

All IPC responses use a standard envelope: `{ data: T | null, error: { code, message, details? } | null }`.

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| All logic in main process via IPC (chosen) | Strong security boundary, single writer (no race conditions), transactional integrity (audit + mutation in same TX), testable services (pure Node.js), clear separation of concerns | All mutations require IPC roundtrip (~1–5ms overhead), main process event loop blocked by synchronous DB calls (mitigated by fast queries) |
| Business logic in renderer with direct DB access | No IPC overhead, simpler call stack | **Security violation:** requires `nodeIntegration: true` or exposing `require('better-sqlite3')` to renderer. Breaks contextIsolation. No sandbox protection. Violates NFR-S-002, NFR-S-003. |
| Shared logic layer (isomorphic modules) | Logic reuse between processes, validation in renderer for immediate feedback | Dual-process state sync complexity, potential DB write conflicts, transaction coupling between processes impossible, testing complexity |
| Web Worker in renderer for computation | Offloads heavy computation from renderer thread | Workers can't access Node.js modules or SQLite. Still need IPC for DB access. Adds complexity for minimal benefit. |

---

## Consequences

### Positive

- **Security:** Renderer has zero access to the filesystem, database, or Node.js APIs. All access goes through explicitly whitelisted IPC channels.
- **Data integrity:** All mutations go through a single code path (Service → Repository → SQLite), making audit logging and transactional coupling reliable.
- **Testability:** Main process services are pure Node.js modules — testable with standard test frameworks without Electron or browser mocking.
- **Single writer:** No concurrent database access. better-sqlite3's synchronous API means each mutation is a blocking, atomic operation.
- **Error containment:** Raw errors are sanitized in the IPC layer (NFR-S-007) before reaching the renderer.

### Negative

- **IPC overhead:** Every user action requires an IPC roundtrip (~1–5ms). For interactive operations, this is imperceptible. For bulk operations (publish 80 entries), the overhead is cumulative but still within NFR-P targets.
- **No client-side validation:** The renderer cannot validate form data without an IPC call. Mitigated by: dry-run validation endpoint (FR-09.21–09.22) and optimistic UI patterns for simple field validation.
- **Main process bottleneck:** All computation runs on the main process event loop. Synchronous DB calls block other IPC handling. Mitigated by: fast queries on SSD (< 100ms p95 per NFR-P-002), small dataset, and batch size limits.

### Risks

- **Main process freeze on heavy computation:** Conflict detection for 200 recurring entries × 15 detectors could block the main process for > 300ms. Mitigation: early termination on first HARD conflict (audit SQ-10), max 200 occurrences limit (NFR-P-008), and indexed queries.
- **IPC channel explosion:** Many channels could make the API surface hard to maintain. Mitigation: organized by domain (auth:*, academic:*, schedule:*, etc.) with a centralized registry (ipc-registry.ts).

---

## External References

- [Electron Security Recommendations](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Electron IPC Documentation](https://www.electronjs.org/docs/latest/tutorial/ipc)
- SRS Appendix A: IPC Contract Reference
- SRS NFR-S-001 through NFR-S-007 (Security requirements)
- SRS NFR-P-001 through NFR-P-007 (Performance requirements)
- ADR-001: Use Electron (establishes the two-process model)
- ADR-002: Use SQLite + better-sqlite3 (synchronous DB driver)

---

**ADR Rules**

- One decision per ADR. If a decision involves multiple independent choices, create separate records.
- ADRs are immutable once accepted. To change a decision, create a new ADR that supersedes the original. Update the original's Status to "Superseded", fill its "Superseded By" field, and fill the new ADR's "Supersedes" field. Both references must point to each other.
- Store all ADRs in `docs/` within the project repository, numbered sequentially.
- Keep each ADR to ≤500 words in the Decision + Rationale sections combined. ADRs are decision records, not design documents. Move detailed analysis to appendices or linked documents.
- **Bidirectional link enforcement:** Every accepted ADR must be linked from the Architecture doc's Tech Stack table or Resolved Design Questions table. When creating a new ADR, also update the Architecture doc to reference it. An accepted ADR with no Architecture doc link is a compliance gap.
