# Architecture Decision Record

| Field    | Value                                        |
|----------|----------------------------------------------|
| ADR      | ADR-001                                      |
| Title    | Use Electron as the Desktop Application Framework |
| Date     | 2026-05-27                                   |
| Status   | Accepted                                     |
| Deciders | Developer (Tech Lead)                        |
| Version  | 1.0                                          |
| References | VibeLock System Guide · [Architecture doc](../Architecture_ScheduleManagement.md) |
| Supersedes | —                                          |
| Superseded By | —                                      |

---

## Context

The Schedule Management System is a standalone offline desktop application for a Philippine academic institution. It must:

- Run entirely offline on Windows machines with no internet connection
- Access a local SQLite database for all data persistence
- Provide a modern, responsive UI for complex scheduling workflows (forms, grids, calendars)
- Be distributed as a `.exe` installer for direct installation on institutional machines
- Operate as a single-instance application with one admin user

The application needs both a rich browser-based UI rendering engine and Node.js access for native filesystem operations, SQLite integration, and system-level features (single-instance lock, file dialogs, backup APIs).

---

## Decision

We will use **Electron** as the desktop application framework. Electron combines Chromium (for rendering the React UI) with Node.js (for main-process business logic and SQLite access), enabling a web-technology stack for a native desktop application.

The main process handles all business logic, database access, and system operations. The renderer process (Chromium) displays the React UI. Communication between the two uses Electron's IPC mechanism with `contextIsolation: true` and `sandbox: true` for security (see ADR-004 for the IPC architecture decision).

Packaging and distribution will use `electron-builder` to produce a Windows `.exe` installer.

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| Electron (chosen) | Mature ecosystem, large community, excellent tooling (electron-builder, electron-rebuild), proven contextIsolation security model, native Node.js integration for SQLite | Larger bundle size (~150MB), Chromium memory overhead (~100–200MB RAM), requires `electron-rebuild` for native modules |
| Tauri | Smaller bundle size (~10MB), lower memory footprint, Rust backend for performance | Rust backend unfamiliar to team, smaller ecosystem, less mature for complex desktop apps, native SQLite integration requires Rust bindings |
| NW.js | Similar web-tech stack to Electron, slightly more permissive Node.js access | Weaker security model (no contextIsolation equivalent), smaller community, less mature tooling for packaging |
| Native Win32 / .NET WPF | Native performance, small footprint, tight Windows integration | No web technology reuse, higher UI complexity for forms/grids/calendars, C#/.NET learning curve, no cross-platform option if needed later |

---

## Consequences

### Positive

- Web technologies (React, Tailwind CSS) can be used for the UI, enabling rapid development of complex forms and schedule grids
- `electron-builder` provides proven Windows `.exe` packaging with auto-update support (not needed now but available)
- `contextIsolation` + `sandbox` enforce a strong security boundary between renderer and main process
- Large community means well-documented solutions for common problems (native module rebuilds, file dialogs, single-instance lock)

### Negative

- Bundle size is ~150MB due to Chromium — acceptable for a desktop install but larger than native alternatives
- Memory usage is higher (~100–200MB baseline) — acceptable for a single-user desktop app on modern hardware
- Native modules (better-sqlite3) require `electron-rebuild` in the build pipeline, adding a build step

### Risks

- **Native module rebuild failure:** `better-sqlite3` must be rebuilt for Electron's Node.js ABI version. Mitigation: run `electron-rebuild` in `postinstall` script and verify in Phase 1 of implementation.
- **Chromium security vulnerabilities:** Electron bundles a specific Chromium version. Mitigation: keep Electron updated; this is a local-only app with no network access, reducing the attack surface.

---

## External References

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Documentation](https://www.electron.build/)
- SRS NFR-K-001, NFR-K-002, NFR-K-003 (Installation and deployment requirements)
- SRS NFR-S-002, NFR-S-003 (Security: contextIsolation, nodeIntegration, sandbox)

---

**ADR Rules**

- One decision per ADR. If a decision involves multiple independent choices, create separate records.
- ADRs are immutable once accepted. To change a decision, create a new ADR that supersedes the original. Update the original's Status to "Superseded", fill its "Superseded By" field, and fill the new ADR's "Supersedes" field. Both references must point to each other.
- Store all ADRs in `docs/` within the project repository, numbered sequentially.
- Keep each ADR to ≤500 words in the Decision + Rationale sections combined. ADRs are decision records, not design documents. Move detailed analysis to appendices or linked documents.
- **Bidirectional link enforcement:** Every accepted ADR must be linked from the Architecture doc's Tech Stack table or Resolved Design Questions table. When creating a new ADR, also update the Architecture doc to reference it. An accepted ADR with no Architecture doc link is a compliance gap.
