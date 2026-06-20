# Documentation Compliance Checklist

> **Project standard for Documentation Verification**
> **Version:** 3.0 (VibeLock Edition)
> **Last Updated:** 2026-06-20
> **References:** VibeLock System Guide

**How to Run This Checklist:**
1. Run this checklist against your project documentation. Do not copy this file into project directories — it is a system-level reference file.
2. Check items sequentially within each section.
3. Record pass/fail with evidence for each item (e.g., file path + section verified). For FAIL items, include: the checklist item number, the file and section checked, and the specific text or absence that caused the failure.
4. Record the checklist results in your project's verification report or as a summary in `docs/specs/`. This file stays in the VibeLock directory.

Use this checklist to verify that a project's documentation meets the project standard before major milestones (SRS approval, **launch readiness**, release, audit).

---

## Single-Platform Compliance

*Every project must satisfy these checks regardless of platform count.*

### Document Existence

- [ ] `PROJECT_RULES.md` exists at project root
- [ ] `PROJECT_RULES.md` is under 400 lines
- [ ] `PROJECT_RULES.md` includes documentation table with paths to all project docs
- [ ] `PROJECT_RULES.md` Code Standards section is filled (naming conventions, principles, hardcoded values, comments, error handling, imports)
- [ ] `PROJECT_RULES.md` Code Standards TypeScript Addendum is active (for TypeScript projects only)
- [ ] PRD exists in `docs/specs/` following naming convention (`PRD_[ProjectName].md`)
- [ ] SRS exists in `docs/specs/` following naming convention (`SRS_[Project]_v[X.X].md`)
- [ ] Architecture doc exists in `docs/specs/` following naming convention (`Architecture_[ProjectName].md`)
- [ ] `docs/specs/adr/` directory exists (even if empty — use `.gitkeep`)
- [ ] `docs/specs/change-requests/` directory exists (even if empty — use `.gitkeep`)

### SRS Quality

- [ ] All sections from the SRS template are filled or explicitly marked "N/A"
- [ ] Every functional requirement has a unique ID (FR-XX.Y format)
- [ ] Every functional requirement is testable (has acceptance criteria)
- [ ] Every acceptance criterion has a concrete measurable outcome — a specific value, count, time limit, error message, or state name
- [ ] Every acceptance criterion uses "When [trigger], [result]" behavioral format
- [ ] No acceptance criterion contains API endpoint paths, HTTP status codes, or request/response payloads
- [ ] Edge cases, error states, and anti-patterns are documented for each FR
- [ ] Non-functional requirements have numeric targets and measurement methods
- [ ] System constraints are documented
- [ ] Glossary defines all domain-specific terms
- [ ] Every sub-requirement has at least one acceptance criterion
- [ ] Every acceptance criterion traces to at least one sub-requirement
- [ ] Acceptance criteria within each FR block are numbered sequentially (AC-1, AC-2, ...)
- [ ] Cross-Feature Flow AC references use `FR-XX AC-N` format and point to existing ACs
- [ ] Cross-Feature Flows documented for flows spanning 3+ FRs
- [ ] §6.1 Assumptions section is filled (not empty)
- [ ] NFR IDs follow `NFR-[Category]-[NNN]` convention
- [ ] NFR Degraded State column is filled for all NFRs
- [ ] Traceability matrix exists and tracks every FR and NFR
- [ ] Change History table exists (even if only "Initial draft" entry)

### SRS Approval

- [ ] SRS has been through the status lifecycle (Draft → In Review → Approved)
- [ ] Approval per governance model in PROJECT_RULES.md is recorded (for solo/duo teams: self-review with documented checklist pass)
- [ ] SRS version number follows convention (major.minor)

### Architecture Doc Quality

- [ ] High-level architecture diagram is present and reflects the current system structure
- [ ] Tech stack table lists all technologies with ADR links for rationale
- [ ] Domain model / ERD is documented
- [ ] Service boundaries are defined
- [ ] API surface (key endpoints) is documented
- [ ] Security design is documented
- [ ] Architecture doc `Reflects SRS` version matches the current SRS version
- [ ] Architecture doc `Last Reviewed` date is within 30 days of the last SRS version change
- [ ] Every entity named in any SRS FR Data Model Reference field exists in the Architecture doc's §3 Domain Model, using the exact same name (case-sensitive)
- [ ] Every entity in the Architecture §3 Domain Model is referenced by at least one SRS FR, or marked "Infrastructure-only (no direct FR mapping)"

