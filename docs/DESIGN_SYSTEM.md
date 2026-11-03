# MedFlow — Enterprise Clinical Design System Specification

## 1. Vision & Aesthetics

MedFlow is an operational healthcare dashboard that must communicate **clinical precision, trust, high readability under pressure, and zero visual clutter**. 

Rather than generic template aesthetics, MedFlow adopts a **modern clinical operations palette**:
- High-contrast typography optimized for scan-ability in surgical prep bays and nursing desks.
- Strict WCAG 2.2 AA accessibility (no status communicated solely through hue).
- Elevation hierarchy powered by Material 3 system tokens (`--mat-sys-surface`, `--mat-sys-outline`).
- Calm, neutral background surfaces paired with unambiguous clinical semantic tokens.

---

## 2. Color System & Semantic Tokens

### Base Surface & Neutrals
- **App Canvas:** `#F8FAFC` (Slate 50) — Crisp, clean hospital-grade backdrop.
- **Card & Dialog Surface:** `#FFFFFF` (Pure White).
- **Surface Elevation 1 (Hover / Borders):** `#E2E8F0` (Slate 200).
- **Primary Typography:** `#0F172A` (Slate 900) — Deep navy-slate for reading comfort.
- **Secondary / Subtitles:** `#475569` (Slate 600).
- **Muted Hints / Timestamps:** `#94A3B8` (Slate 400).

### Clinical Semantic Tokens (Procedures & Instruments)

| State | Background | Text Color | Border / Accent | Meaning |
|---|---|---|---|---|
| **Available / Completed** | `#DCFCE7` (Emerald 100) | `#15803D` (Emerald 700) | `#86EFAC` | Safe, ready for use, surgery concluded |
| **Planned / Reserved** | `#E0F2FE` (Sky 100) | `#0369A1` (Sky 700) | `#7DD3FC` | Scheduled, allocated to operating room |
| **In Progress / In Use** | `#FEF3C7` (Amber 100) | `#B45309` (Amber 700) | `#FCD34D` | Active surgical procedure underway |
| **Cleaning / Decontamination** | `#F3E8FF` (Purple 100) | `#7E22CE` (Purple 700) | `#D8B4FE` | In autoclave or chemical sterilization |
| **Maintenance / Cancelled** | `#FEE2E2` (Rose 100) | `#B91C1C` (Rose 700) | `#FCA5A5` | Equipment flagged, decommissioned |

---

## 3. Typography Hierarchy

- **Font Family:** `Roboto`, system-ui, sans-serif.
- **Page Headings (`h1`):** `1.75rem` (28px), `font-weight: 700`, `letter-spacing: -0.02em`.
- **Card Titles (`mat-card-title`):** `0.875rem` (14px), `font-weight: 600`, uppercase, `letter-spacing: 0.05em`.
- **Metric Values:** `2.5rem` (40px), `font-weight: 800`, line-height `1.1`.
- **Table Data Cells:** `0.875rem` (14px), regular (`400`).
- **Codes & Identifiers:** `font-family: 'JetBrains Mono', 'Roboto Mono', monospace`, `font-weight: 600`, `font-size: 0.8125rem`.

---

## 4. UI Layout & Component Guidelines

### Top Navigation & Shell
- Height: `64px`, fixed at the viewport top.
- Background: Deep Clinical Navy (`#0F172A`) or System Primary Azure (`var(--mat-sys-primary)`).
- Left: Brand Logo + Identifier (`MedFlow`) + Pill Badge (`DEMO — SYNTHETIC DATA`).
- Right: Navigation links styled with `mat-button`, active route indicator marked with border-bottom accent (`3px solid #38BDF8`).

### Metric Cards (`<app-metric-card>`)
- Grid layout: `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`.
- Padding: `20px`.
- Border: `1px solid #E2E8F0`.
- Hover state: Subtle elevation `transform: translateY(-2px)`, shadow `0 8px 20px -4px rgba(15, 23, 42, 0.08)`.

### Operational Data Tables
- Header row: `#F1F5F9`, sticky during vertical scroll.
- Row padding: `12px 16px`, subtle border bottom.
- Hover highlight: `#F8FAFC`.
- Badges: Always paired with an icon or uppercase text, never pure dots or isolated colors.

---

## 5. Next Visual Evolutions (Roadmap)

1. **Dark Mode Integration:** Full slate-navy dark palette (`#0F172A` canvas, `#1E293B` cards).
2. **Real-time Pulse Indicators:** Animated pulse badge for procedures currently `in-progress`.
3. **Interactive Timeline / Gantt View:** Visual OR schedule representation showing room allocations per hour.
