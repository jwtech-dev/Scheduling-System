# Schedule Management System — Project Rules

> **Stack:** Electron 33 + React 18 + Tailwind CSS 3 + SQLite (better-sqlite3)
> **Runtime:** electron-vite (Vite 5) · TypeScript 5 · Node.js
> **Last Reviewed:** 2026-06-10

---

## 1 · Environment

| Property        | Value                                                                          |
| --------------- | ------------------------------------------------------------------------------ |
| OS              | Windows (target platform)                                                      |
| Runtime         | Electron (Chromium + Node.js, single-instance lock)                            |
| Package manager | npm (lockfile committed)                                                       |
| Build tool      | electron-vite (Vite 5 under the hood)                                          |
| Database        | SQLite via better-sqlite3 — synchronous, no ORM                               |
| CSS             | Tailwind CSS 3 with custom `primary` / `surface` color scales + Inter font |
| Deployment      | Local installer (.exe via electron-builder)                                    |
| Tests           | Vitest (`npm test`)                                                          |

---

## 2 · Project Structure

```
sched-mng/
├── src/
│   ├── main/               # Electron main process
│   │   ├── index.ts         # App entry, window creation, startup sequence
│   │   ├── database/
│   │   │   ├── connection.ts    # Single DB connection + PRAGMAs
│   │   │   ├── migrator.ts      # Sequential .sql migration runner
│   │   │   └── migrations/      # Numbered .sql files (001_, 002_, …)
│   │   ├── ipc/
│   │   │   ├── registry.ts      # Central handler registry + auth guard
│   │   │   ├── auth-middleware.ts # In-memory isAuthenticated flag
│   │   │   └── handlers/        # One file per domain (room-handlers.ts, …)
│   │   └── services/            # Business logic (room-service.ts, …)
│   ├── preload/
│   │   ├── index.ts         # contextBridge — exposes typed electronAPI
│   │   └── api.ts           # ElectronAPI interface + Window augment
│   ├── renderer/
│   │   ├── index.html
│   │   └── src/
│   │       ├── App.tsx          # HashRouter, lazy routes, provider stack
│   │       ├── main.tsx         # ReactDOM entry
│   │       ├── index.css        # Tailwind directives
│   │       ├── pages/           # One file per route (PascalCase: RoomsPage.tsx)
│   │       ├── components/      # Shared UI (AppShell, ToastProvider, …)
│   │       ├── contexts/        # React contexts (AuthContext, DepartmentContext)
│   │       └── hooks/           # Custom hooks (useScheduleData.ts)
│   └── shared/              # Code shared across all processes
│       ├── types.ts         # All TypeScript types/interfaces
│       ├── ipc-channels.ts  # IPC channel name constants
│       └── constants.ts     # Enums, labels, defaults, field matrix
├── docs/                    # Specs, ADRs, backlog, bug reports
├── electron.vite.config.ts  # Vite config (aliases, migration copy plugin)
├── tailwind.config.js       # Tailwind theme customization
├── package.json
└── PROJECT_RULES.md         # ← This file
```

---

## 3 · File Ownership

#### Do NOT Edit (Generated / Managed)

| File/Dir                                 | Reason                                 |
| ---------------------------------------- | -------------------------------------- |
| `node_modules/`                        | npm-managed                            |
| `out/`                                 | Build output from electron-vite        |
| `dist/`                                | Installer output from electron-builder |
| `*.db`, `*.db-journal`, `*.db-wal` | Runtime SQLite files                   |

#### High Blast Radius (Edit With Care)

| File                              | Impact                                           |
| --------------------------------- | ------------------------------------------------ |
| `src/shared/types.ts`           | All interfaces — touches every layer            |
| `src/shared/ipc-channels.ts`    | IPC channel names — main + preload + renderer   |
| `src/shared/constants.ts`       | Enums, defaults, field matrix — used everywhere |
| `src/preload/api.ts`            | ElectronAPI contract — preload + renderer       |
| `src/main/ipc/registry.ts`      | Central handler wiring + auth guard              |
| `src/main/database/migrations/` | Schema DDL — irreversible once deployed         |

---

## 4 · Architecture Constraints

