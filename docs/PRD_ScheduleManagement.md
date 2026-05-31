# Product Requirements Document (PRD)

> **Product:** Schedule Management System
> **Last Updated:** 2026-05-27
> **Owner:** Developer
> **References:** [SRS_ScheduleManagement_v0.1.md](SRS_ScheduleManagement_v0.1.md) *(downstream)*

---

## 1. Product Vision

The Schedule Management System is a standalone offline desktop application designed for academic institutions with dual departments (Senior High School and College). It replaces manual scheduling workflows — spreadsheets, paper-based timetables, and ad-hoc coordination — with a structured, conflict-aware system operated by a single administrator. Success means: zero double-booked rooms, complete audit trails, and schedule preparation time reduced from days to hours.

---

## 2. Target Users

| User Type | Description | Primary Need |
|-----------|-------------|-------------|
| Institutional Administrator | Single user responsible for all scheduling operations across SHS and College departments. Non-technical. | Create, manage, and publish conflict-free class and exam schedules with minimal manual effort. |

---

## 3. Success Metrics

Not applicable — internal institutional tool. No external users, no revenue, no growth metrics.

---

## 4. Roadmap

### 4.1 Phase Overview

| Phase | Focus | Key Deliverables | Target Timeline |
|-------|-------|-----------------|----------------|
| 1 | Full MVP | All 19 FRs (FR-01 through FR-19) — complete scheduling system | TBD |

### 4.2 Phase Goals & Exit Criteria

**Phase 1: Full MVP**

- **Goal:** Deliver a fully functional offline scheduling desktop application.
- **FR scope:** FR-01 through FR-19 (all functional requirements)
- **Exit criteria:**
  - Administrator can create, validate, and publish conflict-free schedules for both SHS and College departments
  - All 13 conflict detectors operational
  - Data import/export working for CSV and Excel formats
  - Backup and restore functional via SQLite Backup API
  - All "Must" priority FR acceptance criteria pass
- **Key risks:**
  - Complex conflict detection across two independent department calendars
  - Electron + better-sqlite3 native module rebuild for target platform

### 4.3 Parking Lot

No deferred features. All planned features are in Phase 1.

| Idea | Source | Rationale for Deferral | Earliest Phase |
|------|--------|----------------------|----------------|
| Multi-user support | Future consideration | Single-admin design is intentional for v1 | Post-v1 |
| Cloud sync | Future consideration | Fully offline is a core design constraint | Post-v1 |

---

## 5. Competitors and Inspiration

Not applicable — this is an internal institutional tool for a specific academic scheduling workflow. No direct commercial competitors evaluated.

---

## 6. Constraints

### 6.1 Business Constraints

| Constraint | Detail |
|-----------|--------|
| Solo developer | Single developer builds and maintains the system. No dedicated QA or design team. |
| No budget | No external services, no paid APIs, no cloud hosting. All tools must be free or open-source. |
| Windows-only | Target institution uses Windows exclusively. No macOS or Linux support required. |

### 6.2 Regulatory Constraints

Not applicable. This is a fully offline desktop application that:
- Collects no user data beyond a single admin password hash stored locally
- Makes no network requests
- Processes no payments
- Has no external users, no public-facing content, no user-generated content
- Stores only institutional scheduling data (rooms, sections, personnel schedules) — no student PII

No applicable laws or regulations have been identified that constrain the SRS requirements.

| Law / Regulation | Jurisdiction | Requirement | Impact on Product |
|-----------------|-------------|-------------|-------------------|
| None identified | N/A | N/A | N/A |

### 6.3 Compliance Red Lines

Not applicable. No external users, no data collection, no network access, no payments. No compliance red lines have been identified.

| Red Line | Reason | Affected Features |
|----------|--------|-------------------|
| None identified | N/A | N/A |

---

## 7. Launch Strategy

Not applicable — this is a locally-installed desktop application distributed directly to the target institution. No staged rollout, no beta program, no public launch.

### 7.1 Pre-Launch

Not applicable.

### 7.2 Launch Criteria

| Criterion | Threshold | How Measured |
|-----------|-----------|-------------|
| All Phase 1 FRs verified | 19/19 FR ACs pass | SRS traceability matrix |
| Windows installer builds successfully | .exe installs and runs on target machine | Manual test |
| Database migrations run on fresh install | Schema created, first-run setup completes | Manual test |

### 7.3 Rollout Plan

Direct installation on the target institution's Windows machines. No staged rollout.

### 7.4 Post-Launch

Not applicable — no external metrics to monitor.

---

## 8. Legal & Compliance Summary

Not applicable. This is a fully offline institutional tool with no external users, no data collection beyond local admin credentials, and no network connectivity. No legal documents are required.

| Document | Status | Owner | Deadline | Location |
|----------|--------|-------|----------|----------|
| Terms of Service | N/A | — | — | N/A — no external users |
| Privacy Policy | N/A | — | — | N/A — no data collection |

**Regulatory requirements:** None identified (see §6.2).

---

> **PRD Rules:**
> - This document is owned by the product owner and updated as the product vision evolves.
> - The PRD is NOT the source of truth for what gets built — the SRS is.
> - When a feature moves from the PRD Parking Lot to the SRS, remove it from the Parking Lot.
> - The PRD does not require formal approval. It is a living strategy document.
> - FR scopes in the Roadmap are reference ranges (e.g., "FR-01–FR-12"). Exact FR-to-Phase mapping is tracked in the SRS traceability matrix.
> - Launch criteria in §7 are strategic goals. The SRS defines the technical enforcement via system constraints.
> - The Legal & Compliance Summary (§8) is a status dashboard — the Legal Compliance Strategy document is the source of truth for legal planning.
> - **§6.2 and §6.3 must be filled before the SRS is drafted.** These sections constrain SRS content. An SRS generated without regulatory constraints risks non-compliant features.
> - **When a new law or regulation is identified** during SRS review, grill sessions, or compliance audits, add it to §6.2 Regulatory Constraints immediately — do not defer.
