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

### Layer 0 — Infrastructure & Auth

---

#### TASK-01: Project Scaffold & Electron Bootstrap

**FR:** FR-17 (First-Run Setup — infrastructure subset)
**Dependencies:** None
**SRS ACs:** FR-17 AC-9, AC-10, AC-11, AC-18, AC-19

**Scope:** Replace the vanilla Vite+React scaffold with a fully configured `electron-vite` project. Establish the Electron two-process architecture (main + renderer), TypeScript build pipeline, Tailwind CSS v3, React Router v6, SQLite connection layer, IPC registration framework, and shared type definitions. Build AuditService as infrastructure (leaf service, no domain deps). No business logic yet — the goal is a working Electron shell that opens a window, connects to SQLite, and has IPC plumbing ready.

**Key Deliverables:**
- `electron.vite.config.ts` — Build config for main/preload/renderer
- `src/main/main.ts` — Electron entry: BrowserWindow, single-instance lock, PRAGMAs
- `src/main/database/connection.ts` — SQLite connection manager (WAL, FK ON, 64MB cache)
- `src/main/database/migrator.ts` — Sequential DDL script runner with version tracking
- `src/main/ipc/registry.ts` — Channel registration helper with response envelope
- `src/main/ipc/auth-middleware.ts` — Auth guard stub (check `isAuthenticated` flag)
- `src/main/services/audit-service.ts` — Append-only audit log writer
- `src/preload/preload.ts` — Context bridge with channel whitelist
- `src/preload/api.ts` — Typed `window.electronAPI` definition
- `src/shared/types.ts` — Entity types, IPC request/response shapes, enums
- `src/shared/constants.ts` — Department enum, activity types, error codes
- `src/shared/ipc-channels.ts` — Channel name constants
- `src/renderer/` — React 18 + Router v6 + Tailwind v3 shell
- `tsconfig.json` (main, renderer, preload configs)
- `package.json` — Updated deps
- `electron-builder.yml` — Windows .exe packaging config

**Verification:** `npm run dev` launches Electron window with React SPA. SQLite DB created on first run. IPC round-trip works (ping/pong test channel). TypeScript compiles without errors.

---

#### TASK-02: First-Run Setup

**FR:** FR-17
**Dependencies:** TASK-01
**SRS ACs:** FR-17 AC-1 through AC-8, AC-12 through AC-17, AC-20 (20 ACs)

**Scope:** Implement first-run detection, database schema creation, and the setup wizard. On first launch (no DB or no admin password), present a compact setup screen collecting: admin password + confirmation, SHS/College period lengths, time slot defaults. On submit, hash password with bcryptjs (cost 10), seed `app_settings` with all 9 required keys, and create the full 14-table schema via migration `001_initial_schema.sql`.

**Key Deliverables:**
- `src/main/database/migrations/001_initial_schema.sql` — All 14 tables + audit trigger + indexes
- `src/main/services/settings-service.ts` — `app_settings` CRUD, setup detection (`hasAdminPassword()`)
- `src/main/ipc/handlers/setup-handlers.ts` — `auth:check-setup`, `setup:complete`
- `src/renderer/pages/SetupPage.tsx` — Setup wizard UI
- `src/renderer/components/PasswordInput.tsx` — Reusable password field with validation

**Verification:** Fresh start (delete DB) → setup screen appears → fill form → submit → DB created with all tables → redirect to login. Existing DB with password → skip setup → show login.

---

#### TASK-03: Authentication

**FR:** FR-18
**Dependencies:** TASK-02
**SRS ACs:** FR-18 AC-1 through AC-15 (15 ACs)

**Scope:** Single-account password authentication on every launch. Login screen with bcryptjs hash verification. In-memory `isAuthenticated` flag with no expiry (persists until app closes). IPC auth middleware enforcement on all handlers except `auth:check-setup`, `auth:login`, `setup:complete`. Change password flow accessible from Settings page.

**Key Deliverables:**
- `src/main/services/auth-service.ts` — Login (bcrypt compare), change password, session state
- `src/main/ipc/handlers/auth-handlers.ts` — `auth:login`, `auth:change-password`
- `src/main/ipc/auth-middleware.ts` — Real implementation (check flag, return UNAUTHORIZED)
- `src/renderer/pages/LoginPage.tsx` — Login form with error feedback
- `src/renderer/contexts/AuthContext.tsx` — Auth state, redirect to login on UNAUTHORIZED
- `src/renderer/components/ChangePasswordForm.tsx` — Current + new password form