| Constraint                   | Detail                                                                    |
| ---------------------------- | ------------------------------------------------------------------------- |
| Single SQLite file           | `app.getPath('userData')/schedule-manager.db`                           |
| Synchronous DB               | better-sqlite3 is sync — no `async/await` for DB calls in services     |
| IPC-only communication       | Renderer ↔ Main via context bridge. No direct DB from renderer.          |
| Single-instance lock         | `app.requestSingleInstanceLock()` — one window only                    |
| Sandbox + context isolation  | `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false` |
| No midnight-spanning entries | Schedule entries cannot cross midnight boundary                           |
| In-memory auth               | bcryptjs cost 10.`isAuthenticated` flag in main — no tokens/sessions   |
| Append-only audit log        | DB triggers block UPDATE/DELETE on `audit_log` table                    |

---

## 5 · Naming Conventions

| Layer                 | Convention                                                                                | Examples                                                      |
| --------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Migrations            | `NNN_description.sql` (zero-padded 3-digit)                                             | `001_initial_schema.sql`, `008_subject_code_optional.sql` |
| Services              | `kebab-case.ts`, exported functions are `camelCase`                                   | `room-service.ts` → `listRooms()`, `createRoom()`      |
| IPC Handlers          | `domain-handlers.ts`, exports `registerXxxHandlers()`                                 | `room-handlers.ts` → `registerRoomHandlers()`            |
| IPC Channels          | `domain:verb` (kebab-case)                                                              | `rooms:list`, `schedules:create-draft`                    |
| IPC Channel constants | `SCREAMING_SNAKE`                                                                       | `ROOMS_LIST`, `SCHEDULES_CREATE_DRAFT`                    |
| Shared types          | `PascalCase` interfaces + `SCREAMING_SNAKE` union literals                            | `Room`, `Department = 'SHS' \| 'COLLEGE'`                  |
| React pages           | `PascalCase.tsx`, default export                                                        | `RoomsPage.tsx`, `SchedulePage.tsx`                       |
| React components      | `PascalCase.tsx`                                                                        | `AppShell.tsx`, `ToastProvider.tsx`                       |
| React contexts        | `PascalCase.tsx`, exports Provider + `useXxx` hook                                    | `AuthContext.tsx` → `AuthProvider` + `useAuth()`       |
| React hooks           | `camelCase.ts`                                                                          | `useScheduleData.ts`                                        |
| CSS                   | Tailwind utility classes (no custom CSS files per component)                              | —                                                            |
| Git commits           | Angular conventional:`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:` | `feat: add Subject Bank page`                               |

---

## 6 · Coding Patterns

### 6.1 Adding a New Domain Entity (Full Stack Checklist)

1. **Migration** — New `NNN_xxx.sql` in `src/main/database/migrations/`
2. **Shared types** — Add interface + enums to `src/shared/types.ts`
3. **IPC channels** — Add channel names to `src/shared/ipc-channels.ts`
4. **Service** — New `xxx-service.ts` in `src/main/services/`
5. **Handlers** — New `xxx-handlers.ts` in `src/main/ipc/handlers/`; register in `registry.ts`
6. **Preload** — Add API methods to `src/preload/api.ts` (interface) and `src/preload/index.ts` (impl)
7. **Renderer** — Page in `src/renderer/src/pages/`, route in `App.tsx`, nav item in `AppShell.tsx`

### 6.2 Service Pattern

```typescript
// Get db handle from singleton
const db = getDatabase()

// Parameterized queries ONLY — never interpolate
db.prepare('SELECT * FROM rooms WHERE id = ?').get(id)

// Wrap mutations in transactions
const create = db.transaction(() => {
  db.prepare('INSERT INTO ...').run(...)
  logAudit({ entity_type: '...', entity_id: id, action: 'CREATE', after_snapshot: data })
})
create()

// Error throwing pattern
function throwError(code: string, message: string): never {
  const err = new Error(message)
  ;(err as Error & { code: string }).code = code
  throw err
}
```

### 6.3 IPC Handler Pattern

```typescript
export function registerXxxHandlers(): void {
  registerHandler(IPC_CHANNELS.XXX_LIST, (args) => xxxService.listXxx((args ?? {}) as never))
  registerHandler(IPC_CHANNELS.XXX_GET, (args) => {
    const { id } = args as { id: string }
    return xxxService.getXxx(id)
  })
  // ... create, update, delete follow same shape
}
```

### 6.4 Renderer IPC Calls

```typescript
// Always call through window.electronAPI (typed)
const result = (await window.electronAPI.listRooms(filters)) as IpcResponse<Room[]>
if (result.error) { /* handle error */ }
```

### 6.5 Soft Delete

All entities use soft delete: `archived_at` timestamp + `archived_by` field (added by migration 002). Active records have `is_active = 1 AND archived_at IS NULL`. Permanent deletion only from Trash page.

