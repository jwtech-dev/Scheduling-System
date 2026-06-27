# Software Requirements Specification (SRS)

> **Project:** Schedule Management System
> **Version:** 1.0
> **Last Updated:** 2026-05-31
> **Authors:** Developer
> **Status:** Approved
> **References:** [PRD_ScheduleManagement.md](PRD_ScheduleManagement.md)

**Status Definitions:**

| Status | Meaning | What is allowed |
|--------|---------|-----------------|
| **Draft** | Work in progress. Requirements are being written. | Add, modify, or remove any requirement directly. No CR needed. |
| **In Review** | Sent to stakeholders for review and feedback. | Edits based on review feedback only. No new features. |
| **Approved** | Signed off by majority (2 of 3 stakeholders: Product Owner, Tech Lead, QA Lead â€” override in PROJECT_RULES if different). For solo developers or two-person teams: the developer is both Tech Lead and QA Lead; approval requires self-review with a documented checklist pass (Documentation Compliance Checklist). This is the baseline. | **Document is locked.** All changes require a CR. Architecture changes require an ADR. Direct edits are not allowed. |

**Versioning rules:**
- CR-updated versions (e.g., v1.0 to v1.1) go **directly to Approved** status. The CR itself is the review.
- The SRS must be updated **before implementation begins**. No coding until the SRS reflects the approved CR.
- Emergency production fixes: edit the SRS immediately, file the CR retroactively within 48 hours.

---

## 1. Overview

The Schedule Management System is a standalone offline desktop application built with Electron, serving two academic departments: Senior High School (SHS) and College. It is operated by a single administrator user who manages all scheduling operations across both departments without any role-based access control. The application requires no internet connection, no external database server, and no manual database setup. All data is stored locally in a SQLite database file. The system enables: managing academic terms, rooms, sections, personnel, class/exam schedules with recurrence patterns, schedule templates, CSV/Excel import, multi-format export, and database backup/restore. The technology stack is Electron, React, Tailwind CSS, and SQLite (better-sqlite3). Communication between the renderer process (React UI) and main process (business logic + database) is via IPC through Electron's context bridge.

> **Scope note:** The system does not manage curriculum, course catalogs, or subject master lists. SHS sections are scheduling containers only — subjects are specified at the schedule entry level as free-text fields.

---

## 2. Glossary

| Term | Definition |
|------|------------|
| SHS | Senior High School â€” Grades 11â€“12 academic department. School year runs Juneâ€“March. Uses 1st and 2nd Semester. No Summer term. |
| College | College/Tertiary â€” Undergraduate academic department. School year runs Augustâ€“May. Uses 1st Semester, 2nd Semester, and Summer. |
| Department | Either SHS or College; the top-level organizational scope for all scheduling operations. |
| Academic Year | A named school year period defined independently per department (SHS: Juneâ€“March cycle; College: Augustâ€“May cycle). |
| Semester | A term period within an Academic Year. SHS allows: 1st Semester, 2nd Semester. College allows: 1st Semester, 2nd Semester, Summer. |
| Quarter | A subdivision within an SHS Semester (Q1 & Q2 in 1st Semester; Q3 & Q4 in 2nd Semester). Used for SHS exam period marking only â€” not a separate scheduling term. |
| Homeroom Section | SHS section model â€” a fixed cohort of students who attend all their subjects together as a group. |
| Course Section | College section model â€” a section tied to a specific subject; students enroll per subject. |
| SHS Exam Types | Per-quarter examinations: Q1 Exam, Q2 Exam, Q3 Exam, Q4 Exam. |
| College Exam Types | Per-semester examinations: Prelim, Midterm, Pre-Finals, Finals. |
| Period Length | The configured duration of a single class period. SHS and College may use different standard period lengths. |
| Draft | A schedule entry that has been created and saved but not yet published. Visible only in the draft builder view. |
| Published | A finalized schedule entry visible across all schedule views. |
| Hard Conflict | A conflict that blocks saving unless explicitly overridden. |
| Soft Conflict | An advisory conflict that warns but does not block. |
| F2F | Face-to-Face delivery modality. |
| Recurrence Pattern | The repeating schedule rule for an entry (e.g., WEEKLY on Mondays, WEEKDAYS, BI_WEEKLY). |
| Schedule Template | A saved, semester-agnostic snapshot of schedule entries that can be applied to a new Academic Year/Semester. |
| Import Job | A tracked process that parses an uploaded CSV or Excel file and upserts records into the system. |
| IPC | Inter-Process Communication â€” mechanism by which the renderer process communicates with the main process. |
| Main Process | The Electron Node.js process that manages app lifecycle, database access, and all business logic. |
| Renderer Process | The Electron Chromium process that runs the React UI; has no direct access to Node.js APIs or the database. |
| Preload Script | A script that runs before the renderer process loads, providing a secure bridge via contextBridge. |
| SQLite Backup API | SQLite's built-in mechanism for creating a consistent database snapshot while the application is running. |
| Institution Logo | A user-uploaded image (PNG, JPG, or JPEG) stored in app_settings as a base64-encoded data URI. Displayed in the header area of all PDF exports. Configured once via Settings; persists until replaced or removed. |
| Export Signatories | Optional named individuals (with label/title, name, and position) whose signature blocks appear at the bottom of PDF exports. Collected via a modal at export time. |
| Export Footer Credit | A configurable text line displayed in the footer of every exported PDF (e.g., "Schedule Management System | Powered by: JW-Tech"). Stored in app_settings. |

---

## 3. System Actors

For each actor, list what they CAN do (Key Permissions) and what they CANNOT do (Restrictions). When an FR references an Actor, the FR's sub-requirements must not grant capabilities beyond that Actor's permissions. If an FR needs an actor to do something not listed here, update the actor's permissions first.

| Actor | Description | Key Permissions | Restrictions |
|-------|-------------|-----------------|-------------|
| Administrator | Single user who operates the system. Manages all scheduling operations across both SHS and College departments. | Full access to all features: CRUD operations on all entities (academic terms, rooms, sections, personnel, schedule entries, templates, calendar events), publish/unpublish schedules, import/export data, backup/restore database, change password, upload/remove institution logo, configure export footer credits, provide export signatories at export time. | None â€” single-user system with no role restrictions. All features are equally accessible once authenticated. |

---

## 4. Functional Requirements

Each feature is a self-contained specification block that a developer or AI agent can implement without referencing other documents.

Rules for writing requirements:
- Each requirement gets a unique ID (FR-XX.Y format)
- Sub-requirements are atomic u2014 one behavior per line
- Include edge cases, error states, and anti-patterns explicitly
- Only document what this version builds u2014 future plans belong in the PRD Parking Lot

FR scope heuristic: One FR = one user-facing capability that can be independently tested, deployed, and described in a single sentence starting with `The system shall allow [actor] to [action].'' If the sentence requires `and'' to describe two unrelated actions, split into two FRs. If the actions share the same data model and UI surface, keep them in one FR with sub-requirements.

### FR-01: Department Scope & Configuration

**Description:** The system is organized around two fixed academic departments â€” SHS and College â€” each with distinct academic calendars, exam structures, section models, and period configurations. The department context governs what data the user sees and can create. A global department switcher controls the active context, filtering all data entry and views (except institution-wide features like the Academic Calendar).

**Actor:** Administrator

**Priority:** Must

**Dependencies:** None
**Related FRs:** FR-02, FR-13

**Data Model Reference:** app_settings ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

- FR-01.1: The system shall define exactly two departments: `SHS` and `COLLEGE`. These are hard-coded and cannot be added, renamed, or removed by any user action.
- FR-01.2: The SHS department school year cycle shall run from June of Year N to March of Year N+1.
- FR-01.3: The College department school year cycle shall run from August of Year N to May of Year N+1.
- FR-01.4: The SHS department shall allow only two semester types: `1ST_SEMESTER` and `2ND_SEMESTER`.
- FR-01.5: The College department shall allow three semester types: `1ST_SEMESTER`, `2ND_SEMESTER`, and `SUMMER`.
- FR-01.6: The system shall reject creation of a `SUMMER` semester under the SHS department with the validation error: "Summer semester is not available for SHS."
- FR-01.7: The SHS exam structure shall use quarter-based exam types: `Q1 Exam`, `Q2 Exam` (within 1st Semester) and `Q3 Exam`, `Q4 Exam` (within 2nd Semester).
- FR-01.8: The College exam structure shall use semester-based exam types: `Prelim`, `Midterm`, `Pre-Finals`, `Finals` (per semester, including Summer).
- FR-01.9: The SHS department shall use the Homeroom section model, where a fixed cohort of students attends all subjects together as a group.
- FR-01.10: The College department shall use the Course section model, where each section is tied to a specific subject and students enroll individually per subject.
- FR-01.11: Each SHS semester shall be divided into two quarters for exam period marking purposes. 1st Semester contains Q1 and Q2; 2nd Semester contains Q3 and Q4.
- FR-01.12: The College department shall have no quarter subdivisions.
- FR-01.13: Period length shall be configurable per department via `app_settings` and shall not be hard-coded. SHS typical default: 60 minutes. College typical range: 60â€“180 minutes.
- FR-01.14: The system shall operate one active department context at a time, controlled by a department switcher (SHS/College) in the global navigation bar.
- FR-01.15: When a department context is active, all data entry forms and list views shall be filtered to show only data belonging to that department, except for institution-wide features.
- FR-01.16: The Academic Calendar shall be institution-wide and shall not be filtered by the department switcher.
- FR-01.17: Academic Years and Semesters shall be fully independent per department; creating or modifying an Academic Year in one department shall have no effect on the other department.
- FR-01.18: Sections shall belong to exactly one department and shall follow that department's section model (Homeroom for SHS, Course-based for College).
- FR-01.19: A single schedule entry shall not reference sections from different departments. The system shall reject any attempt to mix cross-department sections in one entry.
- FR-01.20: Personnel shall belong to one primary department but may be marked `is_shared=true`, making them schedulable in both departments with weekly workload tracked globally across both.
- FR-01.21: Rooms shall have a Department Availability attribute with values: `SHS_ONLY`, `COLLEGE_ONLY`, or `SHARED`. Room conflict detection shall operate cross-department (a SHARED room booked in SHS is unavailable at that time in College, and vice versa).
- FR-01.22: Examination types shall be department-specific and enforced at the service layer. SHS entries may only use SHS exam types; College entries may only use College exam types.
- FR-01.23: Schedule Templates may be scoped as `SHS`, `COLLEGE`, or `CROSS_DEPARTMENT`.
- FR-01.24: Import jobs shall be associated with a department at upload time, except for Room imports which are system-wide.

**Acceptance Criteria:**

- [ ] AC-1: Only `SHS` and `COLLEGE` appear as department options throughout the system; no UI or API allows adding, renaming, or removing a department.
- [ ] AC-2: Attempting to create a Summer semester under SHS returns the error "Summer semester is not available for SHS." and the semester is not created.
- [ ] AC-3: Switching the department context from SHS to College updates all visible lists (Academic Years, Semesters, Sections, Personnel, Schedule Entries) to show only College data.
- [ ] AC-4: The Academic Calendar page displays the same data regardless of which department is currently selected in the switcher.
- [ ] AC-5: A personnel record with `is_shared=true` and primary department SHS appears in both the SHS personnel list (as primary) and the College personnel list (as shared) and can be assigned to schedule entries in both departments.
- [ ] AC-6: A room with availability `SHS_ONLY` does not appear as selectable when creating a schedule entry under the College department context.
- [ ] AC-7: A SHARED room booked for SHS at Monday 8:00â€“9:00 triggers a hard conflict when a College entry attempts to book the same room at the same time.
- [ ] AC-8: Creating a schedule entry that references one SHS section and one College section is rejected by the system.
- [ ] AC-9: An SHS exam schedule entry only allows selection of SHS exam types (Q1 Exam, Q2 Exam, Q3 Exam, Q4 Exam); College exam types are not available.
- [ ] AC-10: A College exam schedule entry only allows selection of College exam types (Prelim, Midterm, Pre-Finals, Finals); SHS exam types are not available.
- [ ] AC-11: Changing the SHS period length in `app_settings` does not affect the College period length, and vice versa.

- [ ] AC-12: When an SHS Academic Year is created, the system enforces a June-to-March school year cycle for the SHS department.
- [ ] AC-13: When a College Academic Year is created, the system enforces an August-to-May school year cycle for the College department.
- [ ] AC-14: When creating a Semester under SHS, only 1ST_SEMESTER and 2ND_SEMESTER appear as selectable types.
- [ ] AC-15: When creating a Semester under College, 1ST_SEMESTER, 2ND_SEMESTER, and SUMMER appear as selectable types.
- [ ] AC-16: When viewing SHS exam types in a schedule entry form, only Q1 Exam, Q2 Exam, Q3 Exam, and Q4 Exam are available; College exam types are not shown.
- [ ] AC-17: When viewing College exam types in a schedule entry form, only Prelim, Midterm, Pre-Finals, and Finals are available; SHS exam types are not shown.
- [ ] AC-18: When creating an SHS section, the form uses the Homeroom model with a fixed cohort (no Subject field); College section form uses the Course model with a Subject field.
- [ ] AC-19: When viewing an SHS 1st Semester, the semester displays Q1 and Q2 quarter subdivisions; College semesters show no quarter subdivisions.
- [ ] AC-20: When configuring period length in app_settings for SHS, the value is stored independently from the College period length.
- [ ] AC-21: When creating an Academic Year in one department, the other department's Academic Year list remains unchanged.
- [ ] AC-22: When creating a Schedule Template, the scope options include SHS, COLLEGE, and CROSS_DEPARTMENT.
- [ ] AC-23: When uploading an import file, the import job is associated with the active department context, except Room imports which are system-wide.
- [ ] AC-24: When a personnel record with is_shared=true is viewed, it appears in both department personnel lists with correct primary/shared labels.

---

### FR-02: Academic Year Management

**Description:** Academic Years are the top-level time containers for each department, encapsulating one or more semesters. Each department defines its own Academic Years independently, following its specific school year cycle. The system enforces start-month constraints, date ordering, uniqueness, and active-status limits to maintain data integrity.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-01
**Related FRs:** FR-03, FR-04, FR-05

**Data Model Reference:** academic_years ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

- FR-02.1: The system shall allow creation of an Academic Year with the following fields: Department (`SHS` or `COLLEGE`), Label (e.g., "2025â€“2026"), Start Date, End Date, and Status (`Active` or `Inactive`).
- FR-02.2: The End Date shall be strictly after the Start Date. The system shall reject creation or update where End Date â‰¤ Start Date.
- FR-02.3: Only one Academic Year may be `Active` per department at any time. Setting an Academic Year to `Active` shall deactivate any previously active Academic Year in the same department.
- FR-02.4: The Label shall be unique within a department. The system shall reject creation of an Academic Year with a label that already exists for the same department.
- FR-02.5: The Label shall follow the format "YYYYâ€“YYYY" (e.g., "2025â€“2026").
- FR-02.6: For SHS Academic Years, the Start Date must fall in June. The system shall validate this against the configured start month in `app_settings` (default: June).
- FR-02.7: For College Academic Years, the Start Date must fall in August. The system shall validate this against the configured start month in `app_settings` (default: August).
- FR-02.8: SHS Academic Years shall span from June of Year N to March of Year N+1.
- FR-02.9: College Academic Years shall span from August of Year N to May of Year N+1.
- FR-02.10: The system shall allow editing of an Academic Year's Label, Start Date, End Date, and Active Status.
- FR-02.11: When editing date ranges, the system shall prevent narrowing the date range below the span of any linked Semesters. If a Semester's dates would fall outside the updated Academic Year range, the edit shall be rejected with a validation error.
- FR-02.12: The system shall display a paginated list of Academic Years filtered by the active department, showing Label, Start Date, End Date, Status, and Semester Count.
- FR-02.13: The system SHALL auto-derive the Academic Year label from the Start Date. The label format SHALL be 'YYYY–YYYY' calculated from the start year and start year + 1. Manual label entry SHALL NOT be permitted.
- FR-02.14: Academic Year date ranges SHALL NOT overlap within the same department. The system SHALL reject creation of an AY whose date range overlaps with an existing AY in the same department.
- FR-02.15: The End Date SHALL be manually provided by the administrator. The system SHALL validate that End Date is strictly after Start Date (FR-02.2) and that the resulting range does not overlap existing Academic Years in the same department (FR-02.14).

**Acceptance Criteria:**

