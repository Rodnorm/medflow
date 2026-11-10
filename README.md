# MedFlow — Surgical Workflow & Clinical Operations Dashboard

MedFlow is an operational healthcare demo built with **Angular 22**, combining **Angular Signals**, the **NgRx Global Store** (with `@ngrx/entity`) and **NgRx SignalStore**. It coordinates surgical procedure scheduling, operating room allocation, instrument sterilization lifecycles and operational conflict detection.

All data is synthetic and held in memory; changes reset on page reload. There is no backend yet — the data layer sits behind injection tokens so an HTTP implementation can replace the in-memory one without touching components.

---

## Implemented Features

### 1. Operations Overview
- **Reactive KPI cards** for procedure status totals and instrument availability.
- **Distribution charts:** native SVG donut charts for procedures and instrument sets, plus bar charts for **theater utilisation** (booked time against a 16-hour working window) and **case load by start hour**. Every chart ships a hidden data table for screen readers.
- **Live activity feed** with relative timestamps and deep links to the affected entity.
- **Deferred rendering:** charts load with `@defer (on viewport)`.

### 2. Procedure Worklist
- **Filtering:** debounced text search (code and title), status filter and a scheduled-date range picker. Every filter is mirrored to the URL query string.
- **Sorting and pagination** with `MatSort` and `MatPaginator` over `@ngrx/entity` collections.
- **Bulk actions:** multi-select rows, then start, complete or cancel in one step. The confirmation dialog states how many procedures will change and how many are skipped because the transition is invalid.
- **Expandable rows** showing the allocated instrument set and schedule.
- **Table preferences:** column visibility menu and comfortable/compact density, persisted in `localStorage`.
- **Saved views:** name and re-apply any filter combination.
- **CSV export** of the filtered rows.
- **Status workflow dialog** enforcing `planned → in-progress → completed` or `planned → cancelled`, with confirmation before destructive actions.

### 3. Instrument Tracking
- **Lifecycle transitions:** `available ⇄ reserved`, `reserved → in-use → cleaning → available`, and `available ⇄ maintenance`.
- **Feature state:** `InstrumentsStore` built with `@ngrx/signals` and `withEntities`.
- **Detail pages** (`/instruments/:id`) with upcoming reservations, usage history and per-set activity. Sending a reserved set to maintenance asks for confirmation first.

### 4. Operating Room Schedule
- **24-hour timeline** across every theater found in the data, with day navigation (previous, next, today, date picker) stored in the URL.
- **Drag-and-drop rescheduling** with the CDK, snapping to 15-minute slots. Planned blocks can move between theaters and times; blocks that are underway stay fixed.
- **Keyboard alternative:** focus a planned block and use Shift + arrow keys. Results are announced through a live region.
- **Placement validation:** moves that overlap another active procedure, run past midnight or target a non-planned procedure are rejected with an explanation.
- **Conflict highlighting** with striped blocks and a per-day conflict count, plus a live "now" marker on the current day.

### 5. Conflict Detection and Alerts
- **Domain engine** in `core/domain` flags overlapping procedures in the same theater and procedures whose instrument set is cleaning or in maintenance.
- **Alert center** in the header with a badge counter, grouped by severity.

### 6. Procedure Detail and Deep Linking
- Routable `/procedures/:id` pages powered by `withComponentInputBinding()`, with tabs for workflow actions and allocated instruments.

### 7. Activity Log
- `ActivityStore` records procedure status changes, reschedules and instrument transitions from NgRx effects and store methods.
- `/activity` page with entity filter, text search and relative times.

### 8. Command Palette
- `Ctrl + K` (or `Cmd + K`) opens a keyboard-driven palette to jump to any page, procedure or instrument set, or to toggle the theme.

### 9. API Simulation Panel
- Toolbar panel to change simulated latency, force API failures and reset demo data. Pages show recoverable error banners with a Retry action, which makes loading and error states easy to demonstrate.
- A background timer simulates remote status changes (no WebSocket or SSE connection).