**Verification:** Wrong password → error message. Correct password → redirect to app. Restart app → must re-authenticate. Unauthenticated IPC call → `{ error: { code: 'UNAUTHORIZED' } }`. Change password → old password stops working.

---

### Layer 1 — App Shell

---

#### TASK-04: Department Scope & App Shell

**FR:** FR-01
**Dependencies:** TASK-03
**SRS ACs:** FR-01 AC-1 through AC-4, AC-11, AC-20 through AC-24

**Scope:** Build the application shell that frames all subsequent pages: sidebar navigation, top header with department switcher, content area. Establish the department context that controls which data is visible throughout the app. Set up React Router with all route definitions (placeholder pages). Build the Settings page for department-independent configuration (period lengths, time slots per department). Entity-specific FR-01 enforcement ACs (AC-5 through AC-10, AC-12 through AC-19) are implemented within their respective entity tasks.

**Key Deliverables:**
- `src/renderer/components/AppShell.tsx` — Sidebar + header + content layout
- `src/renderer/components/DepartmentSwitcher.tsx` — SHS/COLLEGE toggle
- `src/renderer/contexts/DepartmentContext.tsx` — Active department state
- `src/renderer/router.tsx` — All routes with placeholder pages
- `src/renderer/pages/SettingsPage.tsx` — Period length, time slot, change password sections
- `src/main/services/settings-service.ts` — Extend with get/getAll/update
- `src/main/ipc/handlers/settings-handlers.ts` — `settings:get`, `settings:get-all`, `settings:update`

**Verification:** After login → app shell renders with sidebar nav, dept switcher, and content area. Dept switcher toggles between SHS/COLLEGE. All nav links route to placeholder pages. Settings page reads/writes period lengths per department.

---

### Layer 2 — Academic Structure

---

#### TASK-05: Academic Year Management

**FR:** FR-02
**Dependencies:** TASK-04
**SRS ACs:** FR-02 AC-1 through AC-13 (13 ACs)

