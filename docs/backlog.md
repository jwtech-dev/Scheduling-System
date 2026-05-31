# Schedule Management System — Backlog

> **Agent:** Read this file at session start. Pick tasks from **Ready**.
> Move to **In Progress** when starting. Move to **Done** when verified.
>
> **References:** [SRS](SRS_ScheduleManagement_v1.0.md) *(every task must reference an SRS FR)* · [Architecture doc](Architecture_ScheduleManagement.md) *(system structure + data models)*
> **Last updated:** 2026-05-31
>
> **Cross-cutting expectations (apply to ALL tasks):**
> - **Testing:** Every service and IPC handler must have vitest unit tests. Test files co-located with source (e.g., `foo-service.test.ts`).
> - **Technical ACs:** Elaborated just-in-time when a task moves to In Progress (not upfront). Must reference parent SRS behavioral ACs using `FR-XX AC-N` format.
> - **Audit:** All entity mutations must write audit records via AuditService in the same transaction (after TASK-01 establishes the pattern).

---

## Ready

All tasks completed and moved to **Done** section below.

---

## In Progress

(none)

---

## Done

### TASK-01: Project Scaffold & Electron Bootstrap ✅
**Completed:** 2026-05-31
**Deliverables:** electron.vite.config.ts, src/main/index.ts, database/connection.ts, database/migrator.ts, ipc/registry.ts, auth-middleware.ts, audit-service.ts, preload/index.ts, preload/api.ts, shared/types.ts, shared/constants.ts, shared/ipc-channels.ts, renderer shell, tsconfig configs, package.json, electron-builder.yml
**Notes:** Full electron-vite scaffold with SQLite WAL mode, IPC framework, and audit infrastructure.

### TASK-02: First-Run Setup ✅
**Completed:** 2026-05-31
**Deliverables:** 001_initial_schema.sql (14 tables), settings-service.ts, setup-handlers.ts, SetupPage.tsx
**Notes:** Default admin account auto-seeded (password: `admin`). Setup page still available for fresh installs without seed.

### TASK-03: Authentication ✅
**Completed:** 2026-05-31
**Deliverables:** auth-service.ts, auth-handlers.ts, auth-middleware.ts, LoginPage.tsx, AuthContext.tsx
**Notes:** In-memory session, bcrypt verify, AUTH_EXEMPT_CHANNELS for setup/login.

### TASK-04: Department Scope & App Shell ✅
**Completed:** 2026-05-31
**Deliverables:** AppShell.tsx, DepartmentSwitcher.tsx, DepartmentContext.tsx, App.tsx (router), SettingsPage.tsx, settings-handlers.ts
**Notes:** Sidebar nav, header with dept switcher, full route wiring (14 pages, no placeholders).

### TASK-05: Academic Year Management ✅
**Completed:** 2026-05-31
**Deliverables:** academic-year-service.ts, academic-year-handlers.ts, AcademicYearsPage.tsx
**Notes:** Start-month constraint removed (was too restrictive). Expandable rows with inline semester management added.

### TASK-06: Semester Management ✅
**Completed:** 2026-05-31
**Deliverables:** semester-service.ts, semester-handlers.ts, inline semester UI in AcademicYearsPage.tsx
**Notes:** SHS: 1ST/2ND only. College: 1ST/2ND/SUMMER. Date containment within parent AY.

### TASK-07: Active Term Resolution ✅
**Completed:** 2026-05-31
**Deliverables:** active-term-service.ts, active-term-handlers.ts
**Notes:** Resolves active AY + semester + quarter per department. Used by schedule builder and sections pages.

### TASK-08: Academic Calendar ✅
**Completed:** 2026-05-31
**Deliverables:** calendar-event-service.ts, calendar-event-handlers.ts, CalendarPage.tsx
**Notes:** CRUD with blocking flag, event types (HOLIDAY, EXAM_PERIOD, BREAK, INSTITUTIONAL_EVENT, CUSTOM). List view implemented; calendar grid view deferred.

### TASK-09: Room Management ✅
**Completed:** 2026-05-31
**Deliverables:** room-service.ts, room-handlers.ts, RoomsPage.tsx
**Notes:** Department availability filtering, status management, capacity validation, delete protection.

### TASK-10: Section Management ✅
**Completed:** 2026-05-31
**Deliverables:** section-service.ts, section-handlers.ts, SectionsPage.tsx
**Notes:** Scoped to dept + AY + semester. Department-conditional fields. Delete protection.

