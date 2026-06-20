# Schedule Management System — Project Rules

> **Stack:** Electron + React + Tailwind CSS + SQLite (better-sqlite3)
> **Last Reviewed:** 2026-05-27
> **Version:** 1.0
> **References:** VibeLock System Guide

---

## Documentation

All project specifications live in `docs/specs/`:

| Document | Path | Purpose |
|----------|------|---------| 
| PRD | `docs/specs/PRD_ScheduleManagement.md` | Product vision, roadmap, and constraints |
| SRS | `docs/specs/SRS_ScheduleManagement_v1.0.md` | What this version builds (source of truth) |
| Architecture | `docs/specs/Architecture_ScheduleManagement.md` | How the system is built (stack, domain model, services) |
| ADRs | `docs/specs/adr/ADR-[NNN]_[title].md` | Why technical decisions were made |
| CRs | `docs/specs/change-requests/CR-[NNN]_[title].md` | Formal changes to the approved SRS |
| Backlog | `docs/backlog.md` | Task queue with SRS references |
| Legal Documents | `docs/legal/` | N/A — offline desktop app, no external users |
| Launch Readiness | N/A | N/A — direct install to institution, no staged launch |
| Compliance Checklist | `docs/specs/Documentation_Compliance_Checklist.md` | Gateway for Approved status |

**Rules:**
- The SRS is the single source of truth for what to build. If it's not in the SRS, it doesn't get built.
- SRS must be updated before implementation begins after a CR is approved.
- Architecture doc is the reference for how the system is structured.
- ADRs are immutable once accepted. Supersede with a new ADR, never edit.

**Document Dependency Matrix** — when a source document changes, check downstream docs for staleness:

| When This Changes | Check These Downstream |
|---|---|
| SRS (`SRS_ScheduleManagement_v1.0.md`) | Architecture, Backlog, QA Test Plan |
| Architecture (`Architecture_ScheduleManagement.md`) | ADRs (verify no contradiction) |
| PRD (`PRD_ScheduleManagement.md`) | SRS |

---

## Environment

| Property | Value |
|---|---|
| OS | Windows (target platform) |
| Runtime | Electron (Chromium + Node.js) |
| Package manager | npm |
| Database | SQLite via better-sqlite3 (synchronous, no ORM) |
| Deployment | Local installer (.exe via electron-builder) |

---

## Project Structure

```
docs/
  specs/                    # SRS, PRD, Architecture, ADRs, CRs, Checklist
    adr/                    # Architecture Decision Records
    change-requests/        # Change Requests
  backlog.md                # Task queue
  legal/                    # Legal docs (N/A for this project)
src/                        # Application source (to be created)
  main/                     # Electron main process (business logic + DB)
  renderer/                 # React UI
  preload/                  # Context bridge (preload scripts)
  shared/                   # Shared types and constants
PROJECT_RULES.md            # This file
```

---

## File Ownership

#### Do NOT Edit (Generated)

| File/Dir | Reason |
|---|---|
| `node_modules/` | npm-managed dependencies |
| `dist/` | Build output from electron-builder |
| `*.db` | SQLite database — managed by application at runtime |

#### Safe to Edit

| File/Dir | Notes |
|---|---|
| `src/main/` | Main process services, IPC handlers, migrations |
| `src/renderer/` | React components, pages, hooks |
| `src/preload/` | Context bridge API definitions |
| `src/shared/` | TypeScript types, enums, constants |
| `docs/` | All documentation |

**Key shared files** (high blast radius — changes affect many modules):
- `src/preload/api.ts` — IPC contract between main and renderer
- `src/shared/types.ts` — Shared type definitions
- `src/main/database/migrations/` — Schema migrations

---

## Boundaries

#### Always

| Rule | Detail |
|---|---|
| Use parameterized queries | No string interpolation in SQL. Use better-sqlite3 prepared statements only. |
| Soft delete everywhere | Set `is_active=0`. Never permanently delete data. |
| Business logic in main process | All validation, conflict detection, and data access lives in Electron main. Renderer is display-only. |
| Audit every mutation | CREATE, UPDATE, DELETE of schedule entries must produce audit trail records per FR-12. |
| Cross-reference SRS | Every implementation must trace to an SRS FR/AC. Do not invent features. |

#### Ask First

| Action | Why |
|---|---|
| Modify database schema | Schema changes require migration scripts and may break existing data. |
| Change IPC contract | Affects both main and renderer — high blast radius. |
| Override HARD conflicts | Business impact — must provide documented reason per FR-09.8. |

#### Never

| Action | Why |
|---|---|
| Expose Node.js APIs to renderer | Security: contextIsolation=true, nodeIntegration=false, sandbox=true. |
| Use `dangerouslySetInnerHTML` | XSS risk in Electron context. |
| Use raw `ipcRenderer` | Always use `window.electronAPI` typed methods via context bridge. |
| Delete audit trail records | Audit trail is append-only per NFR-S-004. |

---

## Architecture Constraints

| Constraint | Detail |
|---|---|
| Single SQLite file | All data in `app.getPath('userData')/schedule-manager.db` |
| Synchronous DB access | better-sqlite3 is synchronous — no async/await for DB calls in main process |
| IPC-only communication | Renderer ↔ Main via Electron context bridge. No direct DB access from renderer. |
| Single-instance lock | `app.requestSingleInstanceLock()` — only one window at a time |
| bcryptjs cost factor 10 | Password hashing for admin auth. In-memory `isAuthenticated` flag — no tokens. |
| No midnight-spanning entries | Schedule entries cannot cross midnight boundary |

---

## Backlog

Active task queue: [docs/backlog.md](docs/backlog.md)

**Workflow:**
1. Tasks are listed in `docs/backlog.md` with SRS references
2. Agent reads backlog at session start → picks up assigned tasks
3. Agent creates implementation plan → user approves → agent executes
4. Agent moves completed tasks to Done in the backlog

Bugs and quick fixes are handled verbally — no backlog entry needed.

---

## Code Standards

Priorities: **readability first, maintainability second, cleverness never.**

| Area | Rule |
|---|---|
| **Naming** | `camelCase` for variables/functions, `PascalCase` for components/types/interfaces/enums, `UPPER_SNAKE_CASE` for constants. Boolean prefix: `is`, `has`, `should`, `can`. Names must communicate intent — no vague names (`data`, `info`, `temp`). |
| **Size limits** | Functions: 50 lines max, 4 params max. Files: 400 lines max. Nesting: 3 levels max (use guard clauses). |
| **Patterns** | Early returns for edge cases. `const` by default, `let` only when reassignment needed. No `var`. |
| **Comments** | Explain **why**, not **what**. No commented-out code. No stale comments. |
| **Error handling** | No empty `catch` blocks. Narrow error types. Two-tier user-facing messages: specific for expected errors, generic for unexpected system errors. No stack traces, DB errors, or internal paths in UI. |
| **Imports** | No circular dependencies. Order: external → internal → relative, alphabetized within groups. No unused imports. |
| **TypeScript** | No `any` (absolute ban). No `as any`. `strict: true` in tsconfig. `async/await` for all async code. |
| **Hardcoded values** | No magic numbers/strings in logic — use named constants. |

---

> **Rule maintenance:** When a mistake is made twice, add a rule here to prevent recurrence. Keep this file under 400 lines. No single section should exceed 25% of the 400-line budget (100 lines).
> **Pointer pattern:** When a section grows beyond ~20 lines, move detail to `docs/` and link to it. This file is for constraints, not documentation.