### 6.6 React Page Structure

Pages are self-contained: state management, IPC calls, forms, and table rendering in one file. Sub-components are extracted to `pages/xxx/` subdirectory when a page grows too large (see `pages/schedule/`).

### 6.7 Context/Provider Pattern

```typescript
const XxxContext = createContext<XxxState | null>(null)
export function XxxProvider({ children }: { children: ReactNode }) { ... }
export function useXxx(): XxxState {
  const ctx = useContext(XxxContext)
  if (!ctx) throw new Error('useXxx must be used within XxxProvider')
  return ctx
}
```

Provider stack order in `App.tsx`: `ErrorBoundary → ToastProvider → ConfirmDialogProvider → SignatoriesModalProvider → AuthProvider → HashRouter`.

---

## 7 · Boundaries

#### Always

| Rule                   | Detail                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| Parameterized queries  | No string interpolation in SQL. Use better-sqlite3 `.prepare().run/get/all()`           |
| Soft delete            | Set `archived_at`. Never hard-delete data outside Trash flows                           |
| Business logic in main | All validation, conflict detection, data access in main process. Renderer is display-only |
| Audit every mutation   | CREATE, UPDATE, DELETE on entities →`logAudit()`. Required per FR-12                   |
| UUID primary keys      | `randomUUID()` for all entity IDs                                                       |
| Transaction wrapping   | All multi-statement mutations wrapped in `db.transaction()`                             |

#### Ask First

| Action                          | Why                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| Modify database schema          | Requires new migration file. May break existing user data                          |
| Change IPC contract             | Touches `ipc-channels.ts` + `api.ts` + preload + handlers — high blast radius |
| Add/remove providers in App.tsx | Provider ordering matters — wrong order breaks context access                     |
| Override HARD conflicts         | Business impact — must provide documented reason per FR-09.8                      |

#### Never

| Action                          | Why                                                                    |
| ------------------------------- | ---------------------------------------------------------------------- |
| Expose Node.js APIs to renderer | `contextIsolation=true`, `nodeIntegration=false`, `sandbox=true` |
| Use `dangerouslySetInnerHTML` | XSS risk in Electron context                                           |
| Use raw `ipcRenderer`         | Always use `window.electronAPI` via context bridge                   |
| Delete audit trail records      | Append-only — protected by DB triggers                                |
| Use async DB libraries          | better-sqlite3 is synchronous by design                                |
| Skip audit logging on mutations | Every data mutation must be audit-logged                               |

---

## 8 · Documentation

| Document     | Path                                        | Purpose                                       |
| ------------ | ------------------------------------------- | --------------------------------------------- |
| PRD          | `docs/PRD_ScheduleManagement.md`          | Product vision, roadmap, constraints          |
| SRS          | `docs/SRS_ScheduleManagement_v1.0.md`     | What this version builds (source of truth)    |
| Architecture | `docs/Architecture_ScheduleManagement.md` | System structure, domain model, services      |
| ADRs         | `docs/ADR-NNN_title.md`                   | Why technical decisions were made (immutable) |
| Backlog      | `docs/backlog.md`                         | Task queue with SRS references                |
| Bug Reports  | `docs/bug-report/`                        | Bug tracking artifacts                        |

**Rules:**

- SRS is the single source of truth. If it's not in the SRS, it doesn't get built.
- ADRs are immutable once accepted. Supersede with a new ADR, never edit.

---

## 9 · Migration Discipline

1. Migrations are **sequential** `.sql` files: `NNN_description.sql`
2. The `_schema_versions` table tracks applied versions — never manually edit
3. Each migration runs in its **own transaction** (all-or-nothing)
4. Migrations must be **idempotent** — use `IF NOT EXISTS`, `IF EXISTS` guards
5. The `copyMigrationsPlugin` in `electron.vite.config.ts` copies `.sql` files to `out/main/migrations/` at build time
6. Never modify an already-applied migration — create a new one instead

---

## 10 · Backlog Workflow

1. Tasks listed in `docs/backlog.md` with SRS references
2. Read backlog at session start → pick up assigned tasks
3. Create implementation plan → user approves → execute
4. Move completed tasks to Done in the backlog
5. Bugs and quick fixes handled verbally — no backlog entry needed

---

> **Rule maintenance:** When a mistake is made twice, add a rule here. Keep under 400 lines.
> **Pointer pattern:** When a section grows beyond ~20 lines, move detail to `docs/` and link. This file is for constraints, not documentation.
