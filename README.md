# MedFlow — Enterprise Surgical & Clinical Operations Dashboard

MedFlow is an enterprise-grade operational healthcare dashboard built with **Angular 22**, **Signals**, **NgRx Global Store**, and **NgRx SignalStore**. The platform coordinates surgical procedures, sterilised instrument sets, operating room allocations, and state machines with strict accessibility (WCAG) and full reactivity.

---

## Key Highlights & Architecture

- **Fine-Grained Reactivity:** Combines native Angular Signals (`signal()`, `computed()`) with RxJS interop (`toSignal()`, `rxMethod()`, `takeUntilDestroyed()`).
- **Hybrid State Architecture:**
  - **Global Store (`@ngrx/store` + `@ngrx/effects`):** Manages shared procedure worklists, status audit flows, and multi-view synchronization via strongly-typed action groups and memoized selectors.
  - **Feature Store (`@ngrx/signals` / SignalStore):** Manages instrument tracking through a modular, composable feature-scoped store (`withState`, `withComputed`, `withMethods`).
- **Domain State Machines:** Pure deterministic transition functions enforcing surgical lifecycle constraints:
  - `Procedure`: `planned` &rarr; `in-progress` &rarr; `completed` (or explicit user-confirmed `cancelled`).
  - `InstrumentSet`: `available` &harr; `reserved` &harr; `in-use` &rarr; `cleaning` &rarr; `available` (or `maintenance`).
- **Accessible Design System:** Angular Material 3 integration with semantic HTML landmarks (`<header>`, `<nav>`, `<main>`), keyboard navigation, and custom accessible presentational components (`<app-metric-card>`, `<app-status-badge>`).
- **URL Synchronization:** Bi-directional query parameter sync for real-time search, status filtering, and 300ms input debouncing.
- **Enterprise Test Pyramid:**
  - **34 Unit & Component Specs** using Vitest (fast in-memory and virtual timer verification).
  - **End-to-End Specs** using Playwright running headless Chromium against user workflows.

---

## Technical Stack

| Layer | Technology |
|---|---|
| Framework | **Angular 22** (Standalone Components, esbuild, modern control flow `@if` / `@for`) |
| Language | **TypeScript 5.x** (Strict Mode, Discriminated Unions) |
| Global State | **NgRx Store & NgRx Effects** (`createActionGroup`, `createReducer`, `createSelector`) |
| Feature State | **NgRx SignalStore** (`signalStore`, `withState`, `withComputed`, `withMethods`) |
| Async / Streams | **RxJS 7.x** (`Subject`, `switchMap`, `debounceTime`, `takeUntilDestroyed`) |
| Design & UI | **Angular Material 3**, Sass (SCSS system variables, Material tokens) |
| Unit Testing | **Vitest** via `@angular/build:unit-test` |
| End-to-End | **Playwright Test** |

---

## Project Structure

```text
src/app/
├── core/
│   ├── data/             # Deterministic synthetic operational dataset
│   ├── models/           # Domain entities, literal unions & pure state machines
│   ├── services/         # Async data access layer & latency simulation
│   └── store/            # Global NgRx store (procedures actions, reducer, selectors, effects)
├── features/
│   ├── overview/         # Executive operational dashboard with reactive KPI metrics
│   ├── procedures/       # Procedure worklist, filters, debounced search & status dialog
│   └── instruments/      # Instrument tracking & lifecycle management via SignalStore
└── shared/
    └── components/       # Design system (MetricCard, StatusBadge)
```

---

## Getting Started

### Prerequisites

- Node.js `20.x` or `22.x`
- npm `10.x` or higher

### Installation

```bash
git clone https://github.com/your-username/medflow.git
cd medflow
npm install
```

### Running the Development Server

```bash
npm start
```
Navigate to `http://localhost:4200/`. The app will automatically reload if you change any source files.

### Production Build

```bash
npm run build
```
Build artifacts are generated in the `dist/medflow` directory, optimized with lazy chunk splitting.

---

## Testing

### Unit & Component Tests (Vitest)

```bash
npm test -- --no-watch
```

### End-to-End Tests (Playwright)

```bash
# Run headless E2E suite
npm run test:e2e

# Run with interactive UI & trace debugger
npm run test:e2e:ui
```

---

## Scalability & Production Readiness

1. **Deployable on Coolify / Docker:** Can be served as an ultra-lightweight static SPA using Nginx Alpine or Caddy with Brotli/Gzip compression.
2. **Backend Agnostic Contract:** The `ProcedureService` and `InstrumentSetService` interfaces mirror standard REST endpoints (`GET /api/procedures`, `PATCH /api/procedures/:id/status`), allowing seamless plug-in to a FastAPI / Python backend or Node.js microservices.
