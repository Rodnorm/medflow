# MedFlow — Architecture & Feature Evolution Roadmap

This document outlines strategic architectural enhancements to elevate MedFlow into an ultra-robust, enterprise-grade clinical platform ready for production deployment (Coolify / Docker) and portfolio showcases.

---

## 1. Backend Integration: FastAPI / Python Service

Currently, MedFlow uses an in-memory RxJS mock layer. Building a modern Python backend will complete the full-stack story:

```text
┌────────────────────────┐      REST / WebSocket      ┌─────────────────────────┐
│   Angular 22 Client    │ ◄────────────────────────► │   Python FastAPI Core   │
│ (Signals + NgRx Store) │                            │ (Pydantic + SQLModel)   │
└────────────────────────┘                            └───────────┬─────────────┘
                                                                  ▼
                                                      ┌─────────────────────────┐
                                                      │ PostgreSQL / SQLite DB  │
                                                      └─────────────────────────┘
```

### Proposed Python Stack
- **FastAPI:** High performance, automatic OpenAPI / Swagger documentation, native async support.
- **Pydantic v2:** Mirrors TypeScript interfaces (`Procedure`, `InstrumentSet`) with strict runtime validation.
- **SQLModel / SQLAlchemy 2.0:** Type-safe database models.
- **WebSockets / SSE (Server-Sent Events):** Real-time broadcast of operating room status changes and decontamination alerts to all connected dashboards.

---

## 2. Advanced State Management & Streaming Enhancements

### A. Real-Time Operational Activity Feed (NgRx Effects + WebSockets)
- Extend `ProceduresEffects` to listen to a WebSocket stream.
- When an OR transitions a procedure, the global NgRx store receives an action (`ProceduresActions.remoteStatusChanged`) and updates the dashboard without user reload.

### B. Optimistic UI Updates & Undo Capability
- Immediate UI response when advancing status, rolling back automatically if the backend returns a 409 Conflict (e.g. instrument set was simultaneously reserved by another department).

### C. NgRx Entity Integration
- In `procedures.reducer.ts`, migrate from plain arrays to `@ngrx/entity` (`createEntityAdapter<Procedure>()`).
- Provides $O(1)$ dictionary lookups, built-in sorting, and normalized state.

---

## 3. High-Value Clinical Features

### Feature 1: Operating Room Timeline / Schedule (OR Gantt Chart)
- A visual 24-hour horizontal timeline showing OR-1 through OR-6.
- Drag-and-drop or click-to-reassign procedures and instruments across operating rooms.

### Feature 2: Automated Conflict Detection Engine
- A pure domain engine that flags scheduling hazards:
  - Procedure scheduled in OR-2, but the assigned `InstrumentSet` is currently `cleaning` or `maintenance`.
  - Alert banner warning: *"Instrument INS-LAP-01 unavailable until 11:30 AM"*.

### Feature 3: Export & Clinical Auditing Reports
- CSV / PDF export of daily surgical logs and decontamination records.

---

## 4. Production Deployment with Coolify

MedFlow can be packaged in a production multi-stage Dockerfile:

```dockerfile
# Stage 1: Build Angular SPA
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx Alpine
FROM nginx:alpine
COPY --from=builder /app/dist/medflow/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Easily deployable to Coolify with auto-SSL, git-push triggers, and zero-downtime rolling updates.
