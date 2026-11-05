# MedFlow — Surgical Workflow & Clinical Operations Dashboard

MedFlow is an operational healthcare demo built with **Angular 22**, combining **Angular Signals**, **NgRx Global Store** (with `@ngrx/entity`), and **NgRx SignalStore**. The system coordinates surgical procedure scheduling, operating room allocations, surgical instrument sterilization lifecycles, and real-time operational conflict detection.

All data is synthetic and stored in memory; changes reset on page reload. Backend persistence and CI/CD remain planned enhancements.

---

## Implemented Features

### 1. Executive Operations Overview
- **Real-Time KPI Metrics:** Reactive cards displaying procedure status totals (planned, in progress, completed) and surgical tray availability.
- **Native SVG Donut Charts:** Distribution visualization for procedures and instrument sets with interactive legends and built-in accessibility (hidden semantic data table for screen readers).
- **Recent Procedures Table:** Fast operational listing with dynamic statuses and deep links to detail pages.

### 2. Advanced Surgical Worklist
- **Real-Time Filtering & Debounced Search:** Text search (code and title) with a 300ms debounce and status filter, initialized from URL query parameters, with filter changes written back to the URL.
- **Sorting & Pagination:** Built with `MatSort` and `MatPaginator` operating over `@ngrx/entity` managed collections.
- **Data Export:** Instant export of filtered worklist entries to `.csv`.
- **State Transition Workflow:** Modal dialog (`MatDialog`) handling strict status transitions (`planned` → `in-progress` → `completed`, or `planned` → `cancelled`) with destructive action confirmation.

### 3. Surgical Instrument Tracking
- **Lifecycle Tracking:** Granular status transitions (`available` ⇄ `reserved`, `reserved` → `in-use` → `cleaning` → `available`, and `available` ⇄ `maintenance`) and display of each set’s location.
- **Feature State Architecture:** Dedicated instrument state managed via `@ngrx/signals` (`InstrumentsStore`) with search, filter, and reactive updates.

### 4. Operating Room Schedule
- **24-Hour Timeline Grid:** Comprehensive timeline visualization across all 6 operating theaters (OR-1 through OR-6), dynamically positioning surgical blocks by scheduled time and duration.
- **Live "Now" Marker:** Real-time vertical line indicating the current wall-clock time across the timeline.
- **Accessible Interaction:** Interactive procedure blocks navigable via keyboard and screen reader friendly.

### 5. Conflict Detection & Alert Notification Center
- **Domain Engine:** Business rules detecting operational conflicts, such as overlapping procedures in the same theater and time window.
- **Notification Dropdown:** Header notification menu with badge counter for active conflicts, categorizing issues by severity level (warning vs critical).

### 6. Procedure Detail & Deep Linking
- **Routable Detail Views:** Route `/procedures/:id` powered by Angular's `withComponentInputBinding()`.
- **Analytical Tabs:** Tabbed navigation (`MatTabGroup`) organizing clinical details, allocated surgical sets, and audit records.

### 7. Audit Logging & Activity Feed
- **Activity Store:** Event history managed via dedicated `ActivityStore`.
- **Automatic Auditing via NgRx Effects:** Status transition actions automatically trigger activity log creation with timestamp, a demo actor label, and the resulting status.

### 8. Design System & Dark Mode
- **Design Tokens:** CSS custom variables and Angular Material 3 themes supporting Light and Dark modes.
- **Toolbar Theme Toggle:** Header switch with automatic `localStorage` synchronization.
- **CDK Overlay Styling:** Dark theme styling for overlays (`MatDialog`, `MatMenu`, `MatBadge`). Automated accessibility scans currently exclude color contrast; WCAG compliance has not been verified.

---

## Technical Stack

| Layer | Technology |
|---|---|
| **Framework** | Angular 22 (Standalone Components, Zoneless Ready, Modern Control Flow `@if` / `@for`) |
| **Language** | TypeScript 6.x (compiler options in `tsconfig.json`) |
| **Global State** | `@ngrx/store`, `@ngrx/effects`, `@ngrx/entity`, `@ngrx/store-devtools` |
| **Feature State** | `@ngrx/signals` (NgRx SignalStore with `withEntities`) |
| **Reactivity** | Angular Signals (`signal`, `computed`, `effect`) & RxJS (`toSignal`, `Subject`, `debounceTime`) |
| **UI & Styling** | Angular Material 3, Angular CDK, Sass (SCSS) |
| **Unit Testing** | Vitest via `@angular/build:unit-test` |
| **End-to-End Testing** | Playwright Test |

---

## Project Structure

```text
src/app/
├── core/
│   ├── data/                 # Deterministic synthetic clinical dataset
│   ├── domain/               # Pure business engines (conflict detector)
│   ├── models/               # Domain interfaces, literals, and deterministic state machines
│   ├── services/             # Application services (procedures, instruments, conflict, theme)
│   └── store/                # NgRx global store (reducers, selectors, effects, facades, activity)
├── features/
│   ├── overview/             # Operational dashboard with KPI cards and interactive charts
│   ├── procedures/           # Worklist, detail view, and state transition dialog
│   ├── instruments/          # Instrument tracking feature with SignalStore
│   └── schedule/             # 24-hour operating theater timeline
└── shared/
    └── components/           # Reusable UI components (DonutChart, StatusBadge, AlertCenter)
```

---

## Getting Started

### Prerequisites
- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` (as required by the locked Angular dependencies)
- npm `10.x` or higher

### Installation
```bash
git clone https://github.com/Rodnorm/medflow.git
cd medflow
npm install
```

### Development Server
```bash
npm start
```
Navigate to `http://localhost:4200/` in your browser. The application reloads automatically when source files change.

### Production Build
```bash
npm run build
```
Optimized build artifacts will be generated in the `dist/medflow` directory.

### Testing

#### Unit Tests (Vitest)
```bash
npm test -- --no-watch
```

#### End-to-End Tests (Playwright)
```bash
# Headless run
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui
```

---

## Planned Future Enhancements

- [x] **Abstract HTTP Layer & Dependency Injection:** Decouple data services using `InjectionToken` (`PROCEDURE_API_TOKEN`, `INSTRUMENT_SET_API_TOKEN`) allowing seamless transitions between in-memory mocks and remote backends.
- [x] **HTTP Interceptors & Resilience:** Global error interceptor with user feedback through `MatSnackBar`.
- [x] **Full Zoneless Change Detection:** Enabled native `provideZonelessChangeDetection()` removing Zone.js runtime dependency.
- [x] **Optimized Deferred Loading:** Implemented `@defer (on viewport)` for distribution charts.
- [ ] **Command Palette (`Ctrl + K`):** Global quick navigation and action modal powered by CDK Overlay.
- [ ] **Multi-Language Support (i18n):** Angular internationalization with dictionaries for English (`en-US`) and Portuguese (`pt-BR`).
- [x] **Simulated Real-Time Updates:** In-process timer simulates procedure and instrument status changes using the in-memory services. No WebSocket or SSE connection is implemented.
- [ ] **Role-Based Access Control (RBAC):** Route protection with `CanMatchFn` guards and conditional structural directives for role-sensitive actions.
- [ ] **Dedicated Backend Service:** FastAPI (Python) backend with relational database persistence and OpenAPI schema validation.
- [ ] **Containerization & Deployment:** Docker multi-stage configuration and automated CI/CD pipeline for tests and deployment.
