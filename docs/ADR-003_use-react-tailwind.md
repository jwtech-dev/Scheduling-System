# Architecture Decision Record

| Field    | Value                                        |
|----------|----------------------------------------------|
| ADR      | ADR-003                                      |
| Title    | Use React 18 + Tailwind CSS v3 for the Renderer UI |
| Date     | 2026-05-27                                   |
| Status   | Accepted                                     |
| Deciders | Developer (Tech Lead)                        |
| Version  | 1.0                                          |
| References | VibeLock System Guide · [Architecture doc](../Architecture_ScheduleManagement.md) |
| Supersedes | —                                          |
| Superseded By | —                                      |

---

## Context

The Schedule Management System's renderer process (Electron/Chromium) needs a UI framework to build:

- Complex, multi-field forms with dynamic field visibility per activity type (CLASS, EXAM, MEETING, OFFICE)
- Paginated, sortable, filterable data tables for all entity types
- Weekly schedule grid views for rooms, sections, and personnel
- Calendar views (monthly, weekly, daily) for academic events and exam schedules
- Department-conditional layouts (SHS vs College field differences)
- Modal dialogs, toast notifications, confirmation dialogs, empty states
- Client-side routing between 15+ pages

The UI must be responsive across 1024px–1920px screen widths and support keyboard-only operation (NFR-U-002).

---

## Decision

We will use **React 18** as the UI framework with **Tailwind CSS v3** for styling, bundled by **Vite** for fast development builds.

React's component model enables reusable form fields, data tables, and schedule grids. Tailwind's utility-first CSS approach allows rapid styling without writing custom CSS files. Vite provides fast HMR (Hot Module Replacement) during development.

Routing will use **React Router v6** for client-side navigation within the Electron renderer process.

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| React 18 + Tailwind CSS (chosen) | Large ecosystem, mature component model, excellent form handling, utility-first CSS for rapid styling, Vite HMR for fast development, team familiarity | Larger runtime than Svelte, JSX learning curve (not an issue for this team) |
| Vue 3 + UnoCSS | Comparable to React, good reactivity model, composition API | Less team familiarity, smaller ecosystem for complex desktop-style components |
| Svelte + SvelteKit | Smallest bundle size, no virtual DOM overhead, reactive by default | Smaller ecosystem for complex data grids and calendar components, less community support for edge cases |
| Vanilla JS + custom CSS | Maximum control, no framework overhead | Unmaintainable at this scale (15+ pages, 20+ components, complex form logic), no component reuse |

---

## Consequences

### Positive

- **Component reuse** — DataTable, Modal, WeeklyGrid, FormField components reused across all entity pages
- **Ecosystem** — React has well-documented patterns for complex forms, dynamic field visibility, and state management
- **Tailwind CSS** — Utility classes eliminate CSS naming collisions and enable consistent spacing/sizing across all components
- **Vite HMR** — Sub-second feedback loop during development
- **React Router v6** — Declarative routing with auth guards and nested layouts

### Negative

- **Bundle size** — React adds ~40KB gzipped to the renderer bundle. Acceptable for a desktop app.
- **Virtual DOM overhead** — React's reconciliation has minor overhead vs. Svelte's compile-time reactivity. Not significant for this app's UI complexity.
- **Tailwind class verbosity** — Long class strings in JSX. Mitigated by component extraction and consistent design tokens in `tailwind.config.js`.

### Risks

- **Tailwind version drift:** Tailwind CSS v4 introduces breaking changes (CSS-first config). Mitigation: pin to v3, upgrade only when needed.
- **React 19 migration:** React 19 may change concurrent mode defaults. Mitigation: use stable React 18 APIs only, avoid experimental features.

---

## External References

- [React 18 Documentation](https://react.dev)
- [Tailwind CSS v3 Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Router v6 Documentation](https://reactrouter.com)
- SRS §7.1: User Interfaces (route table, breakpoints, design direction)
- SRS NFR-U-001 through NFR-U-008 (Usability requirements)

---

**ADR Rules**

- One decision per ADR. If a decision involves multiple independent choices, create separate records.
- ADRs are immutable once accepted. To change a decision, create a new ADR that supersedes the original. Update the original's Status to "Superseded", fill its "Superseded By" field, and fill the new ADR's "Supersedes" field. Both references must point to each other.
- Store all ADRs in `docs/` within the project repository, numbered sequentially.
- Keep each ADR to ≤500 words in the Decision + Rationale sections combined. ADRs are decision records, not design documents. Move detailed analysis to appendices or linked documents.
- **Bidirectional link enforcement:** Every accepted ADR must be linked from the Architecture doc's Tech Stack table or Resolved Design Questions table. When creating a new ADR, also update the Architecture doc to reference it. An accepted ADR with no Architecture doc link is a compliance gap.