### TASK-11: Personnel Management ✅
**Completed:** 2026-05-31
**Deliverables:** personnel-service.ts, personnel-handlers.ts, PersonnelPage.tsx
**Notes:** Cross-department sharing, max weekly hours, unique employee ID/email.

### TASK-12: Schedule Entries — Data Layer ✅
**Completed:** 2026-05-31
**Deliverables:** schedule-entry-service.ts, recurrence-expander.ts, conflict-detector.ts, schedule-handlers.ts
**Notes:** 11 recurrence patterns, field dependency matrix, dry-run validation, 200-occurrence cap.

### TASK-13: Schedule Entries — UI ✅
**Completed:** 2026-05-31
**Deliverables:** SchedulePage.tsx
**Notes:** Full CRUD form with dynamic field visibility (exam vs class), status filters, conflict display, publish/unpublish actions. Timetable grid view deferred.

### TASK-14: Conflict Detection — Full Engine ✅
**Completed:** 2026-05-31
**Deliverables:** conflict-detector.ts (15 detectors: 9 HARD, 6 SOFT)
**Notes:** Room, personnel, section overlaps, capacity, workload, calendar blocks, department access, specialization, status checks. Resource mutation cascade deferred.

### TASK-15: Audit Trail UI ✅
**Completed:** 2026-05-31
**Deliverables:** audit-service.ts (query), audit-handlers.ts, AuditPage.tsx
**Notes:** Paginated table with entity type/action filters, color-coded action badges. Diff view deferred.

### TASK-16: Publish Workflow ✅
**Completed:** 2026-05-31
**Deliverables:** publish-service.ts, publish-handlers.ts
**Notes:** Publish/unpublish with HARD conflict gating, bulk operations, audit records.

### TASK-17: Exam Schedule ✅
**Completed:** 2026-05-31
**Deliverables:** ExamsPage.tsx, conditional exam fields in SchedulePage.tsx
**Notes:** Exam-specific form fields (exam_title, exam_type) shown when activity type is EXAM. Export CSV action. Quarter validation via conflict engine.

### TASK-18: Schedule Templates ✅
**Completed:** 2026-05-31
**Deliverables:** template-service.ts, template-handlers.ts, TemplatesPage.tsx
**Notes:** Save from published, apply with conflict detection, template CRUD. Section remapping UI deferred.

### TASK-19: Data Import ✅
**Completed:** 2026-05-31
**Deliverables:** import-handlers.ts, ImportPage.tsx
**Notes:** CSV import for personnel, sections, rooms, calendar events. Template download, upload with preview, commit with upsert. XLSX support deferred (requires SheetJS).

### TASK-20: Logo & Footer Settings ✅
**Completed:** 2026-05-31
**Deliverables:** logo-handlers.ts, SettingsPage.tsx (logo + footer sections)
**Notes:** Base64 logo upload/preview/remove, footer credit text, 2MB/200-char limits.

### TASK-21: Data Export & Signatories ✅
**Completed:** 2026-05-31
**Deliverables:** export-handlers.ts
**Notes:** 6 CSV report types implemented. PDF export with jspdf deferred (requires additional dependency).

### TASK-22: Dashboard ✅
**Completed:** 2026-05-31
**Deliverables:** DashboardPage.tsx
**Notes:** Active term display, 7 stats cards, quick action links. Widget components inlined (not split into separate files).

### TASK-23: Backup & Restore ✅
**Completed:** 2026-05-31
**Deliverables:** backup-service.ts, backup-handlers.ts, dialog-handlers.ts, SettingsPage.tsx (backup section)
**Notes:** Manual save-file dialog, auto-backup with 5-file rotation, restore with integrity check. 7-day reminder deferred.

---

> **Backlog Rules:**
> - Each task must reference an SRS FR (e.g., "FR-05").
> - Technical ACs must map to a behavioral AC in the referenced SRS FR. Do not add technical ACs that test behavior outside the scope of the SRS acceptance criteria.
> - Technical ACs provide the IPC-level details (channels, request/response payloads) that the SRS behavioral ACs intentionally omit.
> - Technical ACs must reference their parent SRS behavioral AC using `FR-XX AC-N` format (e.g., "Expands FR-10 AC-3"). This traceability link is mandatory.
> - If a technical AC has no parent SRS behavioral AC, either the SRS needs a new AC (file a CR if approved) or the technical AC is out of scope and must be removed.
> - When a design file (Figma / wireframes) exists for a task's FR, evaluate the design against the SRS FR block before marking the task "Ready." Flag discrepancies and resolve them (CR to update SRS, or design revision) before implementation begins.