### ADR Quality

- [ ] All decisions that meet the ADR criteria (choosing between alternatives, hard to reverse, affects 3+ components) have corresponding ADRs
- [ ] Each ADR follows the template (Context, Decision, Alternatives, Consequences)
- [ ] ADRs are numbered sequentially (`ADR-[NNN]`)
- [ ] Accepted ADRs are immutable — superseded with new ADRs when decisions change
- [ ] Superseded ADRs have both `Superseded By` field filled AND status set to "Superseded"
- [ ] Superseding ADRs have `Supersedes` field pointing back to the original ADR
- [ ] ADRs stored in `docs/specs/adr/`

### CR Quality *(if SRS is Approved and changes have been made)*

- [ ] Each CR follows the template (Summary, Problem, Solution, Impact, Alternatives, Approval)
- [ ] CRs are numbered sequentially (`CR-[NNN]`)
- [ ] Approved CRs have corresponding SRS updates (version bump, Change History entry)
- [ ] SRS traceability matrix reflects CR-affected FR status resets
- [ ] CRs stored in `docs/specs/change-requests/`

### Naming Conventions

- [ ] All documents follow the naming conventions defined in the VibeLock System Guide §6
- [ ] ADR and CR numbers are sequential and never reused
- [ ] SRS version follows major.minor convention

---

### Backlog Quality *(if backlog exists)*

- [ ] `docs/backlog.md` exists following the Backlog template
- [ ] Every task references an SRS FR (e.g., "FR-05")
- [ ] Technical ACs (if present) map to a behavioral AC in the referenced SRS FR
- [ ] No technical AC tests behavior outside the scope of the SRS acceptance criteria

---

### Legal & Compliance *(if project handles user data, payments, or UGC)*

> N/A — Offline desktop application with no external users, no data collection, and no network access.

#### Legal Planning

- [ ] `docs/legal/` directory exists
- [ ] Legal Compliance Strategy exists (`docs/legal/Legal_Compliance_Strategy.md`)
- [ ] All sections of the Legal Compliance Strategy are filled or marked "N/A"
- [ ] Regulatory landscape identifies all applicable jurisdictions and laws
- [ ] Required Documents table lists all needed legal documents with status and deadlines
- [ ] Data Handling Summary cross-references SRS data retention NFRs
- [ ] PRD §8 Legal & Compliance Summary exists and status table is current

#### Compliance Integration

- [ ] PRD §6.2 Regulatory Constraints is filled (not empty or placeholder)
- [ ] PRD §6.3 Compliance Red Lines is filled (not empty or placeholder)
- [ ] Every FR handling user data, payments, or content moderation has been cross-checked against PRD §6.2
- [ ] No FR violates any PRD §6.3 Compliance Red Line
- [ ] Legal Documents (if drafted) are consistent with SRS FR behaviors
- [ ] Legal Compliance Strategy timeline is consistent with PRD §4 phase dates

#### Legal Document Quality *(if legal documents are drafted)*

- [ ] Each legal document follows the Legal Documents Template outline
- [ ] All conditional sections have been evaluated (included or deleted with rationale)
- [ ] Legal documents cross-reference SRS system constraints (refund terms, deletion policy, data retention)
- [ ] Legal documents have been through the approval lifecycle (Draft → In Review → Approved). For solo/duo teams: self-review with documented risk-acceptance is acceptable — record decision in Legal Compliance Strategy Change History.
- [ ] Majority approval (2 of 3 stakeholders) is recorded for each legal document. For solo/duo teams: self-review approval recorded.
- [ ] Attorney review trigger is documented (e.g., revenue milestone, BIR compliance, or time-based deadline)
- [ ] Change History table exists in each legal document
- [ ] Published legal documents are accessible from registration page and site footer
- [ ] Registration consent flow captures ToS + Privacy Policy acceptance with stored timestamp

#### Legal Document Governance *(if legal documents are Approved)*

- [ ] Changes to approved legal documents go through CRs
- [ ] CRs targeting legal documents have 'User Notification Required' field filled (not N/A)
- [ ] `PROJECT_RULES.md` documentation table includes legal doc paths
- [ ] `PROJECT_RULES.md` boundaries include legal doc modification constraints