### 10. Design System and Dark Mode
- Design tokens (`--med-*`) layered over Angular Material 3 themes, with light and dark modes and a header toggle synchronized to `localStorage`.
- Reusable components: `MetricCard`, `StatusBadge`, `PageHeader`, `EmptyState`, `ConfirmDialog`, `DonutChart`, `BarChart`, `ActivityFeed`.
- Automated accessibility scans run in CI but exclude color contrast; WCAG contrast has not been audited.

---

## Technical Stack

| Layer | Technology |
|---|---|
| **Framework** | Angular 22 (standalone components, zoneless change detection, `@if` / `@for` / `@defer`) |
| **Language** | TypeScript 6.x (strict) |
| **Global state** | `@ngrx/store`, `@ngrx/effects`, `@ngrx/entity`, `@ngrx/store-devtools` |
| **Feature state** | `@ngrx/signals` (SignalStore with `withEntities`, `rxMethod`, `watchState`) |
| **Reactivity** | Signals (`signal`, `computed`, `input`) and RxJS (`Subject`, `debounceTime`, `mergeMap`) |
| **UI** | Angular Material 3, Angular CDK (drag-drop, overlay), Sass |
| **Unit testing** | Vitest through `@angular/build:unit-test` |
| **End-to-end** | Playwright with `@axe-core/playwright` |
| **Quality** | `angular-eslint` with template accessibility rules |

---

## Project Structure

```text
src/app/
├── core/
│   ├── api/                  # Injection tokens and API contracts
│   ├── data/                 # Deterministic synthetic dataset
│   ├── domain/               # Pure rules: conflict detection, schedule placement, analytics
│   ├── interceptors/         # HTTP error handling
│   ├── models/               # Entities, status unions and state machines
│   ├── services/             # In-memory API, simulation, realtime, theme, conflicts
│   ├── store/                # NgRx store, SignalStores, facades
│   └── util/                 # Relative time, command search
├── features/
│   ├── overview/             # KPIs, charts, recent procedures
│   ├── procedures/           # Worklist, detail page, status dialog
│   ├── instruments/          # Tracking list and detail page
│   ├── schedule/             # Operating room timeline
│   └── activity/             # Activity log
└── shared/
    └── components/           # Design system and app-level UI
```

---

## Getting Started

### Prerequisites
- Node.js `^22.22.3`, `^24.15.0` or `>=26.0.0` (as required by the locked Angular dependencies)
- npm `10.x` or higher

### Installation
```bash
git clone https://github.com/Rodnorm/medflow.git
cd medflow
npm install
```

### Development server
```bash
npm start
```
Open `http://localhost:4200/`. The app reloads when source files change.

### Production build
```bash
npm run build
```
Artifacts are written to `dist/medflow/browser`.

### Quality checks
```bash
npm run lint
npm test -- --no-watch
npm run test:e2e
npm run test:e2e:ui
```

---

## Deployment

The repository includes a multi-stage `Dockerfile` (Node build, Nginx runtime), an `nginx.conf` with SPA fallback, long-lived caching for hashed assets and a `/healthz` endpoint, and a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs lint, unit tests, the production build and the Playwright suite.

```bash
docker build -t medflow .
docker run --rm -p 8080:80 medflow
```

On Coolify, create an application from the repository and select the Dockerfile build pack with port `80`.

---

## Roadmap

- [x] Injection-token data layer, HTTP error interceptor and zoneless change detection
- [x] Entity-based global store with facades and devtools
- [x] Command palette, saved views, bulk actions and drag-and-drop scheduling
- [x] Dockerfile, Nginx configuration and CI pipeline
- [ ] **HTTP implementation** of the API contracts against a real backend (FastAPI or similar), with optimistic updates and rollback
- [ ] **Real-time transport** (WebSocket or SSE) replacing the in-process simulation
- [ ] **Role-based access control** with route guards and role-aware actions
- [ ] **Internationalization** (`en-US`, `pt-BR`)
- [ ] **Trend visualisations** (sparklines, sterilization turnaround) once history is persisted