**Scope:** Academic Year CRUD scoped per department. Start-month validation (SHS=June, College=August), auto-derived labels (e.g., "2026–2027"), auto-calculated end dates, date overlap rejection, active-status auto-deactivation, and delete protection (can't delete AY with semesters).

**Key Deliverables:**
- `src/main/services/academic-year-service.ts` — CRUD, validation, active toggle, label derivation
- `src/main/ipc/handlers/academic-year-handlers.ts` — `academic-years:list/create/get/update/get-semesters`
- `src/renderer/pages/AcademicYearsPage.tsx` — List view with semester counts, active badge
- `src/renderer/components/AcademicYearForm.tsx` — Create/edit form with date pickers

**Verification:** Create SHS AY starting June → success. Starting Aug → validation error. Duplicate label → rejected. Activate new AY → previous auto-deactivated. Cross-dept active unaffected.

---

#### TASK-06: Semester Management

**FR:** FR-03
**Dependencies:** TASK-05
**SRS ACs:** FR-03 AC-1 through AC-13 (13 ACs)

**Scope:** Semesters subdivide Academic Years with department-specific type rules. SHS supports 1ST/2ND (no Summer); College supports 1ST/2ND/SUMMER. Date containment within parent AY. SHS semesters include Q1/Q3 end-date fields for quarter boundaries. Uniqueness per AY+type. Non-overlap validation. Active status management.

**Key Deliverables:**
- `src/main/services/semester-service.ts` — CRUD, quarter dates, type validation, date containment
- `src/main/ipc/handlers/semester-handlers.ts` — `semesters:create/update`
- `src/renderer/components/SemesterForm.tsx` — Form with conditional quarter fields (SHS only)
- `src/renderer/components/SemesterList.tsx` — List within AY detail, quarter columns for SHS

**Verification:** SHS Summer → rejected. College Summer → success. Dates outside AY → rejected. Duplicate type in same AY → rejected. SHS form shows Q1/Q3 End Date fields; College form hides them.

---

#### TASK-07: Active Term Resolution

**FR:** FR-04
**Dependencies:** TASK-06
**SRS ACs:** FR-04 AC-1 through AC-8 (8 ACs)

**Scope:** Resolve the currently active AY + Semester (+ quarter for SHS) for each department. Display the active term prominently in the app header/sidebar. Block CLASS/EXAM/OFFICE entry creation when no active semester. Allow MEETING entries with only an active AY (no semester required). Show guidance message when no active term is set.

**Key Deliverables:**
- `src/main/services/active-term-service.ts` — Resolve active AY, semester, quarter per dept
- `src/main/ipc/handlers/active-term-handlers.ts` — `active-term:get`
- `src/renderer/components/ActiveTermBadge.tsx` — Active term display in header
- `src/renderer/contexts/ActiveTermContext.tsx` — Active term state for entry creation guards

**Verification:** Set active AY + semester for SHS → badge shows term + quarter. No active AY → badge shows "No active term" guidance. Attempt CLASS creation without active semester → blocked with message.

---

### Layer 3 — Calendar & Resources

> **Note:** Tasks 08–11 build entity CRUD with audit integration. Conflict cascade behavior (re-evaluating DRAFT entries when resources change) is deferred to TASK-14 since the ConflictEngine and schedule entries don't exist yet. Entity-specific FR-01 enforcement ACs are implemented within each entity's task.

---

#### TASK-08: Academic Calendar

**FR:** FR-05
**Dependencies:** TASK-06
**SRS ACs:** FR-05 AC-1 through AC-18 (18 ACs — conflict cascade ACs AC-3, AC-7, AC-15, AC-16 wired in TASK-14)

**Scope:** Institution-wide calendar for holidays, exam periods, breaks, and events. NOT department-scoped (visible to both). Dual view: calendar (month grid) and sortable list. Event types: HOLIDAY, EXAM_PERIOD, BREAK, INSTITUTIONAL_EVENT, CUSTOM. Blocking flag controls whether events create conflicts. All-day events hide time pickers. EXAM_PERIOD events define exam windows (used by FR-13 for exam period mismatch detection).

**Key Deliverables:**
- `src/main/services/calendar-event-service.ts` — CRUD, blocking flag, duplicate title+overlap check
- `src/main/ipc/handlers/calendar-event-handlers.ts` — `calendar-events:list/create/get/update/delete`
- `src/renderer/pages/CalendarPage.tsx` — Dual view toggle (calendar grid + list)
- `src/renderer/components/CalendarGrid.tsx` — Month view with event dots
- `src/renderer/components/CalendarEventForm.tsx` — Form with conditional time fields

**Verification:** Create blocking HOLIDAY → success. All-day toggle → time pickers hidden. Duplicate title + overlapping dates → rejected. Calendar view shows events across both departments. List view sortable by date/type.

---

#### TASK-09: Room Management

**FR:** FR-06
**Dependencies:** TASK-04
**SRS ACs:** FR-06 AC-1 through AC-11 (11 ACs — cascade AC-5 wired in TASK-14)

**Scope:** Room CRUD with department availability (SHS_ONLY, COLLEGE_ONLY, SHARED), status management (AVAILABLE, MAINTENANCE, INACTIVE), capacity validation, unique room codes system-wide, and soft-delete protection (blocked when active schedule entries reference the room). SHS_ONLY rooms hidden when College department is active. SHARED rooms visible to both. Room schedule view shows entries from both departments.

**Key Deliverables:**
- `src/main/services/room-service.ts` — CRUD, status cascade, delete protection check
- `src/main/ipc/handlers/room-handlers.ts` — `rooms:list/create/get/update/delete/get-schedule`
- `src/renderer/pages/RoomsPage.tsx` — Filterable list with status badges, capacity, schedule count
- `src/renderer/components/RoomForm.tsx` — Form with dept availability, status, capacity
- `src/renderer/components/RoomScheduleView.tsx` — Weekly schedule grid for a single room

**Verification:** Duplicate room code → rejected. Capacity < 1 → rejected. Switch to College → SHS_ONLY rooms hidden, SHARED visible. Delete room with active entries → blocked. Delete room with 0 entries → success.

---

#### TASK-10: Section Management

**FR:** FR-07
**Dependencies:** TASK-06
**SRS ACs:** FR-07 AC-1 through AC-10 (10 ACs)

**Scope:** Department-specific section models: SHS uses Homeroom (one section attends all subjects; shows Adviser, Strand/Track fields) while College uses Course model (each section represents one course; shows Course/Program, Subject fields). Scoped to dept + AY + semester with unique section codes per scope. Delete protection when active entries exist. Student count validation (no negatives).

**Key Deliverables:**
- `src/main/services/section-service.ts` — CRUD, dept-specific field validation, delete protection
- `src/main/ipc/handlers/section-handlers.ts` — `sections:list/create/get/update/delete/get-schedule`
- `src/renderer/pages/SectionsPage.tsx` — List with year-level filter, dept-conditional columns
- `src/renderer/components/SectionForm.tsx` — Conditional fields by department (SHS vs College)

**Verification:** SHS form shows Adviser + Strand/Track; College form shows Course/Program + Subject. Duplicate code in same AY+semester+dept → rejected. Negative student count → rejected. Delete section with entries → blocked.

---

#### TASK-11: Personnel Management

**FR:** FR-08
**Dependencies:** TASK-04
**SRS ACs:** FR-08 AC-1 through AC-15 (15 ACs — overload cascade AC-6, AC-7 wired in TASK-14)

**Scope:** Faculty/staff records with primary department, optional cross-department sharing (`is_shared` flag). Unique employee ID and email system-wide. Configurable max weekly hours (1–80) with workload tracking. Shared personnel appear in both department lists with a visual label. Personnel schedule view shows entries from BOTH departments (not filtered by active dept). Delete protection: blocked if published entries exist.

**Key Deliverables:**
- `src/main/services/personnel-service.ts` — CRUD, sharing rules, workload calculation, delete protection
- `src/main/ipc/handlers/personnel-handlers.ts` — `personnel:list/create/get/update/delete/get-schedule`
- `src/renderer/pages/PersonnelPage.tsx` — List with shared filter, weekly load display
- `src/renderer/components/PersonnelForm.tsx` — Form with specializations (JSON array), shared toggle
- `src/renderer/components/PersonnelScheduleView.tsx` — Cross-department weekly view

**Verification:** Duplicate employee ID → rejected. Shared personnel visible in both dept lists with "Shared" badge. Non-shared personnel blocked from cross-dept assignment. Delete with published entries → blocked.

---

### Layer 4 — Scheduling Core

---

#### TASK-12: Schedule Entries — Data Layer

**FR:** FR-09
**Dependencies:** TASK-07, TASK-08, TASK-09, TASK-10, TASK-11
**SRS ACs:** FR-09 AC-1 through AC-20, AC-27 through AC-32 (data/validation ACs — UI ACs deferred to TASK-13)

**Scope:** Core scheduling service: create/update/delete DRAFT entries with full validation. Build RecurrenceService for 11 patterns (ONCE, DAILY, WEEKLY, BIWEEKLY, MONTHLY_DATE, MONTHLY_DAY, MONTHLY_FIRST/SECOND/THIRD/FOURTH/LAST_WEEKDAY — max 200 occurrences). Build ConflictEngine scaffold with 5 core HARD detectors (room_conflict, personnel_conflict, section_conflict, blocked_by_event, personnel_overload). Field dependency matrix by activity type (which fields are required/optional/hidden for CLASS, EXAM, MEETING, OFFICE, TUTORIAL, CONSULTATION). Time slot alignment with configurable period lengths. Dry-run validation (`schedules:validate`).

**Key Deliverables:**
- `src/main/services/schedule-entry-service.ts` — CRUD, field dependency matrix, time validation
- `src/main/services/recurrence-service.ts` — 11 pattern expansion, 200-occurrence limit, date skip logic
- `src/main/services/conflict-engine.ts` — 5 core HARD detectors, override flow with reason
- `src/main/ipc/handlers/schedule-handlers.ts` — `schedules:create-draft/update-draft/delete-draft/validate`
- `src/shared/types.ts` — Extend with entry types, recurrence types, conflict shapes

**Verification:** Create CLASS + F2F + valid room/personnel/section → DRAFT created. F2F without room → rejected. End ≤ start → rejected. Cross-dept sections → rejected. No active semester → blocked. HARD conflict → blocked (unless override with reason). Dry-run returns conflict list without saving. WEEKLY pattern → correct date expansion.

---

#### TASK-13: Schedule Entries — UI

**FR:** FR-09
**Dependencies:** TASK-12
**SRS ACs:** FR-09 AC-21 through AC-26, AC-33 through AC-36 (UI/UX ACs)

**Scope:** Schedule entry form with dynamic field visibility based on activity type (field dependency matrix). Timetable grid view (weekly) and list view. Clone entry (pre-fill form with existing data). Quick-add from timetable cell click. Entry detail panel (side panel or modal). Conflict badges on entries with HARD/SOFT distinction. Override reason dialog. Unsaved changes confirmation. Time slot alignment indicator.

**Key Deliverables:**
- `src/renderer/pages/SchedulePage.tsx` — Timetable grid + list view toggle, filter bar
- `src/renderer/components/ScheduleEntryForm.tsx` — Dynamic form with field dependency matrix
- `src/renderer/components/TimetableGrid.tsx` — Weekly grid with drag/click interaction
- `src/renderer/components/EntryDetailPanel.tsx` — Side panel with full entry details
- `src/renderer/components/ConflictBadge.tsx` — Inline HARD/SOFT conflict indicators
- `src/renderer/components/OverrideDialog.tsx` — Override reason input dialog
- `src/renderer/components/UnsavedChangesDialog.tsx` — Navigation guard

**Verification:** Select activity type → form fields update dynamically. Click timetable cell → quick-add pre-fills day/time. Clone entry → form pre-filled. Conflict badges visible on flagged entries. Navigate away with unsaved changes → confirmation prompt.

---

### Layer 5 — Conflict & Audit

---

#### TASK-14: Conflict Detection — Full Engine

**FR:** FR-10
**Dependencies:** TASK-12
**SRS ACs:** FR-10 AC-1 through AC-26 (26 ACs)

**Scope:** Complete the ConflictEngine with all 15 detectors (add 10 remaining: capacity_exceeded, workload_approaching, specialization_mismatch, room_unavailable, room_dept_mismatch, personnel_dept_mismatch, exam_period_mismatch, exam_quarter_mismatch, personnel_inactive, section_inactive). Implement resource mutation cascade: when a resource (room, personnel, section, calendar event) is modified, re-evaluate all DRAFT entries referencing it and update conflict flags. Wire cascade into entity services from TASK-08 through TASK-11. Build conflict summary UI. Override audit trail integration.

**Key Deliverables:**
- `src/main/services/conflict-engine.ts` — Extend with 10 additional detectors (6 SOFT, 4 HARD)
- `src/main/services/room-service.ts` — Add cascade call on status change
- `src/main/services/section-service.ts` — Add cascade call on student count change
- `src/main/services/personnel-service.ts` — Add cascade call on max hours / status change
- `src/main/services/calendar-event-service.ts` — Add cascade call on blocking event create/edit/delete
- `src/renderer/components/ConflictSummary.tsx` — Conflict summary panel with detector breakdown

**Verification:** Room status → MAINTENANCE → all DRAFT entries using it get `room_unavailable` flag. Personnel max hours reduced below assigned → `personnel_overload` flag. Capacity exceeded → SOFT warning. Each of 15 detectors fires correctly per SRS AC definitions. Override stores reason in audit log. Cascade only affects DRAFT (not PUBLISHED).

---

#### TASK-15: Audit Trail UI

**FR:** FR-12
**Dependencies:** TASK-12
**SRS ACs:** FR-12 AC-1 through AC-12 (12 ACs)

**Scope:** Dedicated Audit Log page with filterable, searchable, paginated log of all mutations. Filters: entity type, action type (CREATE/UPDATE/DELETE/OVERRIDE/PUBLISH/UNPUBLISH), department, date range, personnel. Diff view comparing before/after snapshots for UPDATE actions. Generalize audit logging to cover all entity types (rooms, sections, personnel, calendar events, academic years, semesters). 24-month retention with archival.

**Key Deliverables:**
- `src/main/ipc/handlers/audit-handlers.ts` — `audit:list` with filter/pagination params
- `src/renderer/pages/AuditPage.tsx` — Filterable log table with expandable rows
- `src/renderer/components/AuditDiffView.tsx` — Side-by-side or inline diff of before/after snapshots
- `src/renderer/components/AuditFilters.tsx` — Filter bar (entity type, action, date range, dept)
- `src/main/services/audit-service.ts` — Extend with query/filter support, retention check

**Verification:** Create/update/delete entries → audit records appear in log. Filter by action type → correct results. Expand UPDATE row → diff view shows changed fields. Audit table blocks UPDATE/DELETE via trigger.

---

### Layer 6 — Publish & Exam

---

#### TASK-16: Publish Workflow

**FR:** FR-11
**Dependencies:** TASK-13, TASK-14
**SRS ACs:** FR-11 AC-1 through AC-26 (26 ACs)

**Scope:** DRAFT → PUBLISHED lifecycle with atomic publish. Publish all drafts or selective publish (checkbox selection). Pre-publish summary showing entry count, unresolved conflicts. Block publish if any selected entry has unresolved HARD conflicts. Bulk unpublish (PUBLISHED → DRAFT) with re-validation. Re-validate published entries (update conflict flags without changing status). Inactive semester guard (block publish for inactive semester with banner). Audit records for PUBLISH/UNPUBLISH actions.

**Key Deliverables:**
- `src/main/services/publish-service.ts` — Publish, unpublish, re-validate, selective publish
- `src/main/ipc/handlers/publish-handlers.ts` — `schedules:publish/unpublish/list-draft`
- `src/renderer/components/PublishPanel.tsx` — Draft list with checkboxes, pre-publish summary
- `src/renderer/components/PublishSummaryDialog.tsx` — Confirmation with conflict/entry counts
- `src/renderer/components/InactiveSemesterBanner.tsx` — Warning banner for inactive semesters

**Verification:** Publish drafts with no HARD conflicts → status changes to PUBLISHED, audit records created. Publish with HARD conflict → blocked. Unpublish → reverts to DRAFT, re-runs conflict detection. Published entries not directly editable (must unpublish first). Selective publish → only checked entries published.

---

#### TASK-17: Exam Schedule

**FR:** FR-13
**Dependencies:** TASK-16
**SRS ACs:** FR-13 AC-1 through AC-18 (18 ACs)

**Scope:** Specialized EXAM activity type with department-specific exam types: SHS uses Q1_EXAM through Q4_EXAM (quarter-aligned), College uses PRELIM/MIDTERM/PRE_FINALS/FINALS. Room is always required for exams. Recurrence locked to ONCE. SHS quarter validation: Q1 exam outside Q1 date window → SOFT warning (`exam_quarter_mismatch`). Exam period validation: exam outside EXAM_PERIOD calendar event → SOFT warning. Dedicated exam list and calendar views with filters.

**Key Deliverables:**
- `src/renderer/pages/ExamSchedulePage.tsx` — Exam list + calendar view with filters
- `src/renderer/components/ExamScheduleForm.tsx` — Exam-specific form (dept-conditional exam types)
- `src/renderer/components/ExamCalendarView.tsx` — Calendar with exam events + blocking events overlay
- `src/main/services/schedule-entry-service.ts` — Extend validation: exam type cross-dept rejection, ONCE enforcement, room-required

**Verification:** SHS exam with Q1_EXAM type → success. College using Q1_EXAM → rejected. Exam without room → rejected. Non-ONCE recurrence → rejected. Q1 exam outside Q1 window → SOFT warning. Exam outside EXAM_PERIOD → SOFT warning.

---

### Layer 7 — Templates & Import

---

#### TASK-18: Schedule Templates

**FR:** FR-14
**Dependencies:** TASK-14
**SRS ACs:** FR-14 AC-1 through AC-32 (32 ACs)

**Scope:** Save published schedules as reusable blueprints for future terms. Templates store resource references by code (not ID) for cross-semester portability. Three scope filters: ALL, CLASS_ONLY, EXAM_ONLY. Apply template to a target AY+semester: creates DRAFT entries, runs conflict detection, supports section remapping (UI maps source sections to target sections). Atomic application (all entries succeed or none). Template CRUD with preview, edit independence (edits don't affect original schedule), and application history.

**Key Deliverables:**
- `src/main/services/template-service.ts` — Save from published, apply with remapping, CRUD
- `src/main/ipc/handlers/template-handlers.ts` — `templates:list/create/get/update/delete/get-entries/update-entry/delete-entry/apply/get-applications`
- `src/renderer/pages/TemplatesPage.tsx` — Template list with scope badges, last-applied date
- `src/renderer/components/TemplatePreview.tsx` — Read-only entry preview
- `src/renderer/components/TemplateApplyWizard.tsx` — Target term selection, section remapping, conflict preview
- `src/renderer/components/TemplateApplicationHistory.tsx` — Past applications with entry/conflict counts

**Verification:** Save published schedule as template → template created with entries stored by resource code. Apply to new semester → DRAFT entries created, conflicts detected. Missing resource → skipped with warning. Section remapping → entries use remapped section. Atomic: partial failure → no entries created. Edit template entry → original schedule unaffected.

---

#### TASK-19: Data Import

**FR:** FR-15
**Dependencies:** TASK-08, TASK-09, TASK-10, TASK-11
**SRS ACs:** FR-15 AC-1 through AC-32 (32 ACs)

**Scope:** Bulk import for 4 entity types: personnel, sections, rooms, calendar events from CSV/XLSX files. Flow: native file dialog → parse → validate → preview (with row-level error/warning/success status) → commit in single transaction. Limits: 5MB file size, 1,000 rows, 30-second parse timeout. Template download for each entity type (pre-filled headers). Import history page. Upsert logic: match by unique key (employee_id, room_code, section_code+scope, title+dates), full overwrite on match. Error rows skipable. SheetJS for XLSX parsing.

**Key Deliverables:**
- `src/main/services/import-service.ts` — Parse, validate, preview, commit for all 4 entity types
- `src/main/ipc/handlers/import-handlers.ts` — `imports:download-template/upload/commit/list-jobs/get-job`
- `src/renderer/pages/ImportPage.tsx` — Entity type selector, file upload, preview table, commit button
- `src/renderer/components/ImportPreview.tsx` — Row-level status indicators (error/warning/success)
- `src/renderer/components/ImportHistory.tsx` — Past import jobs with stats
- `src/main/templates/` — CSV/XLSX template files for each entity type

**Verification:** Valid CSV → preview with all rows green → commit → entities created/updated. >5MB file → rejected. >1000 rows → rejected. Bad header → rejected. Invalid enum value → row-level ERROR. Template download → correctly formatted file. Transaction rollback on commit failure.

---

### Layer 8 — Export

---

#### TASK-20: Logo & Footer Settings

**FR:** FR-21, FR-23
**Dependencies:** TASK-04
**SRS ACs:** FR-21 AC-1 through AC-10 (10 ACs), FR-23 AC-1 through AC-11 (11 ACs)

**Scope:** Two closely related settings features for PDF export branding. **Logo:** Upload institution logo (PNG/JPEG, max 2MB) via native file dialog, store as base64 in `app_settings`, preview at 200×100px, remove with confirmation. **Footer Credits:** Configurable footer text (max 200 chars) in `app_settings`, cleared = no footer, defaults to empty on first run. Both on the Settings page, persist across restarts, included in database backups.

**Key Deliverables:**
- `src/main/ipc/handlers/logo-handlers.ts` — `logo:upload/get/remove` (base64 read, validate, store)
- `src/renderer/components/LogoSettings.tsx` — Upload button, preview, remove action
- `src/renderer/components/FooterCreditSettings.tsx` — Text input with char counter, clear button
- `src/renderer/pages/SettingsPage.tsx` — Extend with logo + footer sections
- `src/main/services/settings-service.ts` — Extend with logo-specific validation (size, type)

**Verification:** Upload valid PNG < 2MB → preview shows, persists after restart. Upload >2MB → rejected. Upload non-image → rejected. Remove → confirmation dialog → logo cleared. Footer text saved and persists. >200 chars → rejected. Clear footer → no footer in future exports.

---

#### TASK-21: Data Export & Signatories

**FR:** FR-16, FR-22
**Dependencies:** TASK-16, TASK-20
**SRS ACs:** FR-16 AC-1 through AC-30 (30 ACs), FR-22 AC-1 through AC-12 (12 ACs)

**Scope:** Export published schedules in PDF/CSV/XLSX across 6 report types: (1) schedule by resource (room/personnel/section), (2) academic calendar, (3) personnel load summary, (4) room utilization, (5) section schedule, (6) exam schedule. PDF includes institution logo in header (120×60px), footer credits on every page (8pt muted), and signatory blocks at bottom of last page. Pre-export signatory modal: up to 5 optional signatories (Label, Name, Position), "No signatories" checkbox to skip, not persisted between exports. CSV/XLSX exclude logo, signatories, and footer. Draft export includes DRAFT watermark. Uses jspdf for PDF, SheetJS for XLSX.

**Key Deliverables:**
- `src/main/services/export-service.ts` — 6 report generators for PDF/CSV/XLSX
- `src/main/ipc/handlers/export-handlers.ts` — `exports:schedule/calendar/personnel-load/room-utilization/section-schedule/exam-schedule`
- `src/renderer/components/ExportSignatoryModal.tsx` — Pre-export signatory collection
- `src/renderer/components/ExportButton.tsx` — Format selector (PDF/CSV/XLSX) + trigger export
- `src/main/services/export-service.ts` — PDF layout: logo header, signatory footer, credit footer, DRAFT watermark

**Verification:** Export room schedule PDF → file with logo header, entries table, signatory blocks, footer credit on every page. Export CSV → no branding elements. Export with no data → "No data" message. Draft export → DRAFT watermark. Signatory modal: add 3 signatories → evenly spaced in PDF. Signatories not retained between exports.

---

### Layer 9 — Dashboard & Ops

---

#### TASK-22: Dashboard

**FR:** FR-20
**Dependencies:** TASK-16
**SRS ACs:** FR-20 AC-1 through AC-5 (5 ACs)

**Scope:** Default landing page after login. Widgets: active term summary (AY, semester, quarter for SHS), entry counts (draft vs published), conflict counts (HARD with visual emphasis, SOFT), recent audit log entries (last 10), and quick-action cards (create entry, publish drafts, manage rooms, import data). Department switcher updates all widgets. No active term → guidance message with link to Academic Years page.

**Key Deliverables:**
- `src/renderer/pages/DashboardPage.tsx` — Widget grid layout
- `src/renderer/components/dashboard/ActiveTermWidget.tsx` — Current AY/semester/quarter display
- `src/renderer/components/dashboard/EntryCountWidget.tsx` — Draft/published counts
- `src/renderer/components/dashboard/ConflictWidget.tsx` — HARD (red) / SOFT (yellow) counts
- `src/renderer/components/dashboard/RecentAuditWidget.tsx` — Last 10 audit entries
- `src/renderer/components/dashboard/QuickActions.tsx` — Navigation cards

**Verification:** Login → dashboard is default page. Switch department → all widgets update. HARD conflict count visually distinct (red/urgent). No active term → guidance message appears. Quick-action cards navigate to correct pages.

---

#### TASK-23: Backup & Restore

**FR:** FR-19
**Dependencies:** TASK-03
**SRS ACs:** FR-19 AC-1 through AC-21 (21 ACs)

**Scope:** Manual backup via SQLite Backup API (not fs.copy) with native save dialog (default filename: `schedule-backup-YYYY-MM-DD.db`). Restore: native open dialog (.db filter), password verification, `PRAGMA integrity_check`, safety backup before restore, confirmation warning, full DB replacement, auth invalidation → redirect to login. Auto-backup on app close with 5-file rotation in userData. Auto-backup list in Settings with restore/delete. 7-day backup reminder (dismissible, checks `last_backup_date`). Password hash change warning on restore if different.

**Key Deliverables:**
- `src/main/services/backup-service.ts` — Manual backup (Backup API), restore with integrity check, auto-backup rotation
- `src/main/ipc/handlers/backup-handlers.ts` — `backup:create/restore/list-auto/restore-auto/delete-auto`
- `src/main/ipc/handlers/dialog-handlers.ts` — `dialog:open-file/save-file` (native file dialogs)
- `src/renderer/components/BackupSettings.tsx` — Manual backup/restore buttons, auto-backup list
- `src/renderer/components/BackupReminderBanner.tsx` — 7-day reminder, dismissible

**Verification:** Backup → save dialog → .db file created with full DB snapshot. Restore → password prompt → integrity check → DB replaced → redirect to login. Corrupt file → rejected with error. Auto-backup on close → file created in userData. 6th auto-backup → oldest rotated out. 7-day reminder appears when `last_backup_date` > 7 days.

---

## In Progress

(none)

---

## Done

(none)

---

> **Backlog Rules:**
> - Each task must reference an SRS FR (e.g., "FR-05").
> - Technical ACs must map to a behavioral AC in the referenced SRS FR. Do not add technical ACs that test behavior outside the scope of the SRS acceptance criteria.
> - Technical ACs provide the IPC-level details (channels, request/response payloads) that the SRS behavioral ACs intentionally omit.
> - Technical ACs must reference their parent SRS behavioral AC using `FR-XX AC-N` format (e.g., "Expands FR-10 AC-3"). This traceability link is mandatory.
> - If a technical AC has no parent SRS behavioral AC, either the SRS needs a new AC (file a CR if approved) or the technical AC is out of scope and must be removed.
> - When a design file (Figma / wireframes) exists for a task's FR, evaluate the design against the SRS FR block before marking the task "Ready." Flag discrepancies and resolve them (CR to update SRS, or design revision) before implementation begins.