---

### Launch Readiness *(before each launch milestone)*

- [ ] Launch Readiness Checklist exists (`docs/specs/Launch_Readiness_Checklist.md`)
- [ ] Launch Type is specified (Closed Beta / Public Launch / Major Version)
- [ ] All checklist items applicable to the Launch Type are completed or explicitly waived
- [ ] Waived items have documented rationale
- [ ] SRS traceability matrix shows all current-phase FRs as "Verified"
- [ ] PRD §7 Launch Strategy exit criteria are met
- [ ] Go/No-Go decision is recorded with approval per governance model in PROJECT_RULES.md

---

### UI/UX Specification Quality *(if UIUX spec exists)*

> N/A — No UIUX specification document exists for this project. UI is built directly from SRS acceptance criteria.

---

## Multi-Platform Compliance *(Optional)*

> **Multi-Platform (Optional):** The following checks apply only to projects targeting more than one platform. Single-platform projects can skip this entire section.

### Platform Addendum Existence

- [ ] An SRS Platform Addendum exists for each non-primary platform
- [ ] Addendum follows naming convention: `SRS_[Project]_[Platform]_Addendum_v[X.X].md`
- [ ] Addendum is stored in `docs/specs/` alongside the shared SRS
- [ ] `PROJECT_RULES.md` documentation table includes a row for each addendum

### Addendum Quality

- [ ] Addendum header declares `Targets SRS: v[X.X]` — the parent SRS version
- [ ] `Targets SRS` version matches the current shared SRS version
- [ ] All sections from the SRS Addendum template are filled or marked "N/A"
- [ ] Scope section clearly defines what the addendum covers vs. what the shared SRS covers

### FR ID Conventions

- [ ] FR overrides use the `FR-XX-P` convention (e.g., `FR-01-M` for mobile override of shared FR-01)
- [ ] Platform-only features use the `FR-P-XX` convention (e.g., `FR-M-01` for first mobile-only feature)
- [ ] Each override explicitly references the parent FR it modifies
- [ ] FR IDs are unique — no collision between shared SRS IDs and addendum IDs

### Anti-Duplication

- [ ] No requirement in the addendum duplicates a shared SRS requirement verbatim
- [ ] The addendum contains ONLY platform-specific deltas — not shared behavior
- [ ] Requirements that are 100% shared appear ONLY in the shared SRS
- [ ] Override FRs document only what is DIFFERENT — not the full shared behavior

### Traceability

- [ ] The shared SRS traceability matrix includes a `Platform` column
- [ ] Platform column values are consistent: `All` (shared), `Web`, `Mobile`, etc.
- [ ] Addendum FRs (`FR-XX-P`, `FR-P-XX`) are tracked in the shared SRS traceability matrix
- [ ] Each addendum FR status is tracked (Not Started / In Progress / Implemented / Verified)

### Governance

- [ ] Addendum follows the same approval lifecycle as the SRS (Draft → In Review → Approved)
- [ ] Addendum approval is recorded (majority 2 of 3 stakeholders)
- [ ] Changes to the addendum after approval go through CRs
- [ ] An ADR exists documenting the multi-platform decision

### Architecture & PRD Alignment

- [ ] Architecture doc includes platform-specific sections (deployment, native integration, security)
- [ ] PRD roadmap includes platform-specific phases
- [ ] ADR metadata includes `Platform` field for platform-scoped decisions

### Version Synchronization

- [ ] When the shared SRS version bumps, the addendum's `Targets SRS` field is updated
- [ ] All overridden FRs are reviewed for stale references when the parent SRS bumps
- [ ] Addendum version is bumped when parent SRS changes affect overridden FRs

---

> **Checklist Rules:**
> - Run this checklist before each SRS approval, major release, launch readiness, or documentation audit.
> - All "Single-Platform Compliance" checks are mandatory for every project.
> - "Legal & Compliance" checks apply to projects handling user data, payments, or user-generated content.
> - "Launch Readiness" checks apply before each launch milestone.
> - "Multi-Platform Compliance" checks apply only to projects with platform addendums.
> - Failed checks should be resolved before proceeding with the milestone.
> - This checklist is version-controlled alongside the templates.