- [ ] AC-1: Creating an SHS Academic Year with Start Date "2025-08-01" (August) is rejected because SHS must start in June.
- [ ] AC-2: Creating a College Academic Year with Start Date "2025-06-01" (June) is rejected because College must start in August.
- [ ] AC-3: Creating an Academic Year with End Date equal to Start Date is rejected with a validation error.
- [ ] AC-4: Creating two SHS Academic Years with the label "2025â€“2026" is rejected on the second attempt with a uniqueness error.
- [ ] AC-5: Setting SHS Academic Year "2026â€“2027" to Active automatically sets SHS Academic Year "2025â€“2026" to Inactive.
- [ ] AC-6: Activating an SHS Academic Year does not affect the active status of any College Academic Year.
- [ ] AC-7: An SHS Academic Year with a linked 1st Semester from June 15 to October 30 cannot have its End Date changed to October 1 (which would exclude the semester's end date).
- [ ] AC-8: The Academic Year list view displays only SHS Academic Years when the department context is SHS, and only College Academic Years when College is selected.
- [ ] AC-9: Each row in the Academic Year list shows the correct count of linked Semesters.
- [ ] AC-10: When the admin enters a Start Date of 2025-06-01 for an SHS Academic Year, the system auto-derives the label as '2025–2026' and the Label field is read-only.
- [ ] AC-11: When the admin attempts to create an SHS Academic Year with Start Date 2025-06-01 and End Date 2026-03-31, and an existing SHS AY already covers 2025-06-01 to 2026-03-31, the system rejects with an overlap error.
- [ ] AC-12: When the admin enters Start Date 2025-06-01 and End Date 2026-03-31 for an SHS Academic Year, the system accepts the dates (End Date is after Start Date and within valid range).

---

### FR-03: Semester Management

**Description:** Semesters are time subdivisions within an Academic Year, controlling when schedule entries can be created. Each semester is linked to a parent Academic Year, constrained by department-specific type rules, and must have dates within its parent's range. SHS semesters additionally capture quarter boundary dates that define exam windows.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-01, FR-02
**Related FRs:** FR-04, FR-05

**Data Model Reference:** semesters ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

- FR-03.1: The system shall allow creation of a Semester with the following fields: Academic Year (foreign key), Semester Type, Start Date, End Date, and Status (`Active` or `Inactive`).
- FR-03.2: For SHS, the allowed Semester Type values shall be `1ST_SEMESTER` and `2ND_SEMESTER` only.
- FR-03.3: For College, the allowed Semester Type values shall be `1ST_SEMESTER`, `2ND_SEMESTER`, and `SUMMER`.
- FR-03.4: Attempting to create a `SUMMER` semester under an SHS Academic Year shall be rejected with the message: "Summer semester is not available for SHS."
- FR-03.5: The Semester Start Date and End Date shall both fall within the parent Academic Year's date range. The system shall reject dates outside that range.
- FR-03.6: The Semester Type shall be unique within a given Academic Year. The system shall reject creation of a duplicate type (e.g., two `1ST_SEMESTER` records under the same Academic Year).
- FR-03.7: Only one Semester may be `Active` per Academic Year at any time. Setting a Semester to `Active` shall deactivate any previously active Semester in the same Academic Year.
- FR-03.8: When creating or editing an SHS `1ST_SEMESTER`, the system shall capture a Q1 End Date field. Q1 spans from semester Start Date to Q1 End Date (inclusive). Q2 spans from Q1 End Date + 1 day to semester End Date (inclusive).
- FR-03.9: When creating or editing an SHS `2ND_SEMESTER`, the system shall capture a Q3 End Date field. Q3 spans from semester Start Date to Q3 End Date (inclusive). Q4 spans from Q3 End Date + 1 day to semester End Date (inclusive).
- FR-03.10: Quarter boundary dates (Q1 End Date, Q3 End Date) must fall strictly between the semester Start Date and End Date (exclusive of both endpoints). The system shall reject boundary dates equal to or outside the semester start/end.
- FR-03.11: College semesters shall not have quarter boundary date fields. The system shall not display or accept quarter fields for College semesters.
- FR-03.12: The system shall allow editing of a Semester's Start Date, End Date, Active Status, and quarter boundary dates (for SHS semesters).
- FR-03.13: The system shall display Semesters grouped by their parent Academic Year, showing Semester Type, Status, Start Date, End Date, and quarter boundary dates for SHS semesters.
- FR-03.14: Semester date ranges SHALL NOT overlap within the same Academic Year. The system SHALL reject creation of a semester whose date range overlaps with another semester in the same AY.
- FR-03.15: When the admin sets a new semester as active while the previous semester has unpublished draft entries, the system SHALL display a non-blocking advisory checklist showing: unpublished draft count, reminder to save as template before switching, and reminder to create a backup.

**Acceptance Criteria:**

- [ ] AC-1: Creating a `1ST_SEMESTER` under an SHS Academic Year that already has a `1ST_SEMESTER` is rejected with a uniqueness error.
- [ ] AC-2: Creating a Semester with Start Date before the parent Academic Year's Start Date is rejected.
- [ ] AC-3: Creating a Semester with End Date after the parent Academic Year's End Date is rejected.
- [ ] AC-4: Creating a `SUMMER` semester under SHS returns: "Summer semester is not available for SHS."
- [ ] AC-5: A College `SUMMER` semester is successfully created under a College Academic Year.
- [ ] AC-6: Setting SHS 1st Semester to Active when 2nd Semester is already Active causes 2nd Semester to become Inactive.
- [ ] AC-7: An SHS 1st Semester creation form displays the Q1 End Date field; a College 1st Semester creation form does not.
- [ ] AC-8: For an SHS 1st Semester with Start Date June 15 and End Date October 30, setting Q1 End Date to June 15 (equal to start) is rejected.
- [ ] AC-9: For an SHS 1st Semester with Start Date June 15 and End Date October 30, setting Q1 End Date to October 30 (equal to end) is rejected.
- [ ] AC-10: For an SHS 1st Semester with Start Date June 15 and End Date October 30, setting Q1 End Date to August 15 is accepted. Q1 = June 15 â€“ August 15; Q2 = August 16 â€“ October 30.
- [ ] AC-11: The Semester list view for SHS shows quarter boundary dates in each row; the College list does not show quarter columns.
- [ ] AC-12: When the admin creates a 2nd Semester with Start Date overlapping the 1st Semester's date range in the same Academic Year, the system rejects with an overlap error.
- [ ] AC-13: When the admin activates 2nd Semester while the 1st Semester has 5 unpublished draft entries, the system displays a non-blocking advisory showing: '5 unpublished drafts', a reminder to save as template, and a reminder to create a backup. The activation is not blocked.

---

### FR-04: Active Term Resolution

**Description:** The system must be able to resolve the currently active Academic Year and Semester for each department at any time. This resolution drives default context for schedule creation and determines whether new schedule entries can be created. A department without an active semester is blocked from creating new CLASS, EXAM, or OFFICE schedule entries.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-02, FR-03
**Related FRs:** FR-09, FR-13

**Data Model Reference:** academic_years, semesters ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

- FR-04.1: The system shall provide an Active Term Resolution function that returns the currently active Academic Year and Semester for a given department.
- FR-04.2: For SHS, the resolved active term output shall include: department, academic_year_id, academic_year_label, semester_id, semester_type, start_date, end_date, q1_end_date, and q2_end_date (where q2_end_date corresponds to q3_end_date for 2nd Semester contexts).
- FR-04.3: For College, the resolved active term output shall include: department, academic_year_id, academic_year_label, semester_id, semester_type, start_date, and end_date.
- FR-04.4: If a department has no active Academic Year, the Active Term Resolution shall return null/empty for that department.
- FR-04.5: If a department has an active Academic Year but no active Semester within it, the Active Term Resolution shall return the Academic Year information with null Semester fields.
- FR-04.6: A department with no active Semester (either no active Academic Year or no active Semester within the active Academic Year) shall be blocked from creating new schedule entries of type CLASS, EXAM, or OFFICE. The system shall display a message indicating that an active semester must be set before creating schedule entries.
- FR-04.6a: MEETING activity type entries are Academic Year-scoped, not semester-scoped. The active term guard (FR-04.6) SHALL require an active Academic Year but SHALL NOT require an active Semester for MEETING entries.

**Acceptance Criteria:**

- [ ] AC-1: When SHS has Academic Year "2025–2026" (Active) with 1st Semester (Active, Q1 End Date = August 15), Active Term Resolution for SHS returns all fields including q1_end_date = August 15.
- [ ] AC-2: When College has Academic Year "2025–2026" (Active) with 2nd Semester (Active), Active Term Resolution for College returns all fields without any quarter date fields.
- [ ] AC-3: When SHS has no Active Academic Year, Active Term Resolution for SHS returns null.
- [ ] AC-4: When College has an Active Academic Year but no Active Semester, Active Term Resolution returns the Academic Year info with null semester_id, semester_type, start_date, and end_date.
- [ ] AC-5: Attempting to create a CLASS schedule entry in a department with no active Semester displays: "An active semester must be set before creating schedule entries." and the entry is not created.
- [ ] AC-6: Attempting to create an EXAM schedule entry in a department with no active Semester is blocked with the same message.
- [ ] AC-7: Attempting to create an OFFICE schedule entry in a department with no active Semester is blocked with the same message.
- [ ] AC-8: When a department has an active Academic Year but no active Semester, creating a MEETING entry is allowed because MEETING entries are Academic Year-scoped.

---

### FR-05: Academic Calendar Management

**Description:** The Academic Calendar is an institution-wide feature that manages events affecting both SHS and College departments simultaneously. Events can mark holidays, exam periods, breaks, and institutional events. Blocking events create hard conflicts for any overlapping schedule entries in both departments. EXAM_PERIOD events define windows within which exam-type schedule entries should be placed; entries outside these windows receive soft conflict warnings.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-02, FR-03
**Related FRs:** FR-11

**Data Model Reference:** calendar_events ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

- FR-05.1: The system shall allow creation of a calendar event with the following fields: Title (minimum 2 characters), Event Type, Start Date/Time, End Date/Time, Academic Year (foreign key, optional), Semester (foreign key, optional), Description (optional text), Is All Day (boolean), and Is Blocking (boolean).
- FR-05.2: The Event Type field shall accept the following values: `HOLIDAY`, `EXAM_PERIOD`, `BREAK`, `INSTITUTIONAL_EVENT`, and `CUSTOM`.
- FR-05.3: The End Date/Time shall be strictly after the Start Date/Time. The system shall reject events where End â‰¤ Start.
- FR-05.4: The Title shall be unique within a given date range. The system shall reject creation of a calendar event with the same title and overlapping date range as an existing event.
- FR-05.5: All calendar events shall be institution-wide and shall apply to both SHS and College departments simultaneously. There shall be no department-specific calendar events.
- FR-05.6: When an event has `Is Blocking = true`, the system shall generate a `blocked_by_event` HARD conflict for all schedule entries in BOTH departments whose time slots overlap with the blocking event's date/time range.
- FR-05.7: Calendar events of type `EXAM_PERIOD` shall define exam windows. SHS exam schedule entries should fall within a blocking `EXAM_PERIOD` event for their respective quarter. College exam schedule entries should fall within a blocking `EXAM_PERIOD` event for their respective exam type.
- FR-05.8: Exam schedule entries that do not fall within an appropriate `EXAM_PERIOD` event shall receive an `exam_period_mismatch` SOFT conflict (warning, does not block saving).
- FR-05.9: The system shall allow editing of all calendar event fields (Title, Event Type, Start/End Date/Time, Academic Year, Semester, Description, Is All Day, Is Blocking).
- FR-05.10: When a calendar event is saved after editing, the system shall re-evaluate conflict flags for all DRAFT schedule entries in BOTH departments whose time slots overlap with the modified event's date/time range.
- FR-05.16: When a blocking calendar event is created, edited, or deleted, the system SHALL re-evaluate conflict flags for all DRAFT entries in BOTH departments whose time slots overlap the event's date/time range. PUBLISHED entry conflict flags are NOT updated immediately; they are updated only via the "Re-validate Published Schedule" action (see FR-11).
- FR-05.11: The system shall support soft deletion of calendar events. Deleted blocking events shall no longer trigger `blocked_by_event` conflicts.
- FR-05.12: The system shall provide a Calendar View displaying events in monthly, weekly, and daily views, showing institution-wide events combined with published schedule entries for the active department.
- FR-05.13: The Calendar View shall support filters by Academic Year, Semester, and Event Type.
- FR-05.14: The system shall provide a List View of calendar events in a tabular format with sortable columns: Title, Type, Start, End, and Is Blocking.
- FR-05.15: The List View shall support search and filtering by the sortable column values.
- FR-05.17: When an event has `is_all_day=true`, the system SHALL treat its effective time range as 00:00–23:59. The time picker fields SHALL be hidden in the UI when is_all_day is checked.
- FR-05.18: All-day blocking events SHALL create conflicts with all entries scheduled on the same date, regardless of time.

**Acceptance Criteria:**

- [ ] AC-1: Creating a calendar event with a title of 1 character is rejected (minimum 2 characters required).
- [ ] AC-2: Creating a calendar event with Title "Midterm Exams" from Oct 1â€“Oct 5, when an event titled "Midterm Exams" already exists from Oct 3â€“Oct 7, is rejected due to title uniqueness within overlapping date range.
- [ ] AC-3: A blocking HOLIDAY event from Dec 20â€“Jan 2 generates `blocked_by_event` HARD conflicts for all SHS and College schedule entries falling within that range.
- [ ] AC-4: A non-blocking INSTITUTIONAL_EVENT does not generate any hard conflicts for overlapping schedule entries.
- [ ] AC-5: An SHS Q1 Exam entry scheduled outside any `EXAM_PERIOD` event receives an `exam_period_mismatch` SOFT conflict warning.
- [ ] AC-6: A College Prelim Exam entry scheduled within a blocking `EXAM_PERIOD` event's date range does not receive an `exam_period_mismatch` conflict.
- [ ] AC-7: Editing a blocking event's date range from Oct 1â€“5 to Oct 1â€“3 triggers re-evaluation of conflicts for all DRAFT entries in both departments that previously overlapped Oct 1â€“5.
- [ ] AC-8: After soft-deleting a blocking HOLIDAY event, schedule entries that previously had `blocked_by_event` conflicts from that event no longer show those conflicts.
- [ ] AC-9: The Calendar View shows the same institution-wide events regardless of whether the department switcher is set to SHS or College.
- [ ] AC-10: Filtering the Calendar View by `EXAM_PERIOD` event type shows only exam period events and hides all other event types.
- [ ] AC-11: The List View can be sorted by Start Date in ascending and descending order.

- [ ] AC-12: When creating a calendar event, the form collects all required fields: Title, Event Type, Start Date/Time, End Date/Time, Is All Day, Is Blocking, and optional fields: Academic Year, Semester, Description.
- [ ] AC-13: When selecting Event Type for a calendar event, the available values are HOLIDAY, EXAM_PERIOD, BREAK, INSTITUTIONAL_EVENT, and CUSTOM.
- [ ] AC-14: When editing a calendar event, all fields (Title, Event Type, Start/End Date/Time, Academic Year, Semester, Description, Is All Day, Is Blocking) are editable.
- [ ] AC-15: When a blocking calendar event is created or edited, conflict flags are re-evaluated for all DRAFT entries in both departments that overlap the event; PUBLISHED entries are not updated.
- [ ] AC-16: When a blocking calendar event is deleted, conflict flags are removed from all DRAFT entries that previously conflicted with that event.
- [ ] AC-17: When creating a calendar event with is_all_day checked, the time picker fields are hidden and the event's effective time range is 00:00–23:59.
- [ ] AC-18: When a blocking all-day event is created on a date with schedule entries at various times (e.g., 8:00–9:00, 14:00–15:00), all entries on that date receive `blocked_by_event` HARD conflicts.

---

### FR-06: Room Management

**Description:** Rooms are physical spaces where schedule entries take place. Each room has a department availability setting that controls which departments can book it, and a status that affects scheduling eligibility. Room conflict detection operates cross-department for shared rooms. Rooms with active schedule entries are protected from deletion.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-01
**Related FRs:** FR-09, FR-10, FR-14, FR-15

**Data Model Reference:** rooms ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

- FR-06.1: The system shall allow creation of a room with the following fields: Room Code (unique system-wide), Room Name, Building, Floor, Capacity (positive integer), Room Type, Department Availability, Status, and Notes (optional text).
- FR-06.2: The Room Type field shall accept the following values: `LECTURE`, `LAB`, `GYM`, `OFFICE`, and `OTHER`.
- FR-06.3: The Department Availability field shall accept the following values: `SHS_ONLY`, `COLLEGE_ONLY`, and `SHARED`.
- FR-06.4: The Status field shall accept the following values: `AVAILABLE`, `MAINTENANCE`, and `INACTIVE`.
- FR-06.5: The Room Code shall be unique across the entire system (both departments). The system shall reject creation of a room with a Room Code that already exists.
- FR-06.6: The Capacity shall be a positive integer (â‰¥ 1). The system shall reject zero or negative values.
- FR-06.7: When a room's Status is changed to `MAINTENANCE` or `INACTIVE`, the system shall re-run conflict detection on all DRAFT schedule entries (in both departments) that are assigned to that room and flag them accordingly. PUBLISHED entry conflict flags are updated only via the 'Re-validate Published Schedule' action (see FR-11).
- FR-06.8: The system shall support soft deletion of rooms. A room with any active (DRAFT or PUBLISHED) schedule entries in any current semester shall not be deletable. The system shall display an error instructing the user to set the room to `INACTIVE` instead.
- FR-06.9: The system shall provide a searchable and filterable list of rooms with the following columns: Room Code, Room Name, Building, Capacity, Room Type, Status, and Schedule Count (number of active entries assigned to the room).
- FR-06.10: The room list shall support filters by Building, Room Type, and Status.
- FR-06.11: The system shall provide a Room Schedule View displaying a weekly grid of published schedule entries for a selected room, with day-of-week columns and time-slot rows.
- FR-06.12: Before changing a room's status to MAINTENANCE or INACTIVE, the system SHALL display a confirmation dialog showing the count of draft entries that will be affected. The dialog message SHALL read: 'Changing this room to [status] will create conflicts on N draft entries. Continue?'

**Acceptance Criteria:**

- [ ] AC-1: Creating two rooms with the same Room Code (e.g., "RM-101") is rejected on the second attempt with a uniqueness error, even if they belong to different department availabilities.
- [ ] AC-2: Creating a room with Capacity = 0 is rejected. Creating a room with Capacity = -5 is rejected. Creating a room with Capacity = 1 succeeds.
- [ ] AC-3: A room with Department Availability `SHS_ONLY` does not appear in room selection when creating a schedule entry under the College department context.
- [ ] AC-4: A room with Department Availability `SHARED` appears in room selection for both SHS and College department contexts.
- [ ] AC-5: Changing a room's status from `AVAILABLE` to `MAINTENANCE` flags all DRAFT and PUBLISHED entries using that room across both departments with a conflict.
- [ ] AC-6: Attempting to soft-delete a room that has 3 PUBLISHED entries in the current semester is rejected with a message instructing to set the room to INACTIVE instead.
- [ ] AC-7: Soft-deleting a room that has zero active entries in any current semester succeeds.
- [ ] AC-8: The Room Schedule View for a SHARED room shows entries from both SHS and College departments.
- [ ] AC-9: The room list Schedule Count column accurately reflects the number of DRAFT + PUBLISHED entries assigned to each room.
- [ ] AC-10: Filtering the room list by Building = "Main Building" and Status = "AVAILABLE" returns only rooms matching both criteria.
- [ ] AC-11: When the admin changes a room's status to MAINTENANCE and 4 draft entries use that room, a confirmation dialog displays: 'Changing this room to MAINTENANCE will create conflicts on 4 draft entries. Continue?'

---

### FR-07: Section Management

**Description:** Sections represent student groupings that attend scheduled classes. SHS uses the Homeroom model (fixed cohort attending all subjects together), while College uses the Course model (section per subject with individual enrollment). Sections are scoped to a specific department, Academic Year, and Semester, with unique codes within that scope. Sections with active schedule entries are protected from deletion.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-01, FR-02, FR-03
**Related FRs:** FR-09, FR-10, FR-14, FR-15

**Data Model Reference:** sections ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

- FR-07.1: The system shall allow creation of an SHS Homeroom section with the following fields: Department (fixed as `SHS`), Section Code, Section Name, Strand/Track, Year Level (`Grade 11` or `Grade 12`), Student Count, Adviser (foreign key to Personnel, optional), Academic Year (foreign key), Semester (foreign key), and Status.
- FR-07.2: The system shall allow creation of a College Course section with the following fields: Department (fixed as `COLLEGE`), Section Code, Section Name, Course/Program, Subject, Year Level, Student Count, Academic Year (foreign key), Semester (foreign key), and Status.
- FR-07.3: Section Code shall be unique within the combination of Department + Academic Year + Semester. The system shall reject duplicate Section Codes within the same scope.
- FR-07.4: Student Count shall be a non-negative integer (â‰¥ 0). The system shall reject negative values.
- FR-07.5: The system shall allow editing of all section fields. When Student Count is changed, the system shall re-evaluate `capacity_exceeded` conflicts for all DRAFT schedule entries assigned to that section (comparing Student Count to the assigned room's Capacity). PUBLISHED entry conflict flags are updated only via the 'Re-validate Published Schedule' action (see FR-11).
- FR-07.6: The system shall support soft deletion of sections. Sections that have active schedule entries (DRAFT or PUBLISHED) in the current semester shall not be deletable.
- FR-07.7: The system shall display SHS sections in a list with columns: Section Code, Section Name, Strand/Track, Year Level, Student Count, Adviser, Status, and Schedule Entry Count.
- FR-07.8: The system shall display College sections in a list with columns: Section Code, Section Name, Course/Program, Subject, Year Level, Student Count, Status, and Schedule Entry Count.
- FR-07.9: Section lists shall support filters by Academic Year, Semester, Strand/Program, Year Level, and Status.
- FR-07.10: The system shall provide a Section Schedule View displaying a weekly grid of published schedule entries for a selected section.
- FR-07.11: For SHS Homeroom sections, the Section Schedule View shall display the full weekly timetable across all subjects assigned to that section.
- FR-07.12: For College Course sections, the Section Schedule View shall display only the schedule for that specific subject section.

**Acceptance Criteria:**

- [ ] AC-1: Creating two SHS sections with Section Code "G11-STEM-A" under the same Academic Year and Semester is rejected on the second attempt.
- [ ] AC-2: Creating an SHS section with Section Code "G11-STEM-A" under Academic Year "2025â€“2026" 1st Semester, and another with the same code under "2025â€“2026" 2nd Semester, both succeed (different semester scope).
- [ ] AC-3: Creating a section with Student Count = -1 is rejected. Student Count = 0 is accepted.
- [ ] AC-4: Changing a section's Student Count from 30 to 50, when assigned to a room with Capacity 40, triggers a `capacity_exceeded` conflict on the affected entries.
- [ ] AC-5: Attempting to soft-delete a section that has 2 DRAFT entries in the current semester is rejected.
- [ ] AC-6: Soft-deleting a section with no active schedule entries succeeds.
- [ ] AC-7: The SHS section list shows an Adviser column; the College section list does not show an Adviser column but shows Course/Program and Subject columns instead.
- [ ] AC-8: An SHS Section Schedule View for "Grade 11 â€“ STEM A" displays entries for Math, Science, English, and all other subjects assigned to the cohort in one weekly grid.
- [ ] AC-9: A College Section Schedule View for "BSCS 101 â€“ Section A" displays only the schedule entries for that specific subject section.
- [ ] AC-10: Filtering sections by Year Level = "Grade 11" shows only Grade 11 sections and hides Grade 12 and College sections.

---

### FR-08: Personnel Management

**Description:** Personnel records represent the faculty, staff, and administrators who can be assigned to schedule entries. Each person belongs to a primary department but may be shared across departments. The system tracks weekly workload against configurable maximum hours and detects overload conditions across all departments when personnel are shared.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-01
**Related FRs:** FR-09, FR-10, FR-14, FR-15, FR-16

**Data Model Reference:** personnel ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

- FR-08.1: The system shall allow creation of a personnel record with the following fields: Employee ID (unique system-wide), First Name, Last Name, Email (unique system-wide), Department (`SHS` or `COLLEGE`), Is Shared (boolean), Personnel Type, Specializations (multi-select, optional), Max Weekly Hours (default 40, valid range 1â€“80), and Status (`ACTIVE` or `INACTIVE`).
- FR-08.2: The Personnel Type field shall accept the following values: `FACULTY`, `STAFF`, and `ADMIN`.
- FR-08.3: Employee ID shall be unique across the entire system. The system shall reject creation of a personnel record with an Employee ID that already exists.
- FR-08.4: Email shall be unique across the entire system. The system shall reject creation of a personnel record with an Email that already exists.
- FR-08.5: Max Weekly Hours shall accept values in the range 1â€“80 (inclusive). The system shall reject values less than 1 or greater than 80.
- FR-08.6: The system shall allow editing of all personnel fields. When Max Weekly Hours is changed, the system shall re-evaluate `personnel_overload` conflicts for all DRAFT schedule entries assigned to that person in the current semester across ALL departments (both SHS and College if shared). PUBLISHED entry conflict flags are updated only via the 'Re-validate Published Schedule' action (see FR-11).
- FR-08.7: The system shall support soft deletion of personnel. Personnel who have active schedule entries (DRAFT or PUBLISHED) in any current semester (across all departments) shall not be deletable.
- FR-08.8: The system shall provide a searchable and filterable list of personnel with the following columns: Employee ID, Name (First + Last), Department, Is Shared, Personnel Type, Specializations, Max Weekly Hours, Current Weekly Load (computed from assigned entries), and Status.
- FR-08.9: The personnel list shall support filters by Department, Is Shared, Personnel Type, Status, and Specialization.
- FR-08.10: The system shall provide a Personnel Schedule View displaying a weekly grid of published schedule entries for a selected person across ALL departments (not filtered by the active department context), showing Section, Subject, Room, Time Slot, and a Department Badge indicating which department each entry belongs to.
- FR-08.11: Before changing a personnel's max_weekly_hours to a lower value, the system SHALL display a confirmation dialog showing the count of draft entries that will be affected by potential overload conflicts.

**Acceptance Criteria:**

- [ ] AC-1: Creating two personnel records with the same Employee ID is rejected on the second attempt.
- [ ] AC-2: Creating two personnel records with the same Email address is rejected on the second attempt.
- [ ] AC-3: Creating a personnel record with Max Weekly Hours = 0 is rejected. Max Weekly Hours = 1 is accepted. Max Weekly Hours = 80 is accepted. Max Weekly Hours = 81 is rejected.
- [ ] AC-4: A personnel record with `is_shared=true` and primary department SHS can be assigned to schedule entries in both SHS and College departments.
- [ ] AC-5: A personnel record with `is_shared=false` and department SHS cannot be assigned to a College schedule entry.
- [ ] AC-6: Changing a person's Max Weekly Hours from 40 to 20, when they have 30 hours of entries in the current semester, triggers a `personnel_overload` conflict on the affected entries.
- [ ] AC-7: The `personnel_overload` calculation includes entries from both SHS and College departments for shared personnel.
- [ ] AC-8: Attempting to soft-delete a person who has 1 PUBLISHED entry in the current SHS semester is rejected.
- [ ] AC-9: Attempting to soft-delete a shared person who has 0 SHS entries but 2 DRAFT College entries in the current semester is rejected.
- [ ] AC-10: Soft-deleting a person with no active entries in any current semester succeeds.
- [ ] AC-11: The Personnel Schedule View for a shared person shows entries from both SHS and College, each with a visible department badge (e.g., "SHS" or "COLLEGE" label).
- [ ] AC-12: The Personnel Schedule View is not filtered by the department switcher â€” it always shows all departments.
- [ ] AC-13: Filtering the personnel list by Is Shared = true shows only personnel marked as shared.
- [ ] AC-14: The Current Weekly Load column accurately reflects the total hours from all DRAFT + PUBLISHED entries in the current semester for each person.
- [ ] AC-15: When the admin reduces a person's Max Weekly Hours from 40 to 20, and they have 30 hours of draft entries, a confirmation dialog displays the count of draft entries that will be affected by potential overload conflicts.



### FR-09: Schedule Entry Management

**Description:** Schedule entries are the core data objects of the system. Each entry represents a time-blocked assignment of personnel, room, and section(s) to an activity within a specific academic term. Entries are created within the active department's draft set, validated against all conflict detectors, and persisted as DRAFT status pending publication. The system supports 11 recurrence patterns to express repeating schedules, and enforces department-specific business rules on creation, update, deletion, and dry-run validation.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-01, FR-02, FR-03, FR-06, FR-07, FR-08
**Related FRs:** FR-10, FR-11, FR-12, FR-13, FR-14

**Data Model Reference:** schedule_entries, schedule_audit_log ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

*Create Entry:*
- FR-09.1: The system SHALL allow creation of a schedule entry within the active department's draft set.
- FR-09.2: Each entry SHALL capture the following fields: Activity Type (CLASS, EXAM, OFFICE, MEETING, EVENT, MAINTENANCE), Room (FK, optional when modality is ONLINE), Personnel (FK, required), Section(s) (FK, multi-select â€” all must belong to the same department), Subject, Modality (F2F or ONLINE), Recurrence Pattern, Academic Year (FK), Semester (FK), and Notes (optional).
- FR-09.3: The system SHALL validate that End Time is strictly greater than Start Time; reject with a validation error otherwise.
- FR-09.3a: A single schedule entry SHALL NOT span across midnight. Both start_time and end_time must refer to times within the same calendar day.
- FR-09.3b: The system SHALL display a warning toast if an entry's start_time or end_time falls outside the configured time_slot_start / time_slot_end window (defined in app_settings). The entry SHALL still be allowed.
- FR-09.4: The system SHALL enforce that entries with modality F2F have a Room assigned; reject F2F entries without a Room.
- FR-09.5: The system SHALL validate that all selected sections belong to the same department; reject if any section belongs to a different department.
- FR-09.5a: The system SHALL validate that all selected sections belong to the same Academic Year and Semester as the entry. Cross-semester section assignment SHALL be rejected with a validation error.
- FR-09.6: The system SHALL resolve the active Semester for the active department; if no semester is currently active, the system SHALL reject the entry with an error indicating no active semester exists.
- FR-09.7: The system SHALL run the full conflict detection engine (all 15 detectors per FR-10) on the entry after field validation passes.
- FR-09.8: If any HARD conflict is detected, the system SHALL block the save unless the user provides `isOverride=true` with a textual reason.
- FR-09.9: On successful creation, the system SHALL insert the entry with status DRAFT.
- FR-09.10: On successful creation, the system SHALL create an audit record with action CREATE per FR-12.

*Time Slot Alignment:*
- FR-09.24: The entry's start_time SHALL align to time slot boundaries calculated from time_slot_start at intervals of the department's period_length (e.g., for period_length=60 and time_slot_start=07:00, valid start times are 07:00, 08:00, 09:00...). Start times that do not align to a boundary SHALL be rejected with a validation error.
- FR-09.25: The entry's end_time SHALL be auto-calculated as start_time plus the department's period_length. The admin MAY manually override end_time, but the resulting duration SHALL be a positive integer multiple of the department's period_length.

*Field Dependency Matrix:*
- FR-09.26: The schedule entry form fields SHALL vary by Activity Type according to the following dependency matrix:

| Field | CLASS | EXAM | MEETING | OFFICE |
|---|---|---|---|---|
| Subject | Required | Optional | Hidden | Hidden |
| Section(s) | Required | Required | Optional | Optional |
| Room | Required for F2F | Always Required | Optional | Optional |
| Exam Type | Hidden | Required | Hidden | Hidden |
| Exam Title | Hidden | Required | Hidden | Hidden |
| Recurrence | Any pattern | Locked to ONCE | Any pattern | Any pattern |

- FR-09.27: When Activity Type is EXAM, the system SHALL lock the recurrence_pattern to ONCE and disable the recurrence pattern selector.
- FR-09.28: The entry's subject field SHALL be a free-text string. The system SHALL NOT maintain a master subject list. The subject field is used for display, search, and specialization matching only.

*Clone and Quick-Add:*
- FR-09.29: The system SHALL provide a clone/duplicate action for any existing schedule entry. Cloning SHALL create a copy of all entry fields (except id and timestamps) as a new DRAFT entry, then open the entry form for editing before save.
- FR-09.30: The system SHALL provide a quick-add mode in the entry form. When enabled, the form SHALL remain populated with the previous entry's field values after a successful save, allowing rapid creation of similar entries.

*Entry Detail View:*
- FR-09.31: The system SHALL provide a read-only detail panel or modal for schedule entries displaying all entry fields, current conflict flags with details, and audit history for the entry.

*Recurrence Clarifications:*
- FR-09.11a: For the MONTHLY_DATE pattern, if a month has fewer days than the specified day_of_month, no occurrence SHALL be generated for that month (explicit skip behavior).
- FR-09.20a: Dry-run validation SHALL mirror save-time validation exactly: the same detectors, same scope, same thresholds. The only difference is that no data is persisted.

*Recurrence Patterns:*
- FR-09.11: The system SHALL support the following 11 recurrence patterns:

| Pattern Code | Label | Description | Required Fields |
|---|---|---|---|
| ONCE | One-Time | Single specific date | start_date |
| DAILY | Every Day | Every calendar day in range | start_date, end_date |
| WEEKDAYS | Every Weekday (Monâ€“Fri) | Monday through Friday in range | start_date, end_date |
| WEEKLY | Weekly (specific day) | Once per week on chosen day | day_of_week, start_date, end_date |
| BI_WEEKLY | Every Two Weeks | Every other week on chosen day | day_of_week, start_date, end_date |
| MWF | Mon / Wed / Fri | Monday, Wednesday, Friday in range | start_date, end_date |
| TTH | Tue / Thu | Tuesday, Thursday in range | start_date, end_date |
| MTH | Mon / Thu | Monday, Thursday in range | start_date, end_date |
| MONTHLY_DATE | Monthly (same date) | Same calendar date each month | day_of_month (1â€“31), start_date, end_date |
| MONTHLY_DAY | Monthly (same weekday) | Same Nth weekday each month | day_of_week, week_of_month (1â€“4), start_date, end_date |
| CUSTOM | Custom Days | Arbitrary set of weekdays | custom_days (array of 0â€“6), start_date, end_date |

- FR-09.12: For recurring entries (all patterns except ONCE), the system SHALL expand all occurrences within the semester date range and check each occurrence against existing entries using the conflict detection engine.
- FR-09.13: If a single expanded occurrence triggers a conflict, the system SHALL flag the entire entry as conflicted.
- FR-09.14: Entries with Activity Type EXAM SHALL be locked to recurrence pattern ONCE; the system SHALL reject any EXAM entry with a recurrence pattern other than ONCE.

*Update Entry:*
- FR-09.15: The system SHALL allow updates only to entries with status DRAFT; attempts to update a PUBLISHED entry SHALL be rejected.
- FR-09.16: On update, the system SHALL re-run the full conflict detection engine (all 15 detectors) against the modified entry data.
- FR-09.17: On successful update, the system SHALL create an audit record with action UPDATE, capturing before and after snapshots.

*Delete Entry:*
- FR-09.18: The system SHALL perform soft deletion only, setting `is_active=0` on the entry.
- FR-09.19: The system SHALL allow deletion only of entries with status DRAFT; attempts to delete a PUBLISHED entry SHALL be rejected.
- FR-09.20: On successful deletion, the system SHALL create an audit record with action DELETE.

*Dry-Run Validation:*
- FR-09.21: The system SHALL provide a dry-run validation mode that validates entry data and runs all conflict detectors without persisting the entry to the database.
- FR-09.22: Dry-run validation SHALL return all conflict flags for all expanded recurrence occurrences.

*Unsaved Changes Protection:*
- FR-09.23: The system SHALL prompt the admin with an unsaved-changes confirmation dialog if they attempt to navigate away or close the application while the draft entry form has unsaved modifications.

**Acceptance Criteria:**
- [ ] AC-1: Creating an entry with Activity Type CLASS, modality F2F, a valid Room, Personnel, single Section, subject, recurrence WEEKLY, and active Semester succeeds and persists with status DRAFT.
- [ ] AC-2: Creating an entry with modality F2F and no Room returns a validation error; no entry is created.
- [ ] AC-3: Creating an entry with modality ONLINE and no Room succeeds.
- [ ] AC-4: Creating an entry where End Time â‰¤ Start Time returns a validation error; no entry is created.
- [ ] AC-5: Creating an entry with sections from two different departments returns a validation error.
- [ ] AC-6: Creating an entry when no semester is active for the department returns an error indicating no active semester.
- [ ] AC-7: Creating an entry that triggers a HARD conflict without `isOverride=true` is blocked; the conflict details are returned.
- [ ] AC-8: Creating an entry that triggers a HARD conflict with `isOverride=true` and a reason succeeds; an OVERRIDE audit record is created.
- [ ] AC-9: An EXAM entry with recurrence pattern WEEKLY is rejected with a validation error stating exams must use ONCE.
- [ ] AC-10: A WEEKLY recurring entry correctly expands all occurrences within the semester range; a conflict on any single occurrence flags the entire entry.
- [ ] AC-11: Updating a DRAFT entry re-runs conflict detection and creates an UPDATE audit record with before/after snapshots.
- [ ] AC-12: Attempting to update a PUBLISHED entry returns an error; no changes are made.
- [ ] AC-13: Deleting a DRAFT entry sets `is_active=0` and creates a DELETE audit record.
- [ ] AC-14: Attempting to delete a PUBLISHED entry returns an error.
- [ ] AC-15: Dry-run validation returns conflict flags for all expanded occurrences without persisting any data.
- [ ] AC-16: Each of the 11 recurrence patterns generates the correct set of dates within the specified range.
- [ ] AC-17: When a MONTHLY_DATE entry with day_of_month=31 is expanded, months with fewer than 31 days generate no occurrence for that month (skip behavior).
- [ ] AC-18: Creating an entry with start_time=22:00 and end_time=01:00 (spanning midnight) is rejected.
- [ ] AC-19: Creating an entry with start_time=06:00 (before configured time_slot_start of 07:00) shows a warning toast but the entry is allowed.
- [ ] AC-20: Creating an entry with sections from a different semester than the entry's semester_id returns a validation error.
- [ ] AC-21: Navigating away from the draft entry form with unsaved changes shows a confirmation dialog.

- [ ] AC-22: When creating an entry with start_time at 23:00 and end_time at 01:00 (crossing midnight), the system rejects with a validation error indicating entries cannot span midnight.
- [ ] AC-23: When creating an entry with start_time before the configured time_slot_start, the system displays a warning toast but allows the entry to be saved.
- [ ] AC-24: When creating an entry with sections from different semesters within the same department, the system rejects with a cross-semester validation error.
- [ ] AC-25: When creating a recurring WEEKLY entry, the system expands all occurrences within the semester date range and checks each occurrence against the conflict detection engine.
- [ ] AC-26: When navigating away from the draft entry form with unsaved modifications, the system displays an unsaved-changes confirmation dialog.
- [ ] AC-27: When creating an entry with start_time 07:30 and period_length 60 (slot boundaries 07:00, 08:00...), the system rejects with a time slot alignment error.
- [ ] AC-28: When creating an entry with start_time 08:00 and period_length 60, the end_time auto-calculates to 09:00.
- [ ] AC-29: When manually overriding end_time to 09:30 (1.5 periods), the system rejects because duration is not an integer multiple of period_length.
- [ ] AC-30: When Activity Type is CLASS, the subject field is required and the exam_type field is hidden.
- [ ] AC-31: When Activity Type is EXAM, the recurrence pattern is locked to ONCE and the exam_type field is required.
- [ ] AC-32: When Activity Type is MEETING, the section field is optional and the subject field is hidden.
- [ ] AC-33: When cloning an existing entry, a new DRAFT entry is created with all fields copied except id and timestamps, and the form opens for editing.
- [ ] AC-34: When quick-add mode is enabled and an entry is saved, the form retains previous field values for rapid creation of the next entry.
- [ ] AC-35: When viewing an entry's detail panel, all fields, conflict flags, and audit history are displayed in read-only format.
- [ ] AC-36: When MONTHLY_DATE with day_of_month=31 is expanded for February, no occurrence is generated for February.

---

### FR-10: Conflict Detection Engine

**Description:** The conflict detection engine enforces scheduling integrity by running 15 specialized detectors against every schedule entry on create, update, and publish submission. Each detector evaluates a specific constraint and returns a conflict flag with severity HARD or SOFT. HARD conflicts block save/publish unless explicitly overridden with a recorded reason. SOFT conflicts produce warnings but do not block operations. Certain detectors operate cross-department to prevent global resource collisions (rooms, shared personnel).

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-06, FR-07, FR-08, FR-09
**Related FRs:** FR-11

**Data Model Reference:** schedule_entries ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**
- FR-10.1: The system SHALL execute all 15 conflict detectors on every schedule entry create, update, and publish submission.
- FR-10.2: Each detector SHALL return a conflict flag containing: detector code, severity (HARD or SOFT), a human-readable description, and the conflicting entry ID(s) where applicable.
- FR-10.3: The system SHALL implement the following 15 detectors:

| # | Detector | Code | Severity | Cross-Dept? | Description |
|---|---|---|---|---|---|
| 1 | Room Conflict | room_conflict | HARD | Yes | Same room, overlapping time â€” checked across both departments |
| 2 | Personnel Conflict | personnel_conflict | HARD | For shared | Same personnel, overlapping time â€” shared personnel checked across both departments |
| 3 | Section Conflict | section_conflict | HARD | Same dept | Same section, overlapping time |
| 4 | Blocked by Calendar Event | blocked_by_event | HARD | Both | Entry overlaps a blocking institution-wide calendar event |
| 5 | Personnel Weekly Overload | personnel_overload | HARD | Global | Total weekly hours across all departments exceed personnel's Max Weekly Hours cap; triggers when >100% |
| 6 | Room Capacity Exceeded | capacity_exceeded | SOFT | No | Room capacity is less than total student count across all assigned sections |
| 7 | Workload Approaching | workload_approaching | SOFT | Global | Personnel workload is 80â€“100% of Max Weekly Hours cap |
| 8 | Specialization Mismatch | specialization_mismatch | SOFT | No | Subject is not in the personnel's listed specializations |
| 9 | Room Unavailable | room_unavailable | HARD | Yes | Room status is MAINTENANCE or INACTIVE |
| 10 | Room Department Mismatch | room_dept_mismatch | HARD | Yes | Room's department_availability restricts it to the other department |
| 11 | Personnel Department Mismatch | personnel_dept_mismatch | SOFT | Yes | Non-shared personnel assigned to a department other than their own |
| 12 | Exam Period Mismatch | exam_period_mismatch | SOFT | Both | EXAM-type entry falls outside any blocking EXAM_PERIOD calendar event |
| 13 | SHS Quarter Mismatch | exam_quarter_mismatch | SOFT | SHS only | SHS EXAM entry date falls outside the expected quarter date window |
| 14 | Personnel Inactive | personnel_inactive | HARD | No | Personnel status is INACTIVE |
| 15 | Section Inactive | section_inactive | HARD | No | Section status is INACTIVE |

- FR-10.4: The Room Conflict detector (room_conflict) SHALL check for overlapping time across both SHS and College departments for the same room.
- FR-10.5: The Personnel Conflict detector (personnel_conflict) SHALL check across both departments when the personnel record has `is_shared=true`; for non-shared personnel, it SHALL check within the personnel's own department only.
- FR-10.6: The Section Conflict detector (section_conflict) SHALL check within the same department only.
- FR-10.7: The Blocked by Calendar Event detector (blocked_by_event) SHALL check against all calendar events where `is_blocking=true`, regardless of department.
- FR-10.8: The Personnel Weekly Overload detector (personnel_overload) SHALL sum total assigned weekly hours across all departments and flag as HARD when the total exceeds 100% of the personnel's `max_weekly_hours`.
- FR-10.9: The Room Capacity Exceeded detector (capacity_exceeded) SHALL compare the room's `capacity` against the sum of `student_count` from all sections assigned to the entry.
- FR-10.10: The Workload Approaching detector (workload_approaching) SHALL flag as SOFT when personnel's total weekly hours are between 80% and 100% (inclusive) of their `max_weekly_hours`.
- FR-10.11: The Specialization Mismatch detector (specialization_mismatch) SHALL compare the entry's subject against the personnel's `specializations` JSON array.
- FR-10.12: The Room Unavailable detector (room_unavailable) SHALL flag any entry assigned to a room with status MAINTENANCE or INACTIVE.
- FR-10.13: The Room Department Mismatch detector (room_dept_mismatch) SHALL flag when a room with `department_availability` of SHS_ONLY is used by College, or COLLEGE_ONLY is used by SHS.
- FR-10.14: The Personnel Department Mismatch detector (personnel_dept_mismatch) SHALL flag when non-shared personnel (`is_shared=false`) are assigned to a department other than their own.
- FR-10.15: The Exam Period Mismatch detector (exam_period_mismatch) SHALL flag EXAM entries that do not fall within any blocking calendar event of type EXAM_PERIOD.
- FR-10.16: The SHS Quarter Mismatch detector (exam_quarter_mismatch) SHALL flag SHS EXAM entries whose date does not fall within the expected quarter date window as defined by semester quarter boundaries (q1_end_date, q3_end_date).

*Conflict Override:*
- FR-10.17: The system SHALL allow HARD conflicts to be overridden when the user provides `isOverride=true` and a textual `override_reason`.
- FR-10.18: Every conflict override SHALL be recorded in the audit log with action OVERRIDE, including the override reason and the conflict snapshot.
- FR-10.19: If the override reason is fewer than 10 characters, the system SHALL display a warning toast: "Please provide a meaningful reason for audit purposes." The override SHALL still proceed.

*Evaluation Scope:*
- FR-10.20: Each detector SHALL evaluate the entry against both DRAFT and PUBLISHED entries within the defined scope. The evaluation scope per detector is:
  - room_conflict: All entries in both departments assigned to the same room
  - personnel_conflict: All entries for shared personnel in both departments; all entries for non-shared personnel in their own department only
  - section_conflict: All entries in the same department and same semester
  - blocked_by_event: All blocking calendar events regardless of department
  - personnel_overload: All entries for the personnel across both departments (global sum)
  - capacity_exceeded: The entry's own room capacity vs. sum of section student counts
  - workload_approaching: Same as personnel_overload (global sum, 80-100%)
  - specialization_mismatch: The entry's subject vs. the assigned personnel's specializations (case-insensitive comparison)
  - room_unavailable: The assigned room's status field
  - room_dept_mismatch: The assigned room's department_availability vs. the entry's department
  - personnel_dept_mismatch: The assigned personnel's department and is_shared flag vs. the entry's department
  - exam_period_mismatch: All blocking EXAM_PERIOD calendar events
  - exam_quarter_mismatch: The entry's date vs. SHS semester quarter boundaries
  - personnel_inactive: The assigned personnel's status field
  - section_inactive: The assigned section(s)' status field

*Conflict Flag Shape:*
- FR-10.21: The conflict_flags column on schedule_entries SHALL be a JSON array where each element has the shape: `{ "detector": "<detector_code>", "severity": "HARD|SOFT", "conflicting_entry_id": "<uuid|null>", "message": "<human-readable description>" }`. The array SHALL be overwritten (not appended) on each detection run.

*Resource Mutation Cascade:*
- FR-10.22: When a resource is mutated in a way that affects conflict state, the system SHALL re-evaluate all affected DRAFT entries and update their conflict_flags. Specifically:
  - Room status change (AVAILABLE ↔ MAINTENANCE/INACTIVE): re-run room_unavailable on all DRAFT entries assigned to that room
  - Room department_availability change: re-run room_dept_mismatch on all DRAFT entries assigned to that room
  - Personnel max_weekly_hours change: re-run personnel_overload and workload_approaching on all DRAFT entries for that personnel (cross-department)
  - Personnel status change: re-run personnel_inactive on all DRAFT entries for that personnel
  - Personnel is_shared change: re-run personnel_conflict and personnel_dept_mismatch on all DRAFT entries for that personnel
  - Section student_count change: re-run capacity_exceeded on all DRAFT entries containing that section
  - Section status change: re-run section_inactive on all DRAFT entries containing that section
  - Calendar event blocking change: re-run blocked_by_event on all DRAFT entries overlapping the event's time range
- FR-10.23: Resource mutation cascade SHALL only update DRAFT entries. PUBLISHED entries SHALL NOT be updated by automatic cascade; they are updated only through the Re-validate Published Schedule action (FR-11.19).

*Detector Sub-requirements:*
- FR-10.24: The Personnel Inactive detector (personnel_inactive) SHALL flag any entry assigned to personnel with status INACTIVE as a HARD conflict.
- FR-10.25: The Section Inactive detector (section_inactive) SHALL flag any entry with any assigned section having status INACTIVE as a HARD conflict.

**Acceptance Criteria:**
- [ ] AC-1: Creating two entries for the same room at the same time (even across different departments) triggers a room_conflict HARD flag.
- [ ] AC-2: Creating two entries for the same shared personnel at overlapping times across different departments triggers personnel_conflict HARD.
- [ ] AC-3: Creating two entries for the same non-shared personnel at overlapping times within the same department triggers personnel_conflict HARD.
- [ ] AC-4: Creating two entries for the same section at overlapping times triggers section_conflict HARD.
- [ ] AC-5: Creating an entry that overlaps a blocking calendar event triggers blocked_by_event HARD.
- [ ] AC-6: Assigning enough hours to exceed a personnel's max_weekly_hours (>100%) triggers personnel_overload HARD.
- [ ] AC-7: Assigning a room with capacity 30 to sections totaling 35 students triggers capacity_exceeded SOFT.
- [ ] AC-8: Assigning 85% of a personnel's max weekly hours triggers workload_approaching SOFT.
- [ ] AC-9: Assigning a subject not in the personnel's specializations triggers specialization_mismatch SOFT.
- [ ] AC-10: Assigning a room with status MAINTENANCE triggers room_unavailable HARD.
- [ ] AC-11: Assigning an SHS_ONLY room to a College entry triggers room_dept_mismatch HARD.
- [ ] AC-12: Assigning non-shared College personnel to an SHS entry triggers personnel_dept_mismatch SOFT.
- [ ] AC-13: An EXAM entry outside any EXAM_PERIOD calendar event triggers exam_period_mismatch SOFT.
- [ ] AC-14: An SHS Q1_EXAM entry with a date outside the Q1 date window triggers exam_quarter_mismatch SOFT.
- [ ] AC-15: Overriding a HARD conflict with a reason succeeds; the override is recorded in the audit log with the reason and conflict snapshot.
- [ ] AC-16: Attempting to save an entry with an unresolved HARD conflict and no override returns an error with all conflict details.
- [ ] AC-17: All 15 detectors execute on create, update, and publish submission.
- [ ] AC-18: Overriding a HARD conflict with reason "." (1 character) succeeds but displays a warning toast about providing a meaningful reason.
- [ ] AC-19: When assigning INACTIVE personnel to an entry, the system triggers personnel_inactive HARD conflict.
- [ ] AC-20: When assigning an INACTIVE section to an entry, the system triggers section_inactive HARD conflict.
- [ ] AC-21: When conflict_flags are stored on an entry, they follow the JSON shape { detector, severity, conflicting_entry_id, message }.
- [ ] AC-22: When a room's status changes from AVAILABLE to MAINTENANCE, all DRAFT entries assigned to that room have their conflict_flags updated with room_unavailable.
- [ ] AC-23: When a room's status changes from AVAILABLE to MAINTENANCE, PUBLISHED entries assigned to that room are NOT updated.
- [ ] AC-24: When personnel max_weekly_hours is reduced causing overload, all DRAFT entries for that personnel across both departments are re-evaluated.
- [ ] AC-25: When a section's status changes to INACTIVE, all DRAFT entries containing that section are flagged with section_inactive.
- [ ] AC-26: The specialization_mismatch detector performs case-insensitive comparison between the entry's subject and the personnel's specializations array.

---

### FR-11: Publish Workflow

**Description:** The publish workflow controls the lifecycle of schedule entries through two statuses: DRAFT and PUBLISHED. There is no approval step â€” publication is a direct action that transitions all draft entries for the active department in a single operation. Unpublishing reverses a published entry back to draft status. The system enforces that no unresolved HARD conflicts exist at publish time unless overridden.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-09, FR-10
**Related FRs:** FR-05, FR-06, FR-07, FR-08, FR-12, FR-13

**Data Model Reference:** schedule_entries, schedule_audit_log ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

*Draft Set:*
- FR-11.1: The draft set SHALL be scoped by the full active term triple: department + academic year + semester. Only DRAFT entries matching the currently active department, academic year, and semester SHALL appear in the draft builder view.
- FR-11.2: DRAFT entries from other semesters or academic years SHALL NOT appear in the current draft builder view; they persist in the database and are accessible by switching the active term.

*Publish:*
- FR-11.3: The system SHALL publish all DRAFT entries matching the active department + academic year + semester in a single atomic action.
- FR-11.3a: The publish action SHALL support selective publishing. The admin can select or deselect individual draft entries before initiating publish.
- FR-11.3b: Before publishing, the system SHALL display a pre-publish summary showing the count of selected entries, count with HARD conflicts, and count with SOFT conflicts.
- FR-11.4: Publishing SHALL require at least one DRAFT entry to exist; if no draft entries exist, the system SHALL return an error.
- FR-11.5: Before publishing, the system SHALL re-run the full conflict detection engine (all 15 detectors per FR-10) against all draft entries.
- FR-11.5a: The system SHALL perform clean-slate conflict re-validation at publish time. Prior conflict overrides from create/edit time are retained as historical audit records only and SHALL NOT carry forward to publish-time validation.
- FR-11.6: If any unresolved HARD conflicts are detected and not overridden, the system SHALL block the publish and return the list of blocked entries with their conflict details.
- FR-11.7: On successful publish, the system SHALL transition all qualifying DRAFT entries to PUBLISHED status.
- FR-11.8: On successful publish, the system SHALL create an audit record with action PUBLISH for each entry.
- FR-11.9: On successful publish, the system SHALL return the count of published entries and the list of any blocked entries.

*Unpublish:*
- FR-11.10: The system SHALL allow reverting a PUBLISHED entry back to DRAFT status.
- FR-11.11: On unpublish, the system SHALL create an audit record with action UNPUBLISH.
- FR-11.12: An unpublished entry SHALL re-enter the department's draft set and be fully editable.

*Bulk Unpublish:*
- FR-11.14: The system SHALL provide a "Bulk Unpublish" action that reverts ALL PUBLISHED entries for the active department + academic year + semester back to DRAFT in a single action.
- FR-11.15: Bulk Unpublish SHALL require a confirmation dialog before executing.
- FR-11.16: On Bulk Unpublish, the system SHALL create an UNPUBLISH audit record for each reverted entry.

*Unpublish Conflict Refresh:*
- FR-11.17: On unpublish (single or bulk), the system SHALL re-run conflict detection on the unpublished entry against the current state of all remaining entries.
- FR-11.18: On unpublish, the system SHALL also re-run conflict detection on all remaining DRAFT and PUBLISHED entries that share the same room, personnel, or sections as the unpublished entry, updating their conflict_flags.

*Re-validate Published Schedule:*
- FR-11.19: The system SHALL provide a "Re-validate Published Schedule" action in the schedule view that batch-refreshes conflict_flags for all PUBLISHED entries in the active department + academic year + semester.
- FR-11.20: Re-validation SHALL display a summary showing entries with new conflicts, resolved conflicts, and unchanged entries.
- FR-11.21: Re-validation SHALL NOT change any entry's PUBLISHED status; it only updates conflict_flags for informational display.

*Inactive Semester Guard:*
- FR-11.22: The system SHALL prevent publishing entries whose semester is inactive. If the admin attempts to publish in an inactive semester, the system SHALL display: "Activate this semester to publish entries."
- FR-11.23: The draft builder SHALL display drafts for the selected semester even if it is inactive, with a banner: "This semester is inactive. Activate it to publish these drafts."

*State Machine:*
- FR-11.13: The entry status state machine SHALL be: `[Initial] â†’ DRAFT â†’ (Publish) â†’ PUBLISHED â†’ (Unpublish) â†’ DRAFT`. No other status transitions are permitted.

**Acceptance Criteria:**
- [ ] AC-1: Publishing with at least one DRAFT entry and no unresolved HARD conflicts transitions all draft entries to PUBLISHED and returns the published count.
- [ ] AC-2: Publishing when no DRAFT entries exist returns an error indicating no entries to publish.
- [ ] AC-3: Publishing when a DRAFT entry has an unresolved HARD conflict blocks publish and returns the blocked entry with conflict details.
- [ ] AC-4: A PUBLISH audit record is created for each entry that transitions to PUBLISHED.
- [ ] AC-5: Unpublishing a PUBLISHED entry reverts it to DRAFT; an UNPUBLISH audit record is created.
- [ ] AC-6: An unpublished entry appears in the draft set and can be edited.
- [ ] AC-7: No status transitions other than DRAFTâ†’PUBLISHED and PUBLISHEDâ†’DRAFT are permitted.
- [ ] AC-8: Bulk Unpublish reverts all PUBLISHED entries for the active term to DRAFT and creates UNPUBLISH audit records for each.
- [ ] AC-9: Bulk Unpublish shows a confirmation dialog before executing.
- [ ] AC-10: Unpublishing an entry re-runs conflict detection on the unpublished entry and on all entries sharing the same room, personnel, or sections.
- [ ] AC-11: "Re-validate Published Schedule" updates conflict_flags on all PUBLISHED entries and displays a summary of changes.
- [ ] AC-12: Re-validation does not change any entry's PUBLISHED status.
- [ ] AC-13: Attempting to publish in an inactive semester displays: "Activate this semester to publish entries." and is blocked.
- [ ] AC-14: The draft builder shows drafts for an inactive semester with the inactive semester banner.
- [ ] AC-15: Switching from 1st Semester (Active) to 2nd Semester (Active) shows a different draft group.

- [ ] AC-16: When attempting to publish with zero DRAFT entries in the active draft set, the system displays a message indicating there are no entries to publish.
- [ ] AC-17: When publishing a draft set that includes entries with overridden HARD conflicts, the overrides and reasons are preserved in the published entries.
- [ ] AC-18: When an entry transitions from DRAFT to PUBLISHED, its status is updated and it becomes visible in all published schedule views.
- [ ] AC-19: When unpublishing a single PUBLISHED entry, its status reverts to DRAFT and it disappears from published schedule views.
- [ ] AC-20: When the Re-validate Published Schedule action is triggered, all PUBLISHED entries are re-checked against current conflict detectors and their flags are updated.
- [ ] AC-21: When publishing or unpublishing entries, the system creates audit records for each affected entry with the appropriate action.
- [ ] AC-22: When a batch unpublish is performed, all selected PUBLISHED entries revert to DRAFT atomically.
- [ ] AC-23: When viewing the published schedule, entries from both DRAFT and PUBLISHED states are distinguishable by their status badges.
- [ ] AC-24: When the admin opens the publish dialog, all draft entries are selected by default and a summary of conflict counts is displayed.
- [ ] AC-25: When the admin deselects entries with HARD conflicts and publishes, only the remaining selected entries are processed.
- [ ] AC-26: When publishing entries that previously had overridden HARD conflicts, the system re-runs all 15 detectors without considering prior overrides, requiring fresh override or resolution for any conflicts found.

---

### FR-12: Audit Trail

**Description:** The audit trail provides a complete, append-only log of all schedule mutations. Every create, update, delete, override, publish, and unpublish action is recorded with full before/after data snapshots and conflict context, enabling traceability and accountability for all scheduling decisions.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-09
**Related FRs:** FR-11

**Data Model Reference:** schedule_audit_log ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**
- FR-12.1: The system SHALL log every schedule entry mutation as an audit record in the `schedule_audit_log` table.
- FR-12.2: The system SHALL record the following actions: CREATE, UPDATE, DELETE, OVERRIDE, PUBLISH, UNPUBLISH.
- FR-12.3: Each audit record SHALL capture: Entry ID (FK to schedule_entries), Department, Action, Before Snapshot (JSON), After Snapshot (JSON), Conflict Snapshot (JSON), Override Reason (text, nullable), and Timestamp.
- FR-12.4: The Before Snapshot SHALL contain the full entry data prior to the mutation; for CREATE actions, this SHALL be null.
- FR-12.5: The After Snapshot SHALL contain the full entry data after the mutation; for DELETE actions, this SHALL be null.
- FR-12.6: The Conflict Snapshot SHALL contain all conflict flags active at the time of the mutation.
- FR-12.7: The audit log SHALL be append-only; no UPDATE or DELETE operations SHALL be permitted on the `schedule_audit_log` table.
- FR-12.8: Audit record creation SHALL be performed within the same database transaction as the schedule mutation it records.
- FR-12.9: The audit log SHALL be generalized to cover all entity mutations, not just schedule entries. The following entity types and actions SHALL be audited: Rooms (CREATE, UPDATE, DELETE), Sections (CREATE, UPDATE, DELETE), Personnel (CREATE, UPDATE, DELETE), Academic Years (CREATE, UPDATE, DELETE), Semesters (CREATE, UPDATE, DELETE), Calendar Events (CREATE, UPDATE, DELETE), Templates (CREATE, DELETE, APPLY), Import Jobs (COMMIT), Settings (UPDATE), Backup (CREATE, RESTORE).
- FR-12.10: The system SHALL provide a dedicated Audit Log page (route: /audit) with filters for: action type, department, date range, entity type, and entity ID.
- FR-12.11: The Audit Log page SHALL display before/after snapshots in a human-readable diff format.
- FR-12.12: The system SHALL enforce a configurable audit log retention period with a default of 24 months. Records older than the retention period MAY be archived to a JSON export file and then deleted. This is the only exception to the audit log's append-only rule.

**Acceptance Criteria:**
- [ ] AC-1: Creating a schedule entry produces an audit record with action CREATE, null before_snapshot, populated after_snapshot, and conflict_snapshot.
- [ ] AC-2: Updating a DRAFT entry produces an audit record with action UPDATE containing both before and after snapshots.
- [ ] AC-3: Deleting a DRAFT entry produces an audit record with action DELETE.
- [ ] AC-4: Overriding a HARD conflict produces an audit record with action OVERRIDE, the override_reason populated, and the conflict_snapshot.
- [ ] AC-5: Publishing an entry produces an audit record with action PUBLISH.
- [ ] AC-6: Unpublishing an entry produces an audit record with action UNPUBLISH.
- [ ] AC-7: Attempting to UPDATE or DELETE a row in `schedule_audit_log` fails.
- [ ] AC-8: Audit records are committed in the same transaction as their associated schedule mutation; if the mutation rolls back, no audit record is persisted.
- [ ] AC-9: When a Room is created, updated, or deleted, an audit record is created with entity_type=ROOM and the appropriate action.
- [ ] AC-10: When navigating to /audit, the Audit Log page displays with filters for action type, department, date range, entity type, and entity ID.
- [ ] AC-11: When viewing an audit record with both before and after snapshots, the system displays a human-readable diff showing changed fields.
- [ ] AC-12: When the audit log retention period is set to 24 months and records older than 24 months exist, the system archives them to a JSON file and deletes them from the database.

---

### FR-13: Examination Schedule

**Description:** Examination schedules are specialized schedule entries with Activity Type EXAM, subject to department-specific exam type validation. SHS uses quarterly exam types (Q1_EXAM through Q4_EXAM) tied to quarter boundaries within semesters. College uses positional exam types (PRELIM, MIDTERM, PRE_FINALS, FINALS) tied to semester position. Exam entries have a dedicated list view, calendar view, and participate in the same draft/publish workflow as regular entries.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-01, FR-02, FR-03, FR-09, FR-11
**Related FRs:** FR-04

**Data Model Reference:** schedule_entries, calendar_events ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

*Exam Types:*
- FR-13.1: SHS exam types SHALL be: Q1_EXAM, Q2_EXAM, Q3_EXAM, Q4_EXAM â€” each tied to a quarter within a semester.
- FR-13.2: College exam types SHALL be: PRELIM, MIDTERM, PRE_FINALS, FINALS â€” each tied to a position within a semester.
- FR-13.3: The exam type dropdown SHALL be filtered to show only the active department's allowed exam types.
- FR-13.4: The system SHALL reject saving an exam entry with an exam type belonging to the other department.

*Create Exam Entry:*
- FR-13.5: Creating an exam entry SHALL require: Activity Type=EXAM, Exam Title, Subject, Section(s) (all same department), Room (required), Proctor/Personnel, Start Date, Start Time, End Time, Recurrence=ONCE, Academic Year, Semester, and optional Notes.
- FR-13.6: Room SHALL be required for all exam entries regardless of any other field.
- FR-13.7: End Time SHALL be strictly greater than Start Time.
- FR-13.8: An active Semester must exist for the active department; the system SHALL reject the entry if none is active.
- FR-13.9: Recurrence SHALL be locked to ONCE for all exam entries; the system SHALL reject any other recurrence pattern.
- FR-13.10: For SHS exam entries, the system SHALL validate that the selected exam type's quarter is consistent with the entry date falling within the correct quarter date window (derived from q1_end_date and q3_end_date semester fields).

*Update and Delete:*
- FR-13.11: The system SHALL allow updates only to DRAFT exam entries; updates SHALL re-run conflict detection including department-specific exam validation.
- FR-13.12: The system SHALL allow soft deletion of DRAFT exam entries only.

*List View:*
- FR-13.13: The system SHALL provide a dedicated examination schedule list view, separate from the regular schedule list.
- FR-13.14: SHS exam list columns SHALL be: Exam Title, Subject, Section, Room, Proctor, Quarter (Q1â€“Q4), Exam Date, Start Time, End Time, Status, Conflicts.
- FR-13.15: College exam list columns SHALL be: Exam Title, Subject, Section, Room, Proctor, Exam Type (PRELIM/MIDTERM/PRE_FINALS/FINALS), Exam Date, Start Time, End Time, Status, Conflicts.
- FR-13.16: The exam list SHALL support filters: Academic Year, Semester, Section, Exam Type, Status.

*Calendar View:*
- FR-13.17: The system SHALL provide a calendar view (monthly and weekly) showing only exam entries for the active department, overlaid with blocking calendar events.

*Workflow:*
- FR-13.18: Exam entries SHALL participate in the same draft set and publish workflow as regular schedule entries per FR-11.

**Acceptance Criteria:**
- [ ] AC-1: Creating an SHS exam with type Q1_EXAM, a date within the Q1 window, Room assigned, and recurrence ONCE succeeds.
- [ ] AC-2: Creating an SHS exam with type Q1_EXAM and a date outside the Q1 window triggers exam_quarter_mismatch SOFT conflict.
- [ ] AC-3: Creating a College exam with type Q1_EXAM is rejected (wrong department's exam type).
- [ ] AC-4: Creating an exam entry without a Room returns a validation error.
- [ ] AC-5: Creating an exam entry with recurrence WEEKLY is rejected with an error stating exams must use ONCE.
- [ ] AC-6: The SHS exam list shows Quarter column; the College exam list shows Exam Type column.
- [ ] AC-7: Filters for Academic Year, Semester, Section, Exam Type, and Status correctly narrow the exam list.
- [ ] AC-8: The exam calendar view shows only EXAM entries and blocking calendar events.
- [ ] AC-9: Exam entries appear in the department's draft set and can be published/unpublished alongside regular entries.
- [ ] AC-10: Updating a DRAFT exam re-runs conflict detection with department-specific exam validation.
- [ ] AC-11: Deleting a DRAFT exam sets `is_active=0`; deleting a PUBLISHED exam is rejected.

- [ ] AC-12: When creating an SHS exam entry with type Q1_EXAM, the system validates that the entry date falls within the Q1 quarter window of the active semester.
- [ ] AC-13: When creating a College exam entry with type PRELIM outside an EXAM_PERIOD calendar event, the system flags an exam_period_mismatch SOFT conflict.
- [ ] AC-14: When creating an exam schedule entry, a Room is always required regardless of modality (F2F or ONLINE).
- [ ] AC-15: When creating an exam schedule entry, exactly one Personnel must be assigned.
- [ ] AC-16: When viewing the exam schedule list, entries can be filtered by department, semester, and exam type.
- [ ] AC-17: When creating an SHS exam entry with type Q3_EXAM under a 1st Semester, the system rejects because Q3 belongs to 2nd Semester.
- [ ] AC-18: When creating an exam entry with recurrence pattern other than ONCE, the system rejects with a validation error.

---

### FR-14: Schedule Templates

**Description:** Schedule templates allow users to save a published schedule as a reusable blueprint and apply it to future academic terms. Templates capture entry configurations (activity type, room, personnel, time, subject) without term-specific bindings, enabling rapid schedule construction for new semesters. Templates can be scoped to all entries, class-only, or exam-only, and can be edited independently of the source schedule.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-09
**Related FRs:** FR-06, FR-07, FR-08, FR-10

**Data Model Reference:** schedule_templates, schedule_template_entries, schedule_template_applications ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

*Save Template:*
- FR-14.1: The system SHALL allow saving a set of published entries as a named template.
- FR-14.2: The source entries must have status PUBLISHED; the system SHALL reject saving from unpublished entries.
- FR-14.3: The template SHALL require a Template Name with a minimum of 3 characters, unique system-wide.
- FR-14.4: The template SHALL accept an optional Description.
- FR-14.5: The template SHALL accept a Scope value: ALL_ENTRIES, CLASS_ONLY, or EXAM_ONLY. Only entries matching the scope SHALL be copied into the template.
- FR-14.6: On save, the system SHALL copy qualifying entries into the template, removing semester and academic year bindings.
- FR-14.7: The system SHALL store template metadata: source academic year label, source semester name, and created_at timestamp.
- FR-14.8: The template SHALL have a department_scope: SHS, COLLEGE, or CROSS_DEPARTMENT.

*List Templates:*
- FR-14.9: The template list SHALL display: Template Name, Description, Scope, Source Academic Year, Source Semester, Entry Count, Created At.
- FR-14.10: The template list SHALL support filtering by Scope.

*View Template Entries:*
- FR-14.11: The system SHALL provide a preview of all entries in a template, displayed in a table with columns: Activity Type, Subject, Section(s), Room, Personnel, Day of Week, Start Time, End Time.

*Edit Template:*
- FR-14.12: The system SHALL allow editing a template's name, description, and scope.
- FR-14.13: The system SHALL allow editing individual template entries: room, personnel, time, and subject.
- FR-14.14: The system SHALL allow deleting individual entries from a template.
- FR-14.15: Edits to a template SHALL NOT affect the original published schedule or any previously generated schedules from that template.

*Delete Template:*
- FR-14.16: The system SHALL perform soft deletion of templates (setting `is_active=0`).
- FR-14.17: Deleting a template SHALL NOT affect any schedules previously generated from it.

*Apply Template:*
- FR-14.18: The system SHALL allow applying a template to a target Academic Year and Semester.
- FR-14.19: On application, the system SHALL validate that the target semester exists; if entries already exist for that term, the system SHALL warn the user but not block application.
- FR-14.20: On application, the system SHALL clone each template entry, bind it to the target Academic Year and Semester, and set its status to DRAFT.
- FR-14.21: On application, the system SHALL run the full conflict detection engine against all existing entries for the target term.
- FR-14.22: On application, the system SHALL create a draft set with all generated entries.
- FR-14.23: On application, the system SHALL create audit records with template source reference for each generated entry.
- FR-14.24: The application output SHALL report: total entry count and conflict count.
- FR-14.25: Entries with HARD conflicts SHALL be flagged; the user must resolve or override them before publishing.
- FR-14.26: Template application SHALL be atomic â€” all entries and the application log record SHALL be committed in a single transaction.

*Post-Application Edit:*
- FR-14.27: Generated DRAFT entries from template application SHALL be fully editable and follow normal entry update rules per FR-09.

*Application History:*
- FR-14.28: The system SHALL log every template application: template ID, target academic year, target semester, timestamp, entry count, and conflict count.
- FR-14.29: Application history SHALL be viewable on the template detail page.

*Cross-Semester Portability:*
- FR-14.30: Template entries SHALL store resource references by code (room_code, section_code, employee_id) rather than UUID. This enables cross-semester portability.
- FR-14.31: During template application, the system SHALL perform section remapping by matching section_code between the template entry and sections in the target semester. Sections that cannot be matched SHALL be flagged as unmapped in the application report.
- FR-14.32: Template application SHALL filter entries by the target department. If a template contains entries from a different department (e.g., SHS entries applied to College), those entries SHALL be skipped with a warning.

**Acceptance Criteria:**
- [ ] AC-1: Saving a template from published entries with name "Fall 2026 Schedule" (â‰¥3 chars), scope ALL_ENTRIES, succeeds and stores all entries without semester/year bindings.
- [ ] AC-2: Saving a template with a name shorter than 3 characters returns a validation error.
- [ ] AC-3: Saving a template with a duplicate name returns a validation error.
- [ ] AC-4: Saving a template with scope CLASS_ONLY copies only CLASS entries; EXAM entries are excluded.
- [ ] AC-5: Template list displays all expected columns and supports scope filtering.
- [ ] AC-6: Template entry preview shows Activity Type, Subject, Section(s), Room, Personnel, Day of Week, Start/End Time.
- [ ] AC-7: Editing a template entry's room does not affect the original published schedule entry.
- [ ] AC-8: Deleting a template (soft) does not affect previously generated schedules.
- [ ] AC-9: Applying a template to a target semester clones entries as DRAFT, runs conflict detection, and returns entry/conflict counts.
- [ ] AC-10: Applying a template when entries already exist for the target term shows a warning but proceeds.
- [ ] AC-11: Generated entries with HARD conflicts are flagged and cannot be published until resolved or overridden.
- [ ] AC-12: Template application is atomic â€” if any insert fails, no entries or application log records are persisted.
- [ ] AC-13: Application history shows all past applications for a template with correct metadata.
- [ ] AC-14: Generated DRAFT entries can be edited and deleted following normal entry rules.

- [ ] AC-15: When saving a template, the user can select which fields to include in the template snapshot.
- [ ] AC-16: When applying a template that references soft-deleted resources (rooms, sections, or personnel), the system displays a warning listing the affected resources.
- [ ] AC-17: When renaming a template, the new name must be at least 3 characters and unique within the same scope.
- [ ] AC-18: When duplicating a template, the system creates a copy with the name '[Original Name] (Copy)' and the same scope.
- [ ] AC-19: When applying a template with scope SHS to a College semester, the system rejects the application.
- [ ] AC-20: When template application creates entries that trigger conflicts, the conflicts are displayed to the user before committing.
- [ ] AC-21: When template application succeeds, the system creates an audit record with action TEMPLATE_APPLY, recording the template name and number of entries created.
- [ ] AC-22: When previewing a template before application, the system displays all entries that would be created without persisting them.
- [ ] AC-23: When applying a template, all generated entries are persisted atomically; if any entry fails validation, no entries are created.
- [ ] AC-24: When a template entry references a resource that no longer exists (hard constraint), that entry is skipped and reported.
- [ ] AC-25: When deleting a template, the system prompts for confirmation before removing.
- [ ] AC-26: When applying a template, the system records the last-applied date for the template.
- [ ] AC-27: When attempting to apply a template with zero entries, the system displays a message indicating the template is empty.
- [ ] AC-28: When editing a template in place, changes do not affect previously applied schedule entries.
- [ ] AC-29: When saving a template from published entries, only entries in the active department and semester are included.
- [ ] AC-30: When saving a template, resource references are stored by code (room_code, section_code, employee_id) rather than UUID.
- [ ] AC-31: When applying a template to a target semester, sections are matched by section_code. Sections that cannot be matched are flagged as unmapped in the application report.
- [ ] AC-32: When applying a CROSS_DEPARTMENT template that contains SHS entries to a College semester, SHS entries are skipped with a warning and only College entries are applied.

---

### FR-15: Data Import

**Description:** The data import feature allows bulk loading of personnel, sections, rooms, and calendar events from CSV or XLSX files. Files are selected via native file dialog, parsed and validated in the main process, previewed by the user, and committed in a single database transaction. The system provides downloadable template files, row-level validation feedback, import history, and result reports.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-06, FR-07, FR-08
**Related FRs:** None

**Data Model Reference:** import_jobs, personnel, rooms, sections, calendar_events ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

*Upload and Parse:*
- FR-15.1: The system SHALL accept file uploads of CSV (.csv) or XLSX (.xlsx) format via the native file dialog.
- FR-15.2: The maximum file size SHALL be 5 MB; files exceeding this limit SHALL be rejected with an appropriate error.
- FR-15.3: The system SHALL support four import targets: Personnel, Sections, Rooms, and Calendar Events.
- FR-15.4: On file selection, the system SHALL open the file in the main process, parse it using the xlsx (SheetJS) library, validate headers against the expected schema for the selected target, and validate each row.
- FR-15.5: Files SHALL be read with UTF-8 encoding.
- FR-15.6: Empty rows SHALL be skipped during parsing.
- FR-15.7: The maximum number of data rows per file SHALL be 1,000; files exceeding this limit SHALL be rejected.

*Download Template:*
- FR-15.8: The system SHALL allow downloading a template file for each import target via the native save dialog.
- FR-15.9: Template files SHALL contain the correct headers and one example row with valid sample data.

*Preview:*
- FR-15.10: After parsing, the system SHALL return a paginated preview table to the renderer showing: Row Number, Status (VALID, WARNING, or ERROR), column values, and validation messages.
- FR-15.11: The user SHALL be able to choose one of three actions: import valid rows only (skip errors), import all rows (skip errors), or cancel the import.

*Commit:*
- FR-15.12: On user confirmation, the system SHALL insert or upsert validated rows in a single database transaction.
- FR-15.13: If the transaction fails, no rows SHALL be persisted.

*Result Report:*
- FR-15.14: After commit, the system SHALL display a result report showing: Total Processed, Created, Updated, and Skipped counts.
- FR-15.15: The system SHALL offer an option to save an error report via the native save dialog.

*Import History:*
- FR-15.16: The system SHALL maintain a log of all import jobs with: Target, Department, File Name, Uploaded At, Total Rows, Created, Updated, Skipped.

*Personnel Import Columns:*
- FR-15.17: Personnel import SHALL accept the following columns: employee_id (required, unique, upsert key), first_name (required), last_name (required), email (required, unique), personnel_type (required, must be FACULTY/STAFF/ADMIN), department (required, must be SHS/COLLEGE), is_shared (optional, default false), specializations (optional, semicolon-separated), max_weekly_hours (optional, default 40), status (optional, default ACTIVE).

*Section Import Columns:*
- FR-15.18: Section import SHALL accept the following columns: section_code (required, unique per department+academic year+semester), section_name (required), department (required, must be SHS/COLLEGE), strand_track (required for SHS, ERROR if missing for SHS rows), subject (required for College, ERROR if missing for College rows), course_program (optional), year_level (optional), student_count (optional, default 0), adviser_employee_id (optional for SHS, must match existing personnel if provided), status (optional, default ACTIVE).
- FR-15.19: For section imports, Academic Year, Semester, and Department SHALL be set in the import UI and not included as file columns.

*Room Import Columns:*
- FR-15.20: Room import SHALL accept the following columns: room_code (required, unique, upsert key), room_name (required), building (optional), floor (optional), capacity (required, must be >0), room_type (required, must be LECTURE/LAB/GYM/OFFICE/OTHER), department_availability (required, must be SHS_ONLY/COLLEGE_ONLY/SHARED), status (optional, default AVAILABLE), notes (optional).

*Calendar Event Import Columns:*
- FR-15.21: Calendar event import SHALL accept the following columns: title (required, min 2 chars), event_type (required, must be HOLIDAY/EXAM_PERIOD/BREAK/INSTITUTIONAL_EVENT/CUSTOM), start_date (required, YYYY-MM-DD format), end_date (required, YYYY-MM-DD format), start_time (optional, HH:MM format), end_time (optional, HH:MM format), is_blocking (optional, default false), description (optional).
- FR-15.22: Calendar events are institution-wide; there is no department column in the import file.

*Validation Rules:*
- FR-15.23: The system SHALL validate headers against the expected schema; missing required headers SHALL cause the import to fail before row processing.
- FR-15.24: The system SHALL perform type coercion (e.g., string to integer for numeric fields).
- FR-15.25: The system SHALL validate enum fields against their allowed values (e.g., personnel_type must be FACULTY/STAFF/ADMIN).
- FR-15.26: Duplicate unique keys within a single import file SHALL be reported as row ERRORS. Only the first occurrence is accepted; subsequent duplicates are rejected.
- FR-15.27: The system SHALL perform foreign key validation where applicable (e.g., adviser_employee_id must match an existing personnel record).
- FR-15.28: Invalid rows SHALL be marked as ERROR with a descriptive message and SHALL be skipped during commit.
- FR-15.29: Import file parsing SHALL be performed within a try-catch with a 30-second timeout. Files that cause parsing to exceed 30 seconds or throw unhandled errors SHALL be rejected with: "File could not be processed. Please verify the file format." The raw error is logged internally, not returned to the renderer.
- FR-15.30: All imported TEXT field values SHALL enforce a maximum length of 500 characters. JSON array fields SHALL accept a maximum of 50 elements. Rows exceeding these limits SHALL be marked with status ERROR.

*Upsert Match Keys:*
- FR-15.31: The import system SHALL use the following upsert match keys per target: Personnel: employee_id. Rooms: room_code. Sections: section_code + department + academic_year_id + semester_id. Calendar Events: title + start_date.
- FR-15.32: When a matching record is found by upsert key, the import SHALL use full-overwrite semantics: all fields from the import file replace all fields on the existing record.

**Acceptance Criteria:**
- [ ] AC-1: Uploading a valid CSV file with 10 personnel rows displays a preview with all rows marked VALID.
- [ ] AC-2: Uploading a file larger than 5 MB returns an error before parsing.
- [ ] AC-3: Uploading a file with more than 1,000 data rows returns an error.
- [ ] AC-4: Uploading a file with an incorrect header (missing required column) returns a header validation error.
- [ ] AC-5: A personnel row with an invalid personnel_type value (e.g., "TEACHER") is marked ERROR with a descriptive message.
- [ ] AC-6: An SHS section row missing strand_track is marked ERROR.
- [ ] AC-7: A College section row missing subject is marked ERROR.
- [ ] AC-8: A room row with capacity=0 is marked ERROR.
- [ ] AC-9: Calendar event rows with start_date in invalid format are marked ERROR.
- [ ] AC-10: Two rows with the same employee_id in the same file: the first row is accepted, the second is marked ERROR.
- [ ] AC-11: A section row with adviser_employee_id that doesn't match any existing personnel is marked ERROR.
- [ ] AC-12: Committing valid rows creates/upserts them in a single transaction; the result report shows correct counts.
- [ ] AC-13: If a transaction fails mid-commit, no rows are persisted.
- [ ] AC-14: Downloading a personnel template yields a CSV/XLSX with correct headers and one example row.
- [ ] AC-15: Import history shows all past jobs with correct metadata.
- [ ] AC-16: Saving an error report via native dialog produces a file with row-level error details.

- [ ] AC-17: When uploading a personnel CSV, the system validates against the expected columns: employee_id, first_name, last_name, email, department, is_shared, personnel_type, specializations, max_weekly_hours, status.
- [ ] AC-18: When uploading a section CSV, the import UI requires selecting Academic Year, Semester, and Department before upload; these values are not included in the file columns.
- [ ] AC-19: When uploading a room CSV, the system validates against the expected columns: room_code, room_name, building, floor, capacity, room_type, department_availability, status, notes.
- [ ] AC-20: When uploading a calendar event CSV, the system validates against the expected columns: title, event_type, start_date, end_date, is_all_day, is_blocking, description.
- [ ] AC-21: When a CSV file has missing required headers, the import fails before row processing with a header validation error listing the missing columns.
- [ ] AC-22: When a numeric field contains a string value, the system attempts type coercion; if coercion fails, the row is marked as ERROR.
- [ ] AC-23: When an enum field contains a value not in the allowed set (e.g., personnel_type = 'INTERN'), the row is marked as ERROR with a descriptive message.
- [ ] AC-24: When two rows in the same import file have duplicate unique keys (e.g., same employee_id), the second row is marked as ERROR and only the first is accepted.
- [ ] AC-25: When a foreign key reference is invalid (e.g., adviser_employee_id references a non-existent person), the row is marked as ERROR.
- [ ] AC-26: When rows are marked as ERROR during import preview, those rows are skipped during commit and the remaining valid rows are imported.
- [ ] AC-27: When import file parsing exceeds 30 seconds, the system cancels the operation and displays a timeout error.
- [ ] AC-28: When a text field value exceeds 500 characters, the system truncates or rejects the value with a length validation error.
- [ ] AC-29: When saving an error report after import, the system opens the native save dialog and exports all ERROR rows with their error messages.
- [ ] AC-30: When a calendar event import row is processed, no department column is expected because calendar events are institution-wide.
- [ ] AC-31: When importing a personnel CSV with an employee_id that matches an existing record, the import upserts by replacing all fields on the existing record with the import file values.
- [ ] AC-32: When importing a section CSV with section_code + department + academic_year_id + semester_id matching an existing record, the import replaces all fields on the existing record.

---

### FR-16: Data Export

**Description:** The data export feature generates downloadable reports from published schedule data in PDF, CSV, and XLSX formats. Exports are scoped by department, academic year, and semester, with further filtering by resource type. All files are generated in the main process and saved via the native save dialog. The system supports six export types covering schedules, calendars, personnel load, room utilization, section schedules, and examination schedules.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-09, FR-11
**Related FRs:** FR-06, FR-08, FR-21, FR-22, FR-23

**Data Model Reference:** schedule_entries, rooms, personnel, sections, calendar_events ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

*General:*
- FR-16.1: All exports SHALL be generated in the Electron main process.
- FR-16.2: All exports SHALL be saved via the native save dialog.
- FR-16.3: Export filenames SHALL follow the pattern: `{ResourceType}_{ResourceName}_{Semester}_{AcademicYear}.{ext}`.
- FR-16.4: All exported files SHALL use UTF-8 encoding.

*Export Schedule by Resource:*
- FR-16.5: The system SHALL export the published schedule filtered by: Academic Year, Semester, Resource Type (Room, Section, or Personnel), and specific resource ID.
- FR-16.6: Supported formats for schedule export SHALL be: PDF, CSV, XLSX.

*Export Academic Calendar:*
- FR-16.7: The system SHALL export the academic calendar for a given Academic Year and optional Semester.
- FR-16.8: Supported formats for academic calendar export SHALL be: PDF, CSV.

*Export Personnel Load Report:*
- FR-16.9: The system SHALL export a personnel load report containing: total assigned hours, breakdown by day/subject/section, and workload percentage.
- FR-16.10: Supported formats for personnel load export SHALL be: PDF, XLSX.

*Export Room Utilization Report:*
- FR-16.11: The system SHALL export a room utilization report showing occupied vs. available time slots per room.
- FR-16.12: Supported formats for room utilization export SHALL be: PDF, XLSX.

*Export Section Schedule:*
- FR-16.13: The system SHALL export a formatted weekly schedule for a specific section.
- FR-16.14: Section schedule export SHALL be available in PDF format only.

*Export Examination Schedule:*
- FR-16.15: The system SHALL export the examination timetable with all published EXAM entries.
- FR-16.16: Examination schedule export SHALL be filterable by Section and Exam Type.
- FR-16.17: Supported formats for examination schedule export SHALL be: PDF, XLSX.

*Technical:*
- FR-16.18: PDF generation SHALL use the jspdf library with the jspdf-autotable plugin.
- FR-16.19: XLSX generation SHALL use the xlsx (SheetJS) library.
- FR-16.20: CSV output SHALL use proper field escaping (quoting fields containing commas, newlines, or quotes).
- FR-16.21: When the selected export filters produce no matching entries, the system SHALL block the export and display a message: 'No published entries match the selected filters.' The export button SHALL be disabled when no data matches.
- FR-16.22: The system SHALL support exporting DRAFT entries in addition to PUBLISHED entries. Draft exports SHALL include a 'DRAFT' watermark on PDF output and a status column showing 'DRAFT' in CSV/XLSX output. A status filter (DRAFT/PUBLISHED/ALL) SHALL be provided.

*Institution Logo in Exports:*
- FR-16.23: When an institution logo has been configured (per FR-21), all PDF exports SHALL render the logo in the header area of the first page. The logo SHALL be scaled to fit within a maximum bounding box of 120×60 pixels while maintaining aspect ratio.
- FR-16.24: When no institution logo has been configured, PDF exports SHALL render the header without a logo placeholder — no blank space or broken image indicator SHALL appear.

*Export Signatories:*
- FR-16.25: Before generating any export, the system SHALL display a pre-export modal (per FR-22) that collects optional signatory information. If signatories are provided, PDF exports SHALL render signatory blocks at the bottom of the last page with the layout: Name (above a horizontal line), Label/Title (below the line), and Position (below the label). Signatory blocks SHALL be evenly spaced horizontally. CSV and XLSX exports SHALL NOT include signatory information.

*Export Footer Credits:*
- FR-16.26: When an export footer credit has been configured (per FR-23), all PDF exports SHALL render the footer credit text centered in the page footer area of every page. CSV and XLSX exports SHALL NOT include footer credit information.

**Acceptance Criteria:**
- [ ] AC-1: Exporting a schedule by Room for a given term in PDF format generates a file saved via native dialog with the correct filename pattern.
- [ ] AC-2: Exporting a schedule in CSV format produces properly escaped fields.
- [ ] AC-3: Exporting an academic calendar in PDF format includes all calendar events for the selected term.
- [ ] AC-4: Exporting a personnel load report in XLSX includes total hours, daily breakdown, and workload percentage.
- [ ] AC-5: Exporting a room utilization report shows occupied vs. available slots per room.
- [ ] AC-6: Exporting a section schedule produces a PDF-only formatted weekly view.
- [ ] AC-7: Exporting an examination schedule filtered by Exam Type returns only matching EXAM entries.
- [ ] AC-8: All export formats use UTF-8 encoding.
- [ ] AC-9: Attempting to export when no published entries exist for the selected filters produces an empty report or informative message.

- [ ] AC-10: When exporting any report, the file is generated in the Electron main process and saved via the native save dialog.
- [ ] AC-11: When the export filename is generated, it follows the pattern: {ResourceType}_{ResourceName}_{Semester}_{AcademicYear}.{ext}.
- [ ] AC-12: When exporting any file, the output uses UTF-8 encoding.
- [ ] AC-13: When exporting the academic calendar for a given Academic Year, the system generates a file containing all calendar events within that year's date range.
- [ ] AC-14: When exporting a personnel load report, the output includes total assigned hours, breakdown by day/subject/section, and overload flag for each person.
- [ ] AC-15: When exporting a room utilization report, the output shows occupied vs. available time slots per room for the selected semester.
- [ ] AC-16: When exporting a section schedule, the output is in PDF format only and shows the weekly timetable for that specific section.
- [ ] AC-17: When exporting the examination schedule, the export can be filtered by Section and Exam Type.
- [ ] AC-18: When generating PDF exports, the system uses the jspdf library with the jspdf-autotable plugin.
- [ ] AC-19: When generating XLSX exports, the system uses the xlsx (SheetJS) library.
- [ ] AC-20: When generating CSV exports, fields containing commas, newlines, or quotes are properly escaped with quoting.
- [ ] AC-21: When the selected export filters produce no matching entries, the system blocks the export and displays: 'No published entries match the selected filters.' The export button is disabled.
- [ ] AC-22: When exporting DRAFT entries in PDF format, the output includes a 'DRAFT' watermark. When exporting in CSV/XLSX format, a status column shows 'DRAFT'.
- [ ] AC-23: When using the export feature, a status filter (DRAFT/PUBLISHED/ALL) is available for selecting which entries to include.
- [ ] AC-24: When an institution logo is configured and a PDF export is generated, the logo appears in the header area of the first page, scaled to fit within 120×60 pixels.
- [ ] AC-25: When no institution logo is configured and a PDF export is generated, the header renders cleanly without any logo placeholder or blank space.
- [ ] AC-26: When the admin provides signatories in the pre-export modal and generates a PDF export, signatory blocks appear at the bottom of the last page with Name, Label, and Position correctly laid out.
- [ ] AC-27: When the admin checks "No signatories" in the pre-export modal and generates a PDF export, no signatory blocks appear in the output.
- [ ] AC-28: When an export footer credit is configured and a PDF export is generated, the footer credit text appears centered in the footer of every page.
- [ ] AC-29: When no export footer credit is configured and a PDF export is generated, the footer area is empty.
- [ ] AC-30: When generating CSV or XLSX exports, neither signatory information nor footer credits are included in the output.

---

### FR-17: First-Run Setup

**Description:** First-run setup initializes the application for first use. The main process detects whether the SQLite database exists and whether an admin password has been configured. If either condition is missing, the application enters first-run mode and presents a compact inline setup screen that collects the admin password and system-wide scheduling defaults before redirecting to the dashboard.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** None
**Related FRs:** FR-18

**Data Model Reference:** app_settings ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

*Detection:*
- FR-17.1: On application launch, the main process SHALL check if the SQLite database file exists at `app.getPath('userData')/schedule-manager.db`.
- FR-17.2: If the database file does not exist, the system SHALL create the database and run all migrations, then show the setup screen.
- FR-17.3: If the database file exists but the `app_settings` table has no `admin_password_hash` row, the system SHALL show the setup screen.
- FR-17.4: If the database file exists and `admin_password_hash` is present, the system SHALL show the login screen.

*Setup Screen:*
- FR-17.5: The setup screen SHALL be a compact inline form (not a multi-step wizard).
- FR-17.6: The setup screen SHALL collect: Password (minimum 4 characters), Confirm Password, SHS Period Length (default 60 minutes), College Period Length (default 90 minutes), Time Slot Start (default 07:00), Time Slot End (default 21:00).
- FR-17.7: All default values SHALL be pre-filled (smart defaults).
- FR-17.8: The Password field is required and cannot be skipped.

*Processing:*
- FR-17.9: The system SHALL validate that Password and Confirm Password match; reject with a validation error if they do not.
- FR-17.10: The system SHALL validate that Password is at least 4 characters; reject with a validation error if shorter.
- FR-17.11: The system SHALL hash the password using bcryptjs with a cost factor of 10.
- FR-17.12: The system SHALL store the hashed password in `app_settings` under the key `admin_password_hash`.
- FR-17.13: The system SHALL store the period length and time slot values in `app_settings`.
- FR-17.14: On successful setup completion, the system SHALL redirect to the Dashboard.

*Schema Versioning and Migration:*
- FR-17.15: The database schema SHALL include a version number stored in `app_settings` under the key `schema_version`.
- FR-17.16: On application startup, the main process SHALL compare the database's `schema_version` against the application's expected schema version.
- FR-17.17: If the database schema version is behind the application version, the system SHALL run all pending migration scripts sequentially from the current version to the target version.
- FR-17.18: Before running any migration, the system SHALL create an automatic backup of the current database at `app.getPath('userData')/backups/pre-migration-{schema_version}.db`.
- FR-17.19: Migration scripts SHALL be bundled with the application and executed in order.
- FR-17.20: If a migration script fails, the system SHALL halt, display an error with the failed migration version, and instruct the admin to restore from the pre-migration backup.

**Acceptance Criteria:**
- [ ] AC-1: Launching the application with no database file creates the database, runs migrations, and shows the setup screen.
- [ ] AC-2: Launching the application with a database but no admin_password_hash shows the setup screen.
- [ ] AC-3: Launching the application with a database and admin_password_hash shows the login screen.
- [ ] AC-4: Submitting setup with password "ab" (less than 4 chars) returns a validation error.
- [ ] AC-5: Submitting setup with mismatched password and confirm password returns a validation error.
- [ ] AC-6: Submitting setup with valid data stores the bcryptjs hash (cost 10) in app_settings, stores period/time defaults, and redirects to the dashboard.
- [ ] AC-7: Default values (SHS=60, College=90, Start=07:00, End=21:00) are pre-filled on the setup screen.
- [ ] AC-8: The password field cannot be left empty.
- [ ] AC-9: Upgrading from schema v1 to v3 runs migration v2 and v3 sequentially.
- [ ] AC-10: A pre-migration backup is created before any migration runs.
- [ ] AC-11: A failed migration halts further migrations and displays an error.

- [ ] AC-12: When the setup screen is displayed, it is a compact inline form (not a multi-step wizard).
- [ ] AC-13: When the setup form is displayed, it collects: Password, Confirm Password, SHS Period Length, College Period Length, Time Slot Start, and Time Slot End.
- [ ] AC-14: When the setup form loads, all fields have pre-filled smart defaults (period lengths: 60 min, time slots: 07:00-18:00).
- [ ] AC-15: When the Password and Confirm Password do not match, the system rejects with a validation error.
- [ ] AC-16: When the Password is shorter than 4 characters, the system rejects with a validation error.
- [ ] AC-17: When setup completes, the password is hashed using bcryptjs with cost factor 10 and stored in app_settings as admin_password_hash.
- [ ] AC-18: When setup completes, the period length and time slot values are stored in app_settings.
- [ ] AC-19: When the database schema_version is behind the application's expected version, all pending migration scripts run sequentially on startup.
- [ ] AC-20: When migration scripts run, they are executed in version order and the schema_version is updated after each successful migration.

---

### FR-18: Authentication

**Description:** Authentication secures the application with a single-account, password-based system. A password is required on every application launch. The session is held in-memory with no expiry â€” authentication persists until the application is closed. All IPC handlers (except authentication and setup channels) enforce the authenticated state, returning an UNAUTHORIZED error for unauthenticated requests.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-17
**Related FRs:** None

**Data Model Reference:** app_settings ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

*Login:*
- FR-18.1: The system SHALL require a password on every application launch.
- FR-18.2: The main process SHALL retrieve the stored password hash from `app_settings` and compare it against the submitted password using bcryptjs.
- FR-18.3: On successful comparison, the system SHALL set an in-memory `isAuthenticated` flag to true.
- FR-18.4: On failed comparison, the system SHALL return a generic error message: "Incorrect password."
- FR-18.5: The session SHALL be held in-memory with no expiry; the user remains authenticated until the application is closed.

*Change Password:*
- FR-18.6: The system SHALL provide a change password form accessible from Settings.
- FR-18.7: The change password form SHALL require: Current Password, New Password (minimum 4 characters), and Confirm New Password.
- FR-18.8: The system SHALL verify the Current Password against the stored hash before accepting the change.
- FR-18.9: The system SHALL hash the new password using bcryptjs (cost 10) and update the `admin_password_hash` in `app_settings`.

*IPC Guard:*
- FR-18.10: All IPC handlers except `auth:login`, `auth:check-setup`, and `setup:complete` SHALL verify that the `isAuthenticated` flag is true before processing.
- FR-18.11: Unauthenticated IPC calls SHALL return `{ data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }`.

*Single Account Rules:*
- FR-18.12: The system SHALL support exactly one account; there is no registration, invitation, or user management functionality.
- FR-18.13: All pages except Login and Setup SHALL require authentication.
- FR-18.14: There are no role-based permission checks beyond the single authentication check.
- FR-18.15: Conflict override is always available to the authenticated user; no additional permission is required.

**Acceptance Criteria:**
- [ ] AC-1: Entering the correct password on the login screen sets isAuthenticated=true and proceeds to the dashboard.
- [ ] AC-2: Entering an incorrect password shows "Incorrect password." and does not set isAuthenticated.
- [ ] AC-3: Closing and reopening the application requires re-entering the password.
- [ ] AC-4: Calling any IPC handler (other than auth:login, auth:check-setup, setup:complete) without authentication returns `{ data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }`.
- [ ] AC-5: Changing password with correct current password, valid new password (â‰¥4 chars), and matching confirm succeeds.
- [ ] AC-6: Changing password with incorrect current password returns an error; the password is not changed.
- [ ] AC-7: Changing password with new password shorter than 4 characters returns a validation error.
- [ ] AC-8: No registration, invitation, or multi-user management features exist in the application.

- [ ] AC-9: When authentication succeeds, the system sets an in-memory isAuthenticated flag that persists until the application is closed (no expiry).
- [ ] AC-10: When the user accesses the change password form in Settings, it requires: Current Password, New Password (min 4 chars), and Confirm New Password.
- [ ] AC-11: When changing password, the system verifies the Current Password against the stored hash before accepting the new password.
- [ ] AC-12: When an unauthenticated IPC call is made to a protected handler, the system returns { data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }.
- [ ] AC-13: When the system receives an IPC call to auth:login, auth:check-setup, or setup:complete, no authentication check is performed.
- [ ] AC-14: When navigating to any page except Login and Setup without authentication, the system redirects to the Login page.
- [ ] AC-15: When the authenticated user attempts to override a HARD conflict, no additional permission check is required beyond the existing authentication.

---

### FR-19: Backup & Restore

**Description:** The backup and restore system protects against data loss using the SQLite Backup API via better-sqlite3's `.backup()` method, ensuring consistent snapshots even during active read/write operations. The system supports manual on-demand backups and full database restoration with integrity validation and password verification. A periodic backup reminder encourages regular backups.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** None
**Related FRs:** None

**Data Model Reference:** Database file operations — no specific table ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

*Manual Backup:*
- FR-19.1: The system SHALL provide a "Create Backup" action that opens the native save dialog with a default filename of `schedule-manager-backup-{YYYY-MM-DD-HHmmss}.db`.
- FR-19.2: The system SHALL create the backup using `database.backup(targetPath)` via the SQLite Backup API (better-sqlite3 `.backup()` method), NOT `fs.copyFile`.
- FR-19.3: On successful backup, the system SHALL display a success toast with the saved file path.
- FR-19.4: The Backup API SHALL create a consistent snapshot even while the database is being read or written.

*Restore:*
- FR-19.5: The system SHALL provide a "Restore from Backup" action that first requires the admin to enter their current password for verification.
- FR-19.6: If the current password verification fails, the restore SHALL be denied.
- FR-19.7: On successful password verification, the system SHALL display a confirmation dialog warning that current data will be replaced.
- FR-19.7a: Before any restore operation, the system SHALL automatically create a safety backup of the current database to `app.getPath('userData')/backups/auto/pre-restore-{timestamp}.db`.
- FR-19.8: On confirmation, the system SHALL open the native file dialog filtered to `.db` files.
- FR-19.9: The system SHALL validate the selected file by running `PRAGMA integrity_check` on it.
- FR-19.10: If integrity_check fails, the system SHALL display the error message: "The selected file is not a valid database backup." and leave the current database unchanged.
- FR-19.11: If integrity_check passes, the system SHALL compare the admin_password_hash in the backup against the current database's admin_password_hash.
- FR-19.12: The system SHALL: close the current database connection, replace the active database file with the selected backup, re-open the database connection, invalidate the current authentication session (set isAuthenticated=false), and redirect to the login screen.
- FR-19.13: If the restored database's admin_password_hash differs from the pre-restore hash, the system SHALL display a warning: "The restored backup uses a different password. Please log in with the password that was set when this backup was created."

*Backup Reminder:*
- FR-19.14: The system SHALL track the date of the last successful backup in `app_settings` under the key `last_backup_date`.
- FR-19.15: On application launch, if no backup has been created in the last 7 days, the system SHALL display a non-blocking notification: "It's been over 7 days since your last backup. Consider creating one from Settings."
- FR-19.16: The reminder SHALL be dismissible and SHALL NOT block application usage.

*Auto-Backup:*
- FR-19.17: The system SHALL automatically create a backup of the database when the application is closed normally.
- FR-19.18: The system SHALL maintain a rolling auto-backup directory with a maximum of 5 backup files, deleting the oldest when the limit is exceeded.
- FR-19.19: The auto-backup directory SHALL be located at `app.getPath('userData')/backups/auto/`.
- FR-19.20: The Settings page SHALL display a list of auto-backup files with filename, date, and size.
- FR-19.21: The admin SHALL be able to restore from any auto-backup file or delete individual auto-backup files.

**Acceptance Criteria:**
- [ ] AC-1: Clicking "Create Backup" opens the native save dialog with the default filename pattern `schedule-manager-backup-{YYYY-MM-DD-HHmmss}.db`.
- [ ] AC-2: A manual backup created via `.backup()` produces a valid, consistent database snapshot.
- [ ] AC-3: A success toast displays the full file path after a successful manual backup.
- [ ] AC-4: Restore requires entering the current password before proceeding; incorrect password blocks restore.
- [ ] AC-5: After password verification, a confirmation warning is displayed before the restore proceeds.
- [ ] AC-6: Selecting a valid `.db` backup file restores it: the app redirects to the login screen.
- [ ] AC-7: Selecting a corrupt `.db` file shows "The selected file is not a valid database backup." and current data remains unchanged.
- [ ] AC-8: After restoring a backup with a different password hash, the warning "The restored backup uses a different password..." is displayed.
- [ ] AC-9: After restore, the isAuthenticated flag is false and the admin must re-login.
- [ ] AC-10: If no backup has been created in 7 days, a non-blocking reminder appears on app launch.
- [ ] AC-11: The backup reminder is dismissible and does not block app usage.
- [ ] AC-12: Backups are created using the SQLite Backup API, not fs.copyFile.

- [ ] AC-13: When the admin initiates a restore, the system requires password verification before proceeding.
- [ ] AC-14: When the restore file dialog opens, it filters to show only .db files.
- [ ] AC-15: When the backup's admin_password_hash differs from the current database's hash, the system warns the admin that restoring will change the login password.
- [ ] AC-16: When a backup is created or restored successfully, the system updates last_backup_date in app_settings.
- [ ] AC-17: When the application is closed normally, the system automatically creates a backup in the auto-backup directory.
- [ ] AC-18: When the auto-backup directory contains 5 backup files and a new auto-backup is created, the oldest backup file is deleted.
- [ ] AC-19: When the admin opens the Settings page, a list of auto-backup files is displayed showing filename, date, and size.
- [ ] AC-20: When the admin selects an auto-backup file, they can restore from it or delete it.
- [ ] AC-21: When a restore operation is initiated, the system creates a safety backup at `app.getPath('userData')/backups/auto/pre-restore-{timestamp}.db` before replacing the database.

---

### FR-20: Dashboard

**Description:** The Dashboard is the default landing page after login. It provides an at-a-glance summary of the current scheduling state for the active department, including active term information, draft/published entry counts, conflict summaries, and quick-action navigation.

**Actor:** Administrator

**Priority:** Must Have

**Dependencies:** FR-01, FR-02, FR-03, FR-04, FR-09, FR-10, FR-11
**Related FRs:** FR-09, FR-10, FR-11, FR-12

**Data Model Reference:** `schedule_entries`, `academic_years`, `semesters`, `schedule_audit_log`

**Functional Requirements:**

*Dashboard Widgets:*
- FR-20.1: The Dashboard SHALL display the active term summary showing the current Academic Year label, Semester type, and quarter (SHS only) for the active department.
- FR-20.2: The Dashboard SHALL display the count of DRAFT schedule entries for the active department, academic year, and semester.
- FR-20.3: The Dashboard SHALL display the count of PUBLISHED schedule entries for the active department, academic year, and semester.
- FR-20.4: The Dashboard SHALL display the count of entries with HARD conflicts and the count with SOFT conflicts separately.
- FR-20.5: The Dashboard SHALL display a list of the 5 most recent audit log entries for the active department.

*Quick Actions:*
- FR-20.6: The Dashboard SHALL provide quick-action cards for: Create Entry (navigates to Draft Builder), Publish Drafts (navigates to Draft Builder publish view), and Export Schedule (navigates to Export page).

*Display Rules:*
- FR-20.7: All Dashboard labels SHALL use non-technical, admin-friendly language (e.g., "Unpublished Entries" instead of "DRAFT entries").
- FR-20.8: When no active term is set for the active department, the Dashboard SHALL display a prominent message directing the admin to set an active Academic Year and Semester.

**Acceptance Criteria:**
- [ ] AC-1: When the admin logs in, the Dashboard is displayed as the default page.
- [ ] AC-2: When the admin switches departments, the Dashboard widgets update to reflect the new department's data.
- [ ] AC-3: When draft entries exist with HARD conflicts, the Dashboard displays the HARD conflict count in a visually distinct style.
- [ ] AC-4: When no active term is set, the Dashboard displays guidance to set up an active Academic Year and Semester.
- [ ] AC-5: When clicking a quick-action card, the admin is navigated to the correct page.

---

### FR-21: Institution Logo Management

**Description:** The institution logo is a user-uploaded image that appears in the header area of all PDF exports. The logo is configured once via the Settings page and persists in `app_settings` as a base64-encoded data URI until replaced or removed. This eliminates the need for the administrator to provide the logo on every export operation.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** None
**Related FRs:** FR-16, FR-17

**Data Model Reference:** app_settings ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

*Upload Logo:*
- FR-21.1: The system SHALL provide a "Upload Logo" action on the Settings page that opens the native file dialog filtered to image files (`.png`, `.jpg`, `.jpeg`).
- FR-21.2: The selected image file SHALL NOT exceed 2 MB in size. Files exceeding this limit SHALL be rejected with the message: "Logo file must be under 2 MB."
- FR-21.3: The system SHALL validate that the selected file is a valid image by checking the MIME type (must be `image/png`, `image/jpeg`). Files with invalid MIME types SHALL be rejected with the message: "Only PNG and JPEG images are accepted."
- FR-21.4: On successful validation, the system SHALL convert the image to a base64-encoded data URI and store it in `app_settings` under the key `institution_logo`.
- FR-21.5: The Settings page SHALL display a preview of the currently configured logo (if any), rendered at a maximum display size of 200×100 pixels while maintaining aspect ratio.
- FR-21.6: The system SHALL provide a "Remove Logo" action that deletes the `institution_logo` key from `app_settings`. A confirmation dialog SHALL be shown before removal.

*Logo in Exports:*
- FR-21.7: When an institution logo is configured, all PDF exports (per FR-16) SHALL render the logo image in the top-left corner of the first page header, scaled to fit within a maximum bounding box of 120×60 pixels while maintaining aspect ratio.
- FR-21.8: When no institution logo is configured, PDF exports SHALL render the header without any logo — no placeholder, blank space, or broken image SHALL appear.

*Persistence:*
- FR-21.9: The institution logo SHALL persist across application restarts, since it is stored in `app_settings` within the SQLite database.
- FR-21.10: The institution logo SHALL be included in database backups and restored with the database.

**Acceptance Criteria:**
- [ ] AC-1: When the admin clicks "Upload Logo" on the Settings page, the native file dialog opens filtered to PNG and JPEG files.
- [ ] AC-2: When the admin selects a valid PNG file under 2 MB, the logo is stored as a base64 data URI in app_settings and a preview appears on the Settings page.
- [ ] AC-3: When the admin selects a file larger than 2 MB, the system displays: "Logo file must be under 2 MB." and the logo is not changed.
- [ ] AC-4: When the admin selects a non-image file (e.g., .txt), the system displays: "Only PNG and JPEG images are accepted." and the logo is not changed.
- [ ] AC-5: When a logo is configured and the admin navigates to Settings, a preview of the logo is displayed at a maximum of 200×100 pixels.
- [ ] AC-6: When the admin clicks "Remove Logo" and confirms, the institution_logo key is deleted from app_settings and the preview disappears.
- [ ] AC-7: When a logo is configured and a PDF export is generated, the logo appears in the top-left corner of the first page header, scaled within 120×60 pixels.
- [ ] AC-8: When no logo is configured and a PDF export is generated, the header renders cleanly without any placeholder or blank space.
- [ ] AC-9: When the admin closes and reopens the application, the previously configured logo is still available in Settings and in PDF exports.
- [ ] AC-10: When a database backup is created with a configured logo and later restored, the logo is present after restore.

---

### FR-22: Export Signatories

**Description:** Export signatories are optional named individuals whose signature blocks appear at the bottom of PDF exports. When the administrator initiates any export action, a pre-export modal is displayed that collects signatory information. The modal supports adding multiple signatories, each with a Label (title of person), Name, and Position. Signatories are optional — if the administrator does not wish to include signatories, they must explicitly check a "No signatories" checkbox before proceeding.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** FR-16
**Related FRs:** FR-21, FR-23

**Data Model Reference:** N/A — signatories are not persisted; they are collected per-export via the modal.

**Functional Requirements:**

*Pre-Export Modal:*
- FR-22.1: When the admin initiates any export action (clicking an export button on any export page), the system SHALL display a pre-export modal before generating the export file.
- FR-22.2: The pre-export modal SHALL contain a "Signatories" section with the ability to add one or more signatory entries.
- FR-22.3: Each signatory entry SHALL collect three fields: Label (the title of the person, e.g., "Registrar", "Dean"), Name (the name that appears above the Label), and Position (the position of the signatory that appears below the Label, e.g., "OIC - Registrar's Office").
- FR-22.4: The system SHALL allow adding up to 5 signatory entries. When 5 signatories are present, the "Add Signatory" button SHALL be disabled.
- FR-22.5: The system SHALL allow removing individual signatory entries via a remove/delete button on each entry.
- FR-22.6: All three signatory fields (Label, Name, Position) SHALL be required when a signatory entry is present. The system SHALL validate that no field is left blank and display inline validation errors for empty fields.

*No Signatories Option:*
- FR-22.7: The pre-export modal SHALL contain a "No signatories" checkbox.
- FR-22.8: When the "No signatories" checkbox is checked, the signatory input fields SHALL be hidden/disabled and the export SHALL proceed without signatory blocks.
- FR-22.9: When the "No signatories" checkbox is unchecked and no signatory entries have been added, the system SHALL prevent export and display a validation message: "Add at least one signatory or check 'No signatories' to proceed."
- FR-22.10: The "No signatories" checkbox SHALL default to unchecked (signatories expected by default).

*Signatory Rendering in PDF:*
- FR-22.11: When signatories are provided, PDF exports SHALL render signatory blocks at the bottom of the last page.
- FR-22.12: Each signatory block SHALL display: the Name (bold) above a horizontal signature line, the Label (title) below the line, and the Position below the Label.
- FR-22.13: When multiple signatories are provided, their blocks SHALL be evenly spaced horizontally across the page width.
- FR-22.14: Signatory blocks SHALL NOT be included in CSV or XLSX exports.

*Non-Persistence:*
- FR-22.15: Signatory data SHALL NOT be persisted to the database. Each export collects signatory information fresh via the modal.

**Acceptance Criteria:**
- [ ] AC-1: When the admin clicks any export button, a pre-export modal appears before the export file is generated.
- [ ] AC-2: When the admin adds a signatory entry in the modal, three fields are displayed: Label, Name, and Position.
- [ ] AC-3: When the admin adds 5 signatory entries, the "Add Signatory" button becomes disabled.
- [ ] AC-4: When the admin removes a signatory entry, it is removed from the modal and the count decreases.
- [ ] AC-5: When the admin submits the modal with a signatory entry that has an empty Name field, an inline validation error appears on the Name field.
- [ ] AC-6: When the admin checks "No signatories" and clicks export, the PDF is generated without signatory blocks.
- [ ] AC-7: When the admin unchecks "No signatories" but has not added any signatory entries, the system displays: "Add at least one signatory or check 'No signatories' to proceed." and blocks the export.
- [ ] AC-8: When the admin provides 2 signatories and exports a PDF, two signatory blocks appear at the bottom of the last page, evenly spaced horizontally.
- [ ] AC-9: When signatories are provided, the PDF renders Name (bold) above the line, Label below the line, and Position below the Label.
- [ ] AC-10: When the admin exports in CSV or XLSX format, no signatory information is included in the output.
- [ ] AC-11: When the admin exports a file with signatories and then exports another file, the signatory fields in the modal are empty (not persisted from the previous export).
- [ ] AC-12: When the "No signatories" checkbox is checked, the signatory input area is hidden or disabled.

---

### FR-23: Export Footer Credits

**Description:** The export footer credit is a configurable text line that appears centered in the footer of every page in PDF exports. It provides institutional branding or credit attribution (e.g., "Schedule Management System | Powered by: JW-Tech"). The footer credit is configured once via the Settings page and persists in `app_settings` until changed or cleared.

**Actor:** Administrator

**Priority:** Must

**Dependencies:** None
**Related FRs:** FR-16, FR-21, FR-22

**Data Model Reference:** app_settings ([Architecture doc §3](Architecture_ScheduleManagement.md#3-domain-model))

**Functional Requirements:**

*Configure Footer Credit:*
- FR-23.1: The Settings page SHALL provide an "Export Footer Credit" text input field where the admin can enter a footer credit line.
- FR-23.2: The footer credit text SHALL have a maximum length of 200 characters. The system SHALL reject input exceeding this limit with a validation error.
- FR-23.3: The footer credit text SHALL be stored in `app_settings` under the key `export_footer_credit`.
- FR-23.4: The footer credit text MAY be left empty. When empty, no footer credit SHALL be rendered in PDF exports.
- FR-23.5: The Settings page SHALL display the current footer credit value (if any) pre-filled in the input field.
- FR-23.6: The system SHALL provide a "Clear" action that removes the `export_footer_credit` value from `app_settings`.

*Footer Credit in Exports:*
- FR-23.7: When an export footer credit is configured, all PDF exports SHALL render the footer credit text centered horizontally in the page footer area of every page.
- FR-23.8: The footer credit text SHALL be rendered in a smaller font size (e.g., 8pt) with a muted color to avoid visual dominance over the main content.
- FR-23.9: When no export footer credit is configured (empty or cleared), PDF exports SHALL render the footer area without any credit text.
- FR-23.10: The export footer credit SHALL NOT be included in CSV or XLSX exports.

*Default Value:*
- FR-23.11: During first-run setup (FR-17), the export_footer_credit SHALL default to an empty string (no footer credit). The admin can configure it at any time via Settings.

*Persistence:*
- FR-23.12: The export footer credit SHALL persist across application restarts, since it is stored in `app_settings` within the SQLite database.
- FR-23.13: The export footer credit SHALL be included in database backups and restored with the database.

**Acceptance Criteria:**
- [ ] AC-1: When the admin navigates to Settings, the "Export Footer Credit" input field is displayed.
- [ ] AC-2: When the admin enters "Schedule Management System | Powered by: JW-Tech" and saves, the value is stored in app_settings under export_footer_credit.
- [ ] AC-3: When the admin enters a footer credit exceeding 200 characters, a validation error is displayed and the value is not saved.
- [ ] AC-4: When a footer credit is configured and a PDF export is generated, the footer credit text appears centered in the footer of every page.
- [ ] AC-5: When the footer credit is cleared and a PDF export is generated, the footer area is empty.
- [ ] AC-6: When a footer credit is configured, CSV and XLSX exports do not include the footer credit text.
- [ ] AC-7: When the admin closes and reopens the application, the previously configured footer credit is still displayed in the Settings input field.
- [ ] AC-8: When a database backup is created with a configured footer credit and later restored, the footer credit is present after restore.
- [ ] AC-9: When the admin clicks "Clear" on the footer credit field, the export_footer_credit value is removed from app_settings and the field becomes empty.
- [ ] AC-10: When the footer credit is rendered in a PDF export, it uses a smaller font size (approximately 8pt) with a muted color.
- [ ] AC-11: When first-run setup completes, the export_footer_credit defaults to an empty string.

---

### Cross-Feature Flows

Flows that span 3+ FRs where the end-to-end behavior isn't testable from any single FR's acceptance criteria alone. This section does NOT define new requirements — it defines integration test scenarios composed from existing FR ACs.

| Flow Name | FRs Involved | Trigger | Expected End State | AC References |
|-----------|-------------|---------|-------------------|---------------|
| Schedule Entry to Published | FR-09, FR-10, FR-11, FR-12 | Admin creates draft entries and submits for publication | Entries transition to PUBLISHED status, all 15 conflict detectors pass, audit trail records CREATE and PUBLISH actions | FR-09 AC-1, FR-10 AC-1, FR-11 AC-1, FR-12 AC-1 |
| Template Application | FR-14, FR-09, FR-10 | Admin applies a saved template to a new semester | Draft entries created from template with field mappings, conflicts detected for each generated entry, application logged | FR-14 AC-5, FR-09 AC-1, FR-10 AC-1 |
| Data Import Pipeline | FR-15, FR-06, FR-07, FR-08 | Admin uploads a CSV/Excel file for personnel/rooms/sections | File parsed, rows validated against uniqueness and format rules, preview displayed, committed records appear in entity lists | FR-15 AC-1, FR-06 AC-1, FR-07 AC-1, FR-08 AC-1 |
| Backup and Restore Cycle | FR-19, FR-18 | Admin creates a backup, later restores from that backup file | Database replaced with backup contents, authentication session invalidated, app redirects to login screen | FR-19 AC-1, FR-19 AC-5, FR-18 AC-1 |
| Exam Schedule Creation | FR-13, FR-05, FR-09, FR-10, FR-11 | Admin creates exam entries within an EXAM_PERIOD calendar event | Exam entries created with ONCE recurrence, exam-period alignment validated (no soft conflict), published through standard publish workflow | FR-13 AC-1, FR-05 AC-5, FR-09 AC-1, FR-10 AC-1, FR-11 AC-1 |
| Branded Export Pipeline | FR-16, FR-21, FR-22, FR-23 | Admin configures logo and footer credit in Settings, then initiates a PDF export with signatories | PDF export rendered with institution logo in header, signatory blocks at bottom of last page, and footer credit on every page. Logo and footer credit sourced from app_settings; signatories collected via pre-export modal | FR-21 AC-7, FR-22 AC-8, FR-23 AC-4, FR-16 AC-24 |

---

## 5. Non-Functional Requirements

| ID | Category | Requirement | Target | Measurement Method | Degraded State |
|----|----------|-------------|--------|-----------------------|
| NFR-P-001 | Performance | Application launch to interactive UI | â‰¤ 3000ms (cold start) | Manual test with stopwatch / performance profiling | Show splash screen with progress indicator; log cold-start time to console |
| NFR-P-002 | Performance | IPC read responses | â‰¤ 100ms p95 | Automated test with timing instrumentation | Show loading spinner in UI; log slow-read warning with channel name and elapsed time |
| NFR-P-003 | Performance | IPC write responses | â‰¤ 200ms p95 | Automated test with timing instrumentation | Show saving indicator; log slow-write warning with channel name and elapsed time |
| NFR-P-004 | Performance | Conflict detection (single entry, all 15 detectors) | â‰¤ 300ms p95 | Automated test with timing instrumentation | Display conflict results with stale-data warning badge; log performance degradation |
| NFR-P-005 | Performance | Template application (up to 100 entries) | â‰¤ 3000ms p95 | Automated test with timing instrumentation | Show progress bar with entry count; allow cancellation if over 5s; log duration |
| NFR-P-006 | Performance | Export generation (PDF/XLSX) | â‰¤ 5000ms for up to 200 entries | Automated test with timing instrumentation | Show progress indicator; allow cancellation; log export duration warning |
| NFR-P-007 | Performance | Database backup (via Backup API) | â‰¤ 5000ms for databases up to 100MB | Manual test with file size verification | Show backup progress indicator; log backup duration; do not block app close beyond 10s |
| NFR-S-001 | Security | All IPC handlers (except auth/setup) require authenticated state | 100% coverage | Code review / automated test of all IPC channels | Reject IPC request with AUTH_REQUIRED error code; do not process the handler |
| NFR-S-002 | Security | Renderer has no direct Node.js API access | contextIsolation=true, nodeIntegration=false | Electron config audit | Electron refuses to load the renderer; display security violation error and exit |
| NFR-S-003 | Security | Electron contextIsolation enabled, nodeIntegration disabled | Enforced in BrowserWindow config | Electron config audit | Electron refuses to create BrowserWindow; display security config error and exit |
| NFR-S-004 | Security | Audit trail append-only | No UPDATE/DELETE on schedule_audit_log | Code review / automated test | Reject UPDATE/DELETE queries on audit table at database layer; log attempted violation |
| NFR-S-005 | Security | Admin password stored as bcryptjs hash | Never plaintext | Code review | Reject login setup; display password storage error; never store plaintext password |
| NFR-S-006 | Security | All database queries use parameterized statements | better-sqlite3 prepared statements | Code review | Reject query execution; log SQL injection risk warning; return structured error |
| NFR-S-007 | Security | No raw error details to renderer | Structured error responses only | Code review / automated test | Return generic error message to renderer; log full error details to main process only |
| NFR-U-001 | Usability | Application window minimum size | 1024Ã—768 pixels | Manual test / Electron config audit | Electron enforces minimum size; UI may render with scrollbars but remains functional |
| NFR-U-002 | Usability | Keyboard accessibility | All interactive elements focusable | Manual test / accessibility audit | Feature remains functional via mouse; log accessibility gap for remediation |
| NFR-U-003 | Usability | Async operation feedback | Loading spinner, success toast, or error message for all async operations | Manual test | Operation completes silently; user may not know if action succeeded; log feedback failure |
| NFR-U-004 | Usability | Empty states | All lists/tables have meaningful empty states | Manual test | Display blank area; feature remains functional but user receives no guidance |
| NFR-U-005 | Usability | Form validation | Inline errors adjacent to relevant field | Manual test | Display generic form-level error; user must identify the invalid field manually |
| NFR-U-006 | Usability | Department switcher | Always visible, clearly indicates active department | Manual test | Default to last-used department; log switcher render failure |
| NFR-U-007 | Usability | File operations | Native file dialogs for all import/export/backup operations | Manual test | Fall back to hardcoded default path; log native dialog failure; warn user |
| NFR-R-001 | Reliability | Schedule mutations atomic | Entry + audit log in same transaction | Automated test | Rollback entire transaction; display Save failed error; no partial data persisted |
| NFR-R-002 | Reliability | Draft submission snapshots | Full data snapshot for auditability | Automated test / code review | Log snapshot failure; block submission with Audit snapshot failed error |
| NFR-R-003 | Reliability | Template application atomic | All entries + application log in same transaction | Automated test | Rollback entire transaction; display Template application failed error; no partial entries |
| NFR-R-004 | Reliability | Backup uses SQLite Backup API | Not raw file copies | Code review | Reject backup request; display Backup API unavailable error; no file-copy fallback |
| NFR-R-005 | Reliability | Auto-backup on close | 5-backup rotation | Manual test | Log auto-backup failure; display non-blocking warning on next app launch |
| NFR-R-006 | Reliability | Restore validates backup | PRAGMA integrity_check before replacing | Automated test | Reject restore; display Backup file is corrupted error; keep current database intact |
| NFR-R-007 | Reliability | IPC error responses | Structured with error codes | Code review / automated test | Return generic error code UNKNOWN_ERROR to renderer; log structured error failure |
| NFR-D-001 | Data Integrity | Parameterized queries | better-sqlite3 prepared statements | Code review | Reject query execution; log parameterization failure; return structured error |
| NFR-D-002 | Data Integrity | Input validation at service layer | Before all database writes | Code review | Reject write operation; display validation error to user; no data persisted |
| NFR-D-003 | Data Integrity | Business rules in service layer | Not only in UI | Code review | UI validation may pass but service layer rejects; display Business rule violation error |
| NFR-D-004 | Data Integrity | Soft delete pattern | No permanent data removal | Code review / automated test | Reject permanent delete operation; log violation; return error to renderer |
| NFR-D-005 | Data Integrity | Template resource warnings | Warning if referenced resource soft-deleted | Automated test | Allow template application but display warning listing soft-deleted resources |
| NFR-D-006 | Data Integrity | Foreign key enforcement | PRAGMA foreign_keys = ON | Automated test / Electron config audit | Reject write that violates FK constraint; display referential integrity error |
| NFR-D-007 | Data Integrity | WAL journal mode | For durability and read performance | Automated test / Electron config audit | Fall back to default journal mode; log WAL activation failure; performance may degrade |
| NFR-K-001 | Packaging | Windows installer | .exe via electron-builder | Build verification | Build pipeline fails; installer not produced; developer investigates build config |
| NFR-K-002 | Packaging | No separate DB installation | Single installer, SQLite bundled | Build verification | Installation fails if SQLite not found; user contacts support |
| NFR-K-003 | Packaging | Data survives updates | app.getPath('userData') | Build verification / manual test | Display Data directory not found error on launch; prompt user to restore from backup |
| NFR-K-004 | Packaging | Native module rebuild | better-sqlite3 rebuilt for target Electron | Build verification | Application crashes on launch with native module error; rebuild required |
| NFR-P-008 | Performance | Recurrence expansion limit | Max 200 occurrences per recurrence expansion. Early termination on first HARD conflict for recurring entries with >50 occurrences | Automated test with timing instrumentation | Cap expansion at 200; log warning if limit reached; display truncation notice to user |
| NFR-U-008 | Usability | Keyboard shortcuts for high-frequency actions | Ctrl+N (new entry), Ctrl+S (save), Ctrl+D (duplicate), Ctrl+Shift+P (publish), Escape (close modal), Ctrl+F (search), Ctrl+Shift+? (shortcut reference) | Manual test / accessibility audit | Feature remains functional via mouse; log shortcut registration failure |
| NFR-UX-001 | Usability | Bulk operation progress indicator | Bulk operations exceeding 5 seconds SHALL display a progress indicator. UI SHALL be locked during bulk mutations to prevent concurrent modifications | Manual test | Operation completes without progress feedback; user may attempt concurrent modifications |

---

## 6. System Constraints

1. **Two fixed departments** â€” SHS and College are hard-coded scopes. They cannot be added, renamed, or removed.
2. **Different school year cycles** â€” SHS runs Juneâ€“March; College runs Augustâ€“May.
3. **Summer semester is College-only** â€” SHS does not have a summer semester.
4. **Department-specific exam types** â€” SHS uses quarterly exam types (Q1_EXAM, Q2_EXAM, Q3_EXAM, Q4_EXAM). College uses positional exam types (PRELIM, MIDTERM, PRE_FINALS, FINALS). Cross-assignment is rejected.
5. **SHS quarters are date-bounded** â€” Quarter boundaries are defined within semesters using q1_end_date and q3_end_date.
6. **Section model differs by department** â€” SHS sections are homeroom-based. College sections are course-based.
7. **Academic Calendar is institution-wide** â€” Calendar events are not department-specific; no department-scoped events exist.
8. **Academic Terms are fully independent per department** â€” Each department manages its own academic years and semesters independently.
9. **Room conflicts are cross-department** â€” A room booking in one department blocks the same room for the other department.
10. **Shared personnel workload is tracked globally** â€” Total weekly hours for shared personnel are summed across all departments.
11. **No approval workflow, no roles** â€” There is no multi-step approval process and no role-based access control beyond single-user authentication.
12. **Conflict override is always available** â€” Any authenticated user can override HARD conflicts by providing a reason.
13. **Soft delete only** â€” No permanent data deletion is performed anywhere in the system.
14. **Exam entries require a room** â€” All EXAM activity type entries must have a room assigned, regardless of modality.
15. **Exam entries do not recur** â€” EXAM entries are locked to recurrence pattern ONCE.
16. **Import file limit: 1,000 rows** â€” Data import files are limited to a maximum of 1,000 data rows.
17. **Templates are not versioned** â€” Templates are edited in place; there is no version history for template modifications.
18. **Single SQLite database file** â€” All application data is stored in a single file at `app.getPath('userData')/schedule-manager.db`.
19. **Schedule time slot enforcement** â€” Entries outside the configured time_slot_start/time_slot_end window trigger a SOFT warning but are not blocked.
20. **Backup files contain the full database** â€” Whoever possesses a backup file has full read access to all data. Backup file security is the admin's responsibility.
21. **Database restore replaces the entire database** â€” Including the audit trail. Audit records created between the backup and the restore are lost. The restore action itself is not auditable within the restored database.
22. **Single-instance application** â€” Only one instance of the application may run at a time. The system enforces this via Electron's `app.requestSingleInstanceLock()`. If a second instance is launched, it focuses the existing window and exits.
23. **No undo/redo (with single-record delete exception)** — All mutations are committed immediately on save. The audit trail provides a historical record but not a revert mechanism. **Exception:** Single-record soft deletions SHALL display a 10-second undo snackbar. If the admin clicks undo within 10 seconds, the deletion is reverted (is_active set back to 1). This does NOT apply to bulk deletions.
24. **No midnight-spanning entries** â€” Schedule entries cannot span across midnight. Entries needed across midnight must be split into two separate entries.
25. **Draft groups scoped by full active term** â€” Draft entry groups are scoped by department + academic year + semester. Switching active terms shows a different draft group.
26. **Soft delete semantics** â€” All entity deletions set is_active=0 rather than removing rows. There is no restore path for deleted records in V1. Soft delete preserves referential integrity for audit trail and historical data.
27. **Delete protection dependency map** â€” Academic Years cannot be deleted if they have semesters. Semesters cannot be deleted if they have schedule entries or sections. Sections cannot be deleted if they have schedule entries. Rooms cannot be deleted if they have active schedule entries. Personnel cannot be deleted if they have active schedule entries in any department.
28. **Implementation gating** â€” Implementation SHALL NOT begin until the Architecture document's data model (§3 Domain Model) is complete and current.

### 6.1 Assumptions

The following are assumptions about the product's scope, target platform, and operating environment. These may change with a CR if the product direction shifts.

1. **Fully offline** â€” The application requires no internet connection and makes no external network requests.
2. **Windows-only platform** â€” The application targets Windows exclusively. macOS and Linux are not supported.
3. **No database encryption at rest** â€” The database file is not encrypted. Data confidentiality relies on the operating system's user account and filesystem permissions. Users handling sensitive data should enable OS-level disk encryption (e.g., BitLocker).
4. **Single administrator, no privilege escalation** â€” The system has a single administrator account with no role-based access control. There are no privilege levels to escalate between. All features are equally accessible once authenticated. This is by design for a single-user desktop application.

---

## 7. External Interfaces

### 7.1 User Interfaces

**Design Direction:** Light theme, clean and modern, Tailwind CSS (v3+) utility-first, academic/institutional feel
**Design File:** None
**Design System:** Custom Tailwind CSS configuration

**Responsive Breakpoints:**

| Target | Breakpoint |
|--------|------------|
| Compact | 1024px |
| Standard | 1280px |
| Wide | 1920px |

The application is an Electron desktop app with a React SPA frontend using React Router (v6+) for client-side navigation. The minimum application window size is 1024Ã—768 pixels. UI behavior is defined in the FR blocks (Section 4) â€” each FR describes what the screen does, what fields it contains, and what error states to design for.

| Route | Page | Department Context |
|---|---|---|
| /login | Login | None |
| /setup | First-Run Setup | None |
| / | Dashboard | Active department |
| /academic-terms | Academic Terms | Per department |
| /calendar | Academic Calendar | Institution-wide |
| /rooms | Room List | Filtered by department availability |
| /rooms/:id | Room Detail | Cross-department schedule |
| /sections | Section List | Active department |
| /sections/:id | Section Detail | Section schedule |
| /personnel | Personnel List | Active department + shared |
| /personnel/:id | Personnel Detail | Cross-department schedule |
| /schedules/draft | Draft Builder | Active department |
| /schedules/published | Published Schedule View | Active department |
| /schedules/exam | Examination Schedule | Active department |
| /templates | Schedule Templates | All |
| /templates/:id | Template Detail | Template entries |
| /imports | Import | Active department |
| /imports/:jobId | Import Job Detail | Job results |
| /exports | Exports | Active department |
| /audit | Audit Log | Active department |
| /settings | Settings | System-wide |

### 7.2 APIs and Integrations

Not applicable â€” fully offline desktop application with no external API integrations.

### 7.3 Communication

Not applicable â€” all communication is local IPC between Electron main and renderer processes.

---

## 8. Traceability Matrix

Track implementation status of every functional and non-functional requirement. The Phase column maps each requirement to the PRD roadmap phase and enforces build order. Update as development progresses. Track at the FR and NFR level. Use the Notes column to call out specific sub-requirements affected by CRs or partial implementation.

**Status Definitions:**

| Status | Meaning |
|--------|---------|
| **Not Started** | Requirement is written but implementation hasn't started |
| **In Progress** | Implementation has started, or a CR reset some sub-requirements |
| **Implemented** | Code is written, awaiting test verification |
| **Verified** | All acceptance criteria pass. Requirement is complete. |

**CR Reset Rule:** When a CR modifies sub-requirements of a Verified or Implemented FR, the FR status resets to **In Progress**. The Notes column records which sub-requirements were affected and the CR reference.

**Cross-Feature Flow impact:** When a CR modifies sub-requirements that participate in a Cross-Feature Flow, verify all other FRs in that flow still function correctly. The Notes column should reference the affected flow(s).

| Requirement ID | Requirement Name | Phase | Status | Notes |
|---------------|-----------------|-------|--------|-------|
| FR-01 | Department Scope & Configuration | 1 | Not Started | |
| FR-02 | Dual Academic Calendar Cycles | 1 | Not Started | |
| FR-03 | Semester Management | 1 | Not Started | |
| FR-04 | Active Term Resolution | 1 | Not Started | |
| FR-05 | Academic Calendar Management | 1 | Not Started | |
| FR-06 | Room Management | 1 | Not Started | |
| FR-07 | Section Management | 1 | Not Started | |
| FR-08 | Personnel Management | 1 | Not Started | |
| FR-09 | Schedule Entry Management | 1 | Not Started | |
| FR-10 | Conflict Detection Engine | 1 | Not Started | |
| FR-11 | Publish Workflow | 1 | Not Started | |
| FR-12 | Audit Trail | 1 | Not Started | |
| FR-13 | Examination Schedule | 1 | Not Started | |
| FR-14 | Schedule Templates | 1 | Not Started | |
| FR-15 | Data Import | 1 | Not Started | |
| FR-16 | Data Export | 1 | Not Started | |
| FR-17 | First-Run Setup | 1 | Not Started | |
| FR-18 | Authentication | 1 | Not Started | |
| FR-19 | Backup & Restore | 1 | Not Started | |
| FR-20 | Dashboard | 1 | Not Started | |
| FR-21 | Institution Logo Management | 1 | Not Started | |
| FR-22 | Export Signatories | 1 | Not Started | |
| FR-23 | Export Footer Credits | 1 | Not Started | |
| NFR-P-001 | Application launch to interactive UI | 1 | Not Started | |
| NFR-P-002 | IPC read responses | 1 | Not Started | |
| NFR-P-003 | IPC write responses | 1 | Not Started | |
| NFR-P-004 | Conflict detection latency | 1 | Not Started | |
| NFR-P-005 | Template application | 1 | Not Started | |
| NFR-P-006 | Export generation | 1 | Not Started | |
| NFR-P-007 | Database backup | 1 | Not Started | |
| NFR-S-001 | IPC auth guard coverage | 1 | Not Started | |
| NFR-S-002 | Context isolation | 1 | Not Started | |
| NFR-S-003 | Node integration disabled | 1 | Not Started | |
| NFR-S-004 | Audit trail append-only | 1 | Not Started | |
| NFR-S-005 | Password hash storage | 1 | Not Started | |
| NFR-S-006 | Parameterized queries | 1 | Not Started | |
| NFR-S-007 | No raw errors to renderer | 1 | Not Started | |
| NFR-U-001 | Minimum window size | 1 | Not Started | |
| NFR-U-002 | Keyboard accessibility | 1 | Not Started | |
| NFR-U-003 | Async operation feedback | 1 | Not Started | |
| NFR-U-004 | Empty states | 1 | Not Started | |
| NFR-U-005 | Form validation feedback | 1 | Not Started | |
| NFR-U-006 | Department switcher visibility | 1 | Not Started | |
| NFR-U-007 | Native file dialogs | 1 | Not Started | |
| NFR-R-001 | Schedule mutations atomic | 1 | Not Started | |
| NFR-R-002 | Draft submission snapshots | 1 | Not Started | |
| NFR-R-003 | Template application atomic | 1 | Not Started | |
| NFR-R-004 | Backup uses SQLite Backup API | 1 | Not Started | |
| NFR-R-005 | Auto-backup on close | 1 | Not Started | |
| NFR-R-006 | Restore validates backup | 1 | Not Started | |
| NFR-R-007 | IPC structured error responses | 1 | Not Started | |
| NFR-D-001 | Parameterized queries | 1 | Not Started | |
| NFR-D-002 | Input validation at service layer | 1 | Not Started | |
| NFR-D-003 | Business rules in service layer | 1 | Not Started | |
| NFR-D-004 | Soft delete pattern | 1 | Not Started | |
| NFR-D-005 | Template resource warnings | 1 | Not Started | |
| NFR-D-006 | Foreign key enforcement | 1 | Not Started | |
| NFR-D-007 | WAL journal mode | 1 | Not Started | |
| NFR-K-001 | Windows installer | 1 | Not Started | |
| NFR-K-002 | No separate DB installation | 1 | Not Started | |
| NFR-K-003 | Data survives updates | 1 | Not Started | |
| NFR-K-004 | Native module rebuild | 1 | Not Started | |
| NFR-P-008 | Recurrence expansion limit | 1 | Not Started | |
| NFR-U-008 | Keyboard shortcuts | 1 | Not Started | |

---

## 9. Change History

| Version | Date | Author | Changes | Related CR |
|---------|------|--------|---------|------------|
| 0.1 | 2026-05-23 | Developer | Initial draft | -- |
| 0.1 | 2026-05-27 | Developer | Integrated 57 audit findings (31 system quality + 26 requirements quality). Added FR-20 (Dashboard), 2 new conflict detectors (#14 personnel_inactive, #15 section_inactive), auto-backup FRs (19.17–19.21), selective publish, time slot alignment, field dependency matrix, audit log generalization, template section remapping, upsert keys, draft export, 3 NFRs, 3 system constraints. Fixed FR-13/FR-20 traceability collision. | -- |
| 0.1 | 2026-05-31 | Developer | Added FR-21 (Institution Logo Management), FR-22 (Export Signatories), FR-23 (Export Footer Credits). Updated FR-16 with sub-requirements FR-16.23–16.26 and AC-24–30 for logo/signatory/footer integration in PDF exports. Added 3 glossary terms, updated System Actors permissions, added Branded Export Pipeline cross-feature flow, added 2 new app_settings keys (institution_logo, export_footer_credit), updated IPC contract (preload bridge + export channels with signatories param). | -- |
| 1.0 | 2026-05-31 | Developer | Approved — self-review with Documentation Compliance Checklist pass. Baseline locked. All future changes require a CR. | -- |

---

## Appendix A: IPC Contract Reference

### A.1 IPC Response Envelope

Every IPC response follows a consistent envelope structure:

```json
{
  "data": "<result> | null",
  "error": "{ code: string, message: string, details?: any } | null"
}
```

**Error Codes:**

| Code | HTTP Equivalent | Usage |
|------|-----------------|-------|
| VALIDATION_ERROR | 400 / 422 | Invalid input, failed business rules |
| UNAUTHORIZED | 401 | Request made without authenticated session |
| NOT_FOUND | 404 | Requested resource does not exist |
| CONFLICT | 409 | Operation conflicts with existing data |
| INTERNAL_ERROR | 500 | Unexpected server-side failure |

### A.2 Preload Context Bridge Structure

```javascript
window.electronAPI = {
  auth: { checkSetup(), login(password), changePassword(data) },
  setup: { complete(data) },
  academicYears: { list(filters), create(data), get(id), update(id, data), getSemesters(id) },
  semesters: { create(data), update(id, data) },
  activeTerm: { get(department) },
  calendarEvents: { list(filters), create(data), get(id), update(id, data), delete(id) },
  rooms: { list(filters), create(data), get(id), update(id, data), delete(id), getSchedule(id, filters) },
  sections: { list(filters), create(data), get(id), update(id, data), delete(id), getSchedule(id) },
  personnel: { list(filters), create(data), get(id), update(id, data), delete(id), getSchedule(id) },
  schedules: { listDraft(filters), createDraft(data), updateDraft(id, data), deleteDraft(id), validate(data), publish(filters), unpublish(id), listExam(filters) },
  templates: { list(filters), create(data), get(id), update(id, data), delete(id), getEntries(id), updateEntry(templateId, entryId, data), deleteEntry(templateId, entryId), apply(id, data), getApplications(id) },
  imports: { downloadTemplate(target, format), upload(data), commit(jobId, options), listJobs(filters), getJob(jobId) },
  exports: { schedule(params), calendar(params), personnelLoad(params), roomUtilization(params), sectionSchedule(id, params), examSchedule(params) },
  logo: { upload(), get(), remove() },
  backup: { create(), restore(), listAuto(), restoreAuto(filename), deleteAuto(filename) },
  settings: { get(key), getAll(), update(key, value) },
  dialog: { openFile(options), saveFile(options) },
}
```

### A.3 Channel Reference

#### Auth & Setup Channels

| Channel | Arguments | Returns | Auth Required |
|---------|-----------|---------|---------------|
| auth:check-setup | â€” | `{ isSetupComplete: boolean }` | No |
| auth:login | `password: string` | `{ success: boolean }` | No |
| auth:change-password | `{ currentPassword, newPassword }` | `{ success: boolean }` | Yes |
| setup:complete | `{ password, shsPeriodLength, collegePeriodLength, timeSlotStart, timeSlotEnd }` | `{ success: boolean }` | No |

#### Academic Term Channels

| Channel | Arguments | Returns |
|---------|-----------|---------|
| academic-years:list | `{ department }` | `AcademicYear[]` |
| academic-years:create | `{ department, label, startDate, endDate, isActive }` | `AcademicYear` |
| academic-years:get | `id` | `AcademicYear` |
| academic-years:update | `id, data` | `AcademicYear` |
| academic-years:get-semesters | `id` | `Semester[]` |
| semesters:create | `{ academicYearId, semesterType, startDate, endDate, isActive, q1EndDate?, q3EndDate? }` | `Semester` |
| semesters:update | `id, data` | `Semester` |
| active-term:get | `department` | `ActiveTerm \| null` |

#### Calendar Channels

| Channel | Arguments | Returns |
|---------|-----------|---------|
| calendar-events:list | `{ academicYearId?, semesterId?, eventType?, isBlocking? }` | `CalendarEvent[]` |
| calendar-events:create | `data` | `CalendarEvent` |
| calendar-events:get | `id` | `CalendarEvent` |
| calendar-events:update | `id, data` | `CalendarEvent` |
| calendar-events:delete | `id` | `{ success: boolean }` |

#### Room Channels

| Channel | Arguments | Returns |
|---------|-----------|---------|
| rooms:list | `{ departmentAvailability?, building?, roomType?, status? }` | `Room[]` |
| rooms:create | `data` | `Room` |
| rooms:get | `id` | `Room` |
| rooms:update | `id, data` | `Room` |
| rooms:delete | `id` | `{ success: boolean }` |
| rooms:get-schedule | `id, { department? }` | `ScheduleEntry[]` |

#### Section Channels

| Channel | Arguments | Returns |
|---------|-----------|---------|
| sections:list | `{ department, academicYearId?, semesterId?, program?, status? }` | `Section[]` |
| sections:create | `data` | `Section` |
| sections:get | `id` | `Section` |
| sections:update | `id, data` | `Section` |
| sections:delete | `id` | `{ success: boolean }` |
| sections:get-schedule | `id` | `ScheduleEntry[]` |

#### Personnel Channels

| Channel | Arguments | Returns |
|---------|-----------|---------|
| personnel:list | `{ department, isShared?, personnelType?, status? }` | `Personnel[]` |
| personnel:create | `data` | `Personnel` |
| personnel:get | `id` | `Personnel` |
| personnel:update | `id, data` | `Personnel` |
| personnel:delete | `id` | `{ success: boolean }` |
| personnel:get-schedule | `id` | `ScheduleEntry[]` (cross-department) |

#### Schedule Channels

| Channel | Arguments | Returns |
|---------|-----------|---------|
| schedules:list-draft | `{ department }` | `ScheduleEntry[]` |
| schedules:create-draft | `data` | `{ data: ScheduleEntry, conflicts: ConflictFlag[] }` |
| schedules:update-draft | `id, data` | `{ data: ScheduleEntry, conflicts: ConflictFlag[] }` |
| schedules:delete-draft | `id` | `{ success: boolean }` |
| schedules:validate | `data` | `{ conflicts: ConflictFlag[] }` |
| schedules:publish | `{ department }` | `{ published: number, blocked: ScheduleEntry[] }` |
| schedules:unpublish | `id` | `ScheduleEntry` |
| schedules:list-exam | `filters` | `ScheduleEntry[]` |

#### Template Channels

| Channel | Arguments | Returns |
|---------|-----------|---------|
| templates:list | `filters` | `ScheduleTemplate[]` |
| templates:create | `data` | `ScheduleTemplate` |
| templates:get | `id` | `ScheduleTemplate` |
| templates:update | `id, data` | `ScheduleTemplate` |
| templates:delete | `id` | `{ success: boolean }` |
| templates:get-entries | `id` | `TemplateEntry[]` |
| templates:update-entry | `templateId, entryId, data` | `TemplateEntry` |
| templates:delete-entry | `templateId, entryId` | `{ success: boolean }` |
| templates:apply | `id, { targetAcademicYearId, targetSemesterId }` | `{ entryCount: number, conflictCount: number }` |
| templates:get-applications | `id` | `TemplateApplication[]` |

#### Import Channels

| Channel | Arguments | Returns |
|---------|-----------|---------|
| imports:download-template | `target, format` | `{ success: boolean, filePath: string }` |
| imports:upload | `{ target, department?, academicYearId?, semesterId? }` | `{ jobId, rows, validCount, errorCount }` |
| imports:commit | `jobId, { importValidOnly }` | `{ created, updated, skipped }` |
| imports:list-jobs | `filters` | `ImportJob[]` |
| imports:get-job | `jobId` | `ImportJob` |

#### Export Channels

| Channel | Arguments | Returns |
|---------|-----------|---------|
| exports:schedule | `{ format, department, academicYearId, semesterId, resourceType?, resourceId?, signatories? }` | `{ success: boolean, filePath: string }` |
| exports:calendar | `{ format, academicYearId?, semesterId?, signatories? }` | `{ success: boolean, filePath: string }` |
| exports:personnel-load | `{ format, department, academicYearId, semesterId, signatories? }` | `{ success: boolean, filePath: string }` |
| exports:room-utilization | `{ format, department, academicYearId, semesterId, signatories? }` | `{ success: boolean, filePath: string }` |
| exports:section-schedule | `id, { format, signatories? }` | `{ success: boolean, filePath: string }` |
| exports:exam-schedule | `{ format, department, academicYearId, semesterId, examType?, sectionId?, signatories? }` | `{ success: boolean, filePath: string }` |

#### Backup Channels

| Channel | Arguments | Returns |
|---------|-----------|---------|
| backup:create | â€” | `{ success: boolean, filePath: string }` |
| backup:restore | â€” | `{ success: boolean }` (triggers app reload) |
| backup:list-auto | â€” | `[{ filename, date, sizeBytes }]` |
| backup:restore-auto | `filename` | `{ success: boolean }` (triggers app reload) |
| backup:delete-auto | `filename` | `{ success: boolean }` |

#### Settings Channels

| Channel | Arguments | Returns |
|---------|-----------|---------|
| settings:get | `key` | `{ key, value }` |
| settings:get-all | â€” | `[{ key, value }]` |
| settings:update | `key, value` | `{ key, value }` |

#### Logo Channels

| Channel | Arguments | Returns |
|---------|-----------|---------|
| logo:upload | — | `{ success: boolean, dataUri: string }` |
| logo:get | — | `{ dataUri: string \| null }` |
| logo:remove | — | `{ success: boolean }` |

---

## Appendix B: Data Dictionary

> **Canonical source:** [Architecture_ScheduleManagement.md §3 Domain Model](Architecture_ScheduleManagement.md#3-domain-model). This appendix is kept for SRS self-containment — the Architecture doc is authoritative in case of conflict.

### B.1 app_settings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| key | TEXT | PRIMARY KEY | Setting identifier |
| value | TEXT | NOT NULL | Setting value |
| updated_at | TEXT | DEFAULT datetime('now') | Last modification timestamp |

**Required Keys:**

| Key | Default | Description |
|-----|---------|-------------|
| admin_password_hash | â€” | bcryptjs hash of admin password |
| shs_period_length | 60 | SHS period length in minutes |
| college_period_length | 90 | College period length in minutes |
| time_slot_start | 07:00 | Earliest schedulable time |
| time_slot_end | 21:00 | Latest schedulable time |
| shs_year_start_month | 6 | SHS school year start month (June) |
| college_year_start_month | 8 | College school year start month (August) |
| institution_logo | (empty) | Base64-encoded data URI of the institution logo image (PNG/JPEG). Empty when no logo is configured. Max 2 MB source file. |
| export_footer_credit | (empty) | Footer credit text displayed in PDF exports (e.g., "Schedule Management System \| Powered by: JW-Tech"). Max 200 characters. Empty when not configured. |

### B.2 academic_years

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY, UUID | Unique identifier |
| department | TEXT | NOT NULL, CHECK IN ('SHS', 'COLLEGE') | Department scope |
| label | TEXT | NOT NULL | Display label (e.g., "2026â€“2027") |
| start_date | TEXT | NOT NULL | Academic year start date |
| end_date | TEXT | NOT NULL | Academic year end date |
| is_active | INTEGER | DEFAULT 0 | Whether this is the active academic year |
| created_at | TEXT | DEFAULT datetime('now') | Creation timestamp |
| updated_at | TEXT | DEFAULT datetime('now') | Last modification timestamp |

**Unique Constraint:** UNIQUE(department, label)

### B.3 semesters

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY, UUID | Unique identifier |
| academic_year_id | TEXT | FK â†’ academic_years(id) | Parent academic year |
| department | TEXT | NOT NULL, CHECK IN ('SHS', 'COLLEGE') | Department scope |
| semester_type | TEXT | NOT NULL, CHECK IN ('1ST_SEMESTER', '2ND_SEMESTER', 'SUMMER') | Semester type |
| start_date | TEXT | â€” | Semester start date |
| end_date | TEXT | â€” | Semester end date |
| is_active | INTEGER | DEFAULT 0 | Whether this is the active semester |
| q1_end_date | TEXT | â€” | Q1/Q2 boundary (SHS 1st Semester only) |
| q3_end_date | TEXT | â€” | Q3/Q4 boundary (SHS 2nd Semester only) |
| created_at | TEXT | DEFAULT datetime('now') | Creation timestamp |
| updated_at | TEXT | DEFAULT datetime('now') | Last modification timestamp |

**Unique Constraint:** UNIQUE(academic_year_id, semester_type)

### B.4 calendar_events

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY, UUID | Unique identifier |
| title | TEXT | NOT NULL, min 2 chars | Event title |
| event_type | TEXT | CHECK IN ('HOLIDAY', 'EXAM_PERIOD', 'BREAK', 'INSTITUTIONAL_EVENT', 'CUSTOM') | Event classification |
| is_blocking | INTEGER | DEFAULT 0 | Whether this event blocks scheduling |
| is_all_day | INTEGER | DEFAULT 0 | Whether this is an all-day event |
| start_datetime | TEXT | â€” | Event start datetime |
| end_datetime | TEXT | â€” | Event end datetime |
| academic_year_id | TEXT | FK â†’ academic_years(id), nullable | Associated academic year |
| semester_id | TEXT | FK â†’ semesters(id), nullable | Associated semester |
| description | TEXT | â€” | Event description |
| is_active | INTEGER | DEFAULT 1 | Soft delete flag |
| created_at | TEXT | DEFAULT datetime('now') | Creation timestamp |
| updated_at | TEXT | DEFAULT datetime('now') | Last modification timestamp |

### B.5 rooms

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY, UUID | Unique identifier |
| room_code | TEXT | UNIQUE | Room code identifier |
| room_name | TEXT | â€” | Display name |
| building | TEXT | â€” | Building location |
| floor | TEXT | â€” | Floor level |
| capacity | INTEGER | â€” | Maximum occupancy |
| room_type | TEXT | CHECK IN ('LECTURE', 'LAB', 'GYM', 'OFFICE', 'OTHER') | Room classification |
| department_availability | TEXT | DEFAULT 'SHARED', CHECK IN ('SHS_ONLY', 'COLLEGE_ONLY', 'SHARED') | Which departments can use this room |
| status | TEXT | DEFAULT 'AVAILABLE', CHECK IN ('AVAILABLE', 'MAINTENANCE', 'INACTIVE') | Current room status |
| notes | TEXT | â€” | Additional notes |
| is_active | INTEGER | DEFAULT 1 | Soft delete flag |
| created_at | TEXT | DEFAULT datetime('now') | Creation timestamp |
| updated_at | TEXT | DEFAULT datetime('now') | Last modification timestamp |

### B.6 sections

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY, UUID | Unique identifier |
| department | TEXT | CHECK IN ('SHS', 'COLLEGE') | Department scope |
| section_code | TEXT | â€” | Section code |
| section_name | TEXT | â€” | Display name |
| strand_track | TEXT | â€” | SHS strand/track (SHS only) |
| subject | TEXT | â€” | Course subject (College only) |
| course_program | TEXT | â€” | Course or program name |
| year_level | TEXT | â€” | Year level |
| student_count | INTEGER | DEFAULT 0 | Number of enrolled students |
| academic_year_id | TEXT | FK â†’ academic_years(id) | Associated academic year |
| semester_id | TEXT | FK â†’ semesters(id) | Associated semester |
| adviser_id | TEXT | FK â†’ personnel(id), SHS only | Section adviser |
| status | TEXT | DEFAULT 'ACTIVE', CHECK IN ('ACTIVE', 'INACTIVE') | Current status |
| is_active | INTEGER | DEFAULT 1 | Soft delete flag |
| created_at | TEXT | DEFAULT datetime('now') | Creation timestamp |
| updated_at | TEXT | DEFAULT datetime('now') | Last modification timestamp |

**Unique Constraint:** UNIQUE(department, section_code, academic_year_id, semester_id)

### B.7 personnel

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY, UUID | Unique identifier |
| employee_id | TEXT | UNIQUE | Employee ID (upsert key) |
| first_name | TEXT | â€” | First name |
| last_name | TEXT | â€” | Last name |
| email | TEXT | UNIQUE | Email address |
| department | TEXT | CHECK IN ('SHS', 'COLLEGE') | Primary department |
| is_shared | INTEGER | DEFAULT 0 | Whether personnel is shared across departments |
| personnel_type | TEXT | CHECK IN ('FACULTY', 'STAFF', 'ADMIN') | Personnel classification |
| specializations | TEXT | DEFAULT '[]' | JSON array of subject specializations |
| max_weekly_hours | INTEGER | DEFAULT 40 | Maximum weekly teaching/duty hours |
| status | TEXT | DEFAULT 'ACTIVE', CHECK IN ('ACTIVE', 'INACTIVE') | Current status |
| is_active | INTEGER | DEFAULT 1 | Soft delete flag |
| created_at | TEXT | DEFAULT datetime('now') | Creation timestamp |
| updated_at | TEXT | DEFAULT datetime('now') | Last modification timestamp |

### B.8 schedule_entries

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY, UUID | Unique identifier |
| department | TEXT | CHECK IN ('SHS', 'COLLEGE') | Department scope |
| activity_type | TEXT | CHECK IN ('CLASS', 'EXAM', 'OFFICE', 'MEETING', 'EVENT', 'MAINTENANCE') | Entry classification |
| room_id | TEXT | FK â†’ rooms(id), nullable | Assigned room |
| personnel_id | TEXT | FK â†’ personnel(id) | Assigned personnel |
| section_ids | TEXT | â€” | JSON array of section UUIDs |
| subject | TEXT | â€” | Subject name |
| exam_title | TEXT | â€” | Exam title (EXAM type only) |
| exam_type | TEXT | CHECK IN ('Q1_EXAM', 'Q2_EXAM', 'Q3_EXAM', 'Q4_EXAM', 'PRELIM', 'MIDTERM', 'PRE_FINALS', 'FINALS') | Exam classification |
| modality | TEXT | CHECK IN ('F2F', 'ONLINE') | Delivery modality |
| start_time | TEXT | â€” | Start time (HH:MM format) |
| end_time | TEXT | â€” | End time (HH:MM format) |
| recurrence_pattern | TEXT | CHECK IN ('ONCE', 'DAILY', 'WEEKDAYS', 'WEEKLY', 'BI_WEEKLY', 'MWF', 'TTH', 'MTH', 'MONTHLY_DATE', 'MONTHLY_DAY', 'CUSTOM') | Recurrence pattern code |
| recurrence_start_date | TEXT | â€” | Recurrence range start (YYYY-MM-DD) |
| recurrence_end_date | TEXT | â€” | Recurrence range end (YYYY-MM-DD) |
| day_of_week | INTEGER | 0â€“6 | Day of week (0=Sunday) for WEEKLY/BI_WEEKLY/MONTHLY_DAY |
| day_of_month | INTEGER | 1â€“31 | Day of month for MONTHLY_DATE |
| week_of_month | INTEGER | 1â€“4 | Week of month for MONTHLY_DAY |
| custom_days | TEXT | â€” | JSON array of day indices (0â€“6) for CUSTOM pattern |
| academic_year_id | TEXT | FK â†’ academic_years(id) | Associated academic year |
| semester_id | TEXT | FK â†’ semesters(id) | Associated semester |
| source_template_id | TEXT | FK â†’ schedule_templates(id), nullable | Template this entry was generated from |
| status | TEXT | DEFAULT 'DRAFT', CHECK IN ('DRAFT', 'PUBLISHED') | Entry status |
| conflict_flags | TEXT | â€” | JSON array of active conflict flags |
| notes | TEXT | â€” | Additional notes |
| is_active | INTEGER | DEFAULT 1 | Soft delete flag |
| created_at | TEXT | DEFAULT datetime('now') | Creation timestamp |
| updated_at | TEXT | DEFAULT datetime('now') | Last modification timestamp |

### B.9 schedule_audit_log

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY, UUID | Unique identifier |
| schedule_entry_id | TEXT | FK â†’ schedule_entries(id) | Associated schedule entry |
| department | TEXT | CHECK IN ('SHS', 'COLLEGE') | Department scope |
| action | TEXT | CHECK IN ('CREATE', 'UPDATE', 'DELETE', 'OVERRIDE', 'PUBLISH', 'UNPUBLISH') | Mutation type |
| before_snapshot | TEXT | â€” | JSON snapshot of entry before mutation |
| after_snapshot | TEXT | â€” | JSON snapshot of entry after mutation |
| conflict_snapshot | TEXT | â€” | JSON snapshot of active conflicts |
| override_reason | TEXT | â€” | Reason for conflict override (nullable) |
| created_at | TEXT | â€” | Timestamp of audit record creation |

**Table Constraint:** Append-only â€” no UPDATE or DELETE operations permitted.

### B.10 schedule_templates

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY, UUID | Unique identifier |
| name | TEXT | UNIQUE, min 3 chars | Template name |
| description | TEXT | â€” | Template description |
| department_scope | TEXT | CHECK IN ('SHS', 'COLLEGE', 'CROSS_DEPARTMENT') | Which departments can use this template |
| scope | TEXT | CHECK IN ('ALL_ENTRIES', 'CLASS_ONLY', 'EXAM_ONLY') | Which entry types are included |
| source_department | TEXT | CHECK IN ('SHS', 'COLLEGE') | Department of source entries |
| source_academic_year_label | TEXT | â€” | Label of source academic year |
| source_semester_name | TEXT | â€” | Name of source semester |
| is_active | INTEGER | DEFAULT 1 | Soft delete flag |
| created_at | TEXT | DEFAULT datetime('now') | Creation timestamp |
| updated_at | TEXT | DEFAULT datetime('now') | Last modification timestamp |

### B.11 schedule_template_entries

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY, UUID | Unique identifier |
| template_id | TEXT | FK â†’ schedule_templates(id) | Parent template |
| activity_type | TEXT | CHECK IN ('CLASS', 'EXAM', 'OFFICE', 'MEETING', 'EVENT', 'MAINTENANCE') | Entry classification |
| room_id | TEXT | FK â†’ rooms(id), nullable | Assigned room |
| personnel_id | TEXT | FK â†’ personnel(id), nullable | Assigned personnel |
| section_ids | TEXT | â€” | JSON array of section UUIDs |
| subject | TEXT | â€” | Subject name |
| exam_title | TEXT | â€” | Exam title |
| exam_type | TEXT | CHECK IN ('Q1_EXAM', 'Q2_EXAM', 'Q3_EXAM', 'Q4_EXAM', 'PRELIM', 'MIDTERM', 'PRE_FINALS', 'FINALS') | Exam classification |
| modality | TEXT | CHECK IN ('F2F', 'ONLINE') | Delivery modality |
| start_time | TEXT | â€” | Start time (HH:MM) |
| end_time | TEXT | â€” | End time (HH:MM) |
| recurrence_pattern | TEXT | CHECK IN ('ONCE', 'DAILY', 'WEEKDAYS', 'WEEKLY', 'BI_WEEKLY', 'MWF', 'TTH', 'MTH', 'MONTHLY_DATE', 'MONTHLY_DAY', 'CUSTOM') | Recurrence pattern code |
| day_of_week | INTEGER | â€” | Day of week (0â€“6) |
| day_of_month | INTEGER | â€” | Day of month (1â€“31) |
| week_of_month | INTEGER | â€” | Week of month (1â€“4) |
| custom_days | TEXT | â€” | JSON array of day indices |
| notes | TEXT | â€” | Additional notes |
| is_active | INTEGER | DEFAULT 1 | Soft delete flag |
| created_at | TEXT | DEFAULT datetime('now') | Creation timestamp |
| updated_at | TEXT | DEFAULT datetime('now') | Last modification timestamp |

### B.12 schedule_template_applications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY, UUID | Unique identifier |
| template_id | TEXT | FK â†’ schedule_templates(id) | Applied template |
| target_academic_year_id | TEXT | FK â†’ academic_years(id) | Target academic year |
| target_semester_id | TEXT | FK â†’ semesters(id) | Target semester |
| applied_at | TEXT | DEFAULT datetime('now') | Application timestamp |
| entry_count | INTEGER | â€” | Number of entries generated |
| conflict_count | INTEGER | â€” | Number of entries with conflicts |

### B.13 import_jobs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY, UUID | Unique identifier |
| target | TEXT | CHECK IN ('PERSONNEL', 'SECTIONS', 'ROOMS', 'CALENDAR_EVENTS') | Import target type |
| department | TEXT | CHECK IN ('SHS', 'COLLEGE'), nullable | Department context (null for Rooms/Calendar Events) |
| file_name | TEXT | â€” | Original file name |
| total_rows | INTEGER | â€” | Total rows in file |
| rows_created | INTEGER | DEFAULT 0 | Rows inserted |
| rows_updated | INTEGER | DEFAULT 0 | Rows upserted |
| rows_skipped | INTEGER | DEFAULT 0 | Rows skipped due to errors |
| error_details | TEXT | â€” | JSON array of row-level errors |
| academic_year_id | TEXT | FK â†’ academic_years(id), nullable | Associated academic year (Sections only) |
| semester_id | TEXT | FK â†’ semesters(id), nullable | Associated semester (Sections only) |
| created_at | TEXT | â€” | Import timestamp |

### B.14 SQLite PRAGMAs

| PRAGMA | Value | Purpose |
|--------|-------|---------|
| journal_mode | WAL | Write-Ahead Logging for durability and concurrent read performance |
| foreign_keys | ON | Enforce foreign key constraints |
| busy_timeout | 5000 | Wait up to 5 seconds for locked database before returning SQLITE_BUSY |
| synchronous | NORMAL | Balance between durability and write performance |
| cache_size | -64000 | 64 MB page cache (negative value = kilobytes) |

---

## Appendix C: Reference Tables

### C.1 Activity Type Classification

| Activity Type | Dept. Scoped | Requires Active Semester | Room Required | Recurrence Allowed | Description |
|---|---|---|---|---|---|
| CLASS | Yes | Yes | F2F only | All patterns | Regular instructional period |
| EXAM | Yes | Yes | Always | ONCE only | Examination period |
| OFFICE | Yes | Yes | F2F only | All except ONCE | Office hours |
| MEETING | Yes | No | F2F only | All patterns | Faculty/staff meeting |
| EVENT | Yes | No | Optional | ONCE | Institutional event |
| MAINTENANCE | No (system-wide) | No | Always | ONCE | Room/facility maintenance |

### C.2 Recurrence Pattern Reference

| Pattern Code | Label | Day Fields Used | Range Required | Notes |
|---|---|---|---|---|
| ONCE | One-Time | â€” | No | recurrence_start_date is the single occurrence |
| DAILY | Every Day | â€” | Yes | All calendar days |
| WEEKDAYS | Every Weekday | â€” | Yes | Monâ€“Fri only |
| WEEKLY | Weekly | day_of_week | Yes | Same weekday each week |
| BI_WEEKLY | Bi-Weekly | day_of_week | Yes | Every other week |
| MWF | Mon/Wed/Fri | â€” | Yes | Standard 3-day pattern |
| TTH | Tue/Thu | â€” | Yes | Standard 2-day pattern |
| MTH | Mon/Thu | â€” | Yes | Alternate 2-day pattern |
| MONTHLY_DATE | Monthly (date) | day_of_month | Yes | e.g., every 15th |
| MONTHLY_DAY | Monthly (weekday) | day_of_week, week_of_month | Yes | e.g., 2nd Monday |
| CUSTOM | Custom Days | custom_days[] | Yes | Any weekday combination |

### C.3 Conflict Detector Reference

| # | Code | Severity | Cross-Dept? | Description |
|---|---|---|---|---|
| 1 | room_conflict | HARD | Yes | Same room, overlapping time |
| 2 | personnel_conflict | HARD | Shared | Same personnel, overlapping time |
| 3 | section_conflict | HARD | Same dept | Same section, overlapping time |
| 4 | blocked_by_event | HARD | Both | Overlaps blocking calendar event |
| 5 | personnel_overload | HARD | Global | Weekly hours >100% of cap |
| 6 | capacity_exceeded | SOFT | No | Room capacity < student count |
| 7 | workload_approaching | SOFT | Global | Weekly hours 80â€“100% of cap |
| 8 | specialization_mismatch | SOFT | No | Subject not in specializations |
| 9 | room_unavailable | HARD | Yes | Room MAINTENANCE/INACTIVE |
| 10 | room_dept_mismatch | HARD | Yes | Room restricted to other dept |
| 11 | personnel_dept_mismatch | SOFT | Yes | Non-shared in wrong dept |
| 12 | exam_period_mismatch | SOFT | Both | EXAM outside EXAM_PERIOD event |
| 13 | exam_quarter_mismatch | SOFT | SHS only | SHS EXAM outside quarter window |

### C.4 Export Format Matrix

| Export Type | PDF | CSV | XLSX |
|---|---|---|---|
| Schedule by Resource | âœ“ | âœ“ | âœ“ |
| Academic Calendar | âœ“ | âœ“ | â€” |
| Personnel Load Report | âœ“ | â€” | âœ“ |
| Room Utilization Report | âœ“ | â€” | âœ“ |
| Section Schedule | âœ“ | â€” | â€” |
| Examination Schedule | âœ“ | â€” | âœ“ |

### C.5 Import Target Summary

| Target | Upsert Key | Dept Required | FK Lookups | Notes |
|---|---|---|---|---|
| Personnel | employee_id | Yes | None | department column in file |
| Sections | section_code + dept + term | Yes (set in UI) | adviser_employee_id | strand_track required for SHS; subject required for College |
| Rooms | room_code | No (system-wide) | None | department_availability in file |
| Calendar Events | title + date | No (institution-wide) | None | No department column |

### C.6 Department Comparison

| Attribute | SHS | College |
|---|---|---|
| School Year | June â€“ March | August â€“ May |
| Semesters | 1st Semester, 2nd Semester | 1st Semester, 2nd Semester, Summer |
| Summer | Not allowed | Allowed |
| Quarter System | Q1â€“Q4 (2 per semester) | None |
| Exam Types | Q1_EXAM, Q2_EXAM, Q3_EXAM, Q4_EXAM | PRELIM, MIDTERM, PRE_FINALS, FINALS |
| Section Model | Homeroom-based | Course-based |
| Period Length Default | 60 minutes | 60â€“90 minutes |

### C.7 Electron Security Checklist

| Setting | Value | Reason |
|---|---|---|
| contextIsolation | true | Prevent renderer from accessing Node.js globals |
| nodeIntegration | false | Block direct require() in renderer |
| sandbox | true | Restrict renderer capabilities |
| webSecurity | true | Enforce same-origin policy |
| preload | Explicit script path | Only expose whitelisted APIs via context bridge |
| allowRunningInsecureContent | false | Block mixed content |

### C.8 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Desktop Shell | Electron | Native window, file system, IPC, lifecycle |
| UI Framework | React (18+) | Component-based rendering |
| Routing | React Router (v6+) | Client-side SPA navigation |
| Styling | Tailwind CSS (v3+) | Utility-first CSS |
| Database | SQLite via better-sqlite3 | Embedded relational database |
| Build Tool | Vite | Fast frontend build with HMR |
| Packaging | electron-builder | Windows installer generation |
| Password Hashing | bcryptjs | Pure JavaScript bcrypt implementation |
| UUID | uuid (v4) | Primary key generation |
| CSV/XLSX I/O | xlsx (SheetJS) | Import/export file parsing and generation |
| PDF Generation | jspdf + jspdf-autotable | Export reports as PDF documents |

### C.9 Database File Locations

| File | Location | Purpose |
|---|---|---|
| Active database | `app.getPath('userData')/schedule-manager.db` | Primary application data |
| Auto-backups | `app.getPath('userData')/backups/` | Rolling auto-backup directory (max 5 files) |
| Manual backups | User-selected path via native save dialog | On-demand snapshots |

---

> **Document Rules:**
> - Fill in all sections relevant to your project. Mark irrelevant sections "Not applicable" â€” do not delete them.
> - Italic text is guidance â€” replace it with actual content.
> - Every requirement ID must be unique and sequential. Never reuse or renumber IDs.
> - Only document what this version builds. If it's not in this document, it doesn't get built.
> - **Before SRS is approved:** features can be added, modified, or removed directly. No CR needed.
> - **After SRS is approved:** all changes require a CR. The CR author updates the SRS and bumps the version. Updated SRS goes directly to Approved.
> - **Emergency changes:** edit the SRS immediately, file the CR retroactively within 48 hours. The retroactive CR must include a "Retroactive" label in the title (e.g., `CR-015_retroactive-fix-conflict-detection`) and document: (1) what was changed, (2) why it couldn't wait for normal CR approval, (3) which FRs/NFRs were affected. Stakeholders review the retroactive CR within 5 business days. If rejected, the emergency change must be reverted.
> - Acceptance criteria must be specific enough to derive a test case or assert in code.
> - Acceptance criteria use "When [trigger], [result]" behavioral format. Do not include API endpoint paths, HTTP status codes, or request/response payloads â€” those belong in the backlog's Technical AC section.
> - Acceptance criteria must match the behavioral scope of the sub-requirements they verify. Every sub-requirement must have at least one AC. Every AC must trace to at least one sub-requirement. If an edge case deserves testing but isn't covered by any sub-requirement, add the sub-requirement first â€” then write the AC.
> - **AC numbering:** Acceptance criteria within each FR block are numbered sequentially (AC-1, AC-2, ...). IDs are stable â€” never renumber existing ACs when adding or removing criteria. New ACs receive the next available number. Cross-feature flows and backlog technical ACs reference SRS ACs using `FR-XX AC-N` format.
> - When used with AI agents: point the agent to this document as the single source of truth. The agent should never invent requirements â€” only implement what is documented here. Check the backlog for Technical ACs that provide API-level test specifics.
> - **Phase enforcement (SC-PHASE):** This project has a single phase (Phase 1) containing all 22 FRs. All FRs are Priority: Must and must reach Verified status before the product is considered complete. If future phases are added, define phase gates: Phase N+1 FRs cannot begin implementation until all Phase N "Must" priority FRs reach Verified status. "Should"/"Could" FRs that miss the phase deadline are deferred via CR.
> - **Glossary authority (Â§2):** The SRS Glossary is the authoritative definition source. If the PRD, Architecture doc, or any other document uses a term differently, the SRS Glossary definition wins. Glossary terms used in FR sub-requirements must use the exact term as defined â€” do not paraphrase or use synonyms. When a new term is introduced in an FR block, add it to the Glossary immediately. AI agents should resolve ambiguous terms by consulting the Glossary before asking.
> - **External interface sync (Â§7):** The SRS external interface table captures the integration's behavioral contract. The Architecture doc refines these into detailed API specifications. If the Architecture doc changes an interface detail, the SRS Â§7.2 table must be updated to stay consistent (via CR if the SRS is Approved). The two must never contradict â€” a contradiction means one is stale.
> - **Version numbering:** Version 0.x (e.g., v0.1, v0.9) indicates the SRS is in Draft or In Review status and has never been Approved. The first approval bumps the version to v1.0. Subsequent CR-driven updates increment the minor version (v1.0 â†’ v1.1 â†’ v1.2). A major version bump (v1.x â†’ v2.0) is reserved for complete product redesigns where the majority of requirements are rewritten. The version number in the filename must always match the version in the header.
> - **Compliance prerequisite (PRD Â§6.2/6.3):** Before drafting the SRS, verify that the PRD's Â§6.2 Regulatory Constraints and Â§6.3 Compliance Red Lines are filled. For this project, PRD_ScheduleManagement.md Â§6.2 and Â§6.3 are marked N/A (offline desktop app, no user data collection, no payments, no network). Every FR that handles user data, payments, content moderation, or age-restricted content must be cross-checked against these constraints. A feature that violates a Compliance Red Line must be redesigned â€” do not approve the SRS with known red-line violations.

