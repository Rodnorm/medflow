import { Component, ElementRef, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-info-drawer',
  imports: [MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './app-info.html',
  styleUrl: './app-info.scss',
})
export class AppInfoDrawerComponent {
  readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('infoDialog');

  readonly technologies: readonly string[] = [
    'Angular 22',
    'Standalone Components',
    'Angular Signals',
    'NgRx Store & Effects',
    'NgRx SignalStore',
    'Angular Material MDC',
    'Angular CDK Drag & Drop',
    'TypeScript Strict Mode',
    'Pure SVG Telemetry Charts',
    'Vitest (168 tests)',
    'Playwright E2E + Axe a11y',
    'Docker Multi-Stage + Nginx',
  ];

  readonly whatItDoes: readonly string[] = [
    'Orchestrates 10 surgical operating rooms in a live 24-hour visual schedule timeline.',
    'Detects physical asset conflicts in real time: room booking overlaps and unavailable sterile instrument sets.',
    'Manages procedure lifecycles with multi-selection and bulk status transitions (Planned → In Progress → Completed / Cancelled).',
    'Tracks sterile surgical instrument sets across processing cycles (Available → Reserved → In Use → Cleaning → Maintenance).',
    'Renders zero-dependency SVG telemetry charts for theater utilization and hourly surgical intake.',
    'Provides instant keyboard-driven search across procedures, rooms, and instruments via Ctrl+K command palette.',
    'Persists operational state in session storage across reloads, with live latency and error simulation controls.',
  ];

  readonly howToUse: readonly string[] = [
    'Navigate between views using the top navigation bar or press Ctrl+K / Cmd+K to open the Command Palette.',
    'In Schedule: Drag and drop surgery blocks between rooms and hours, or select a block and press Shift + Arrow keys to reschedule with screen reader feedback.',
    'In Procedures: Use the filter bar to filter by status or date range. Check multiple rows to trigger the bulk action floating toolbar.',
    'In Instruments: Click any instrument code to view its upcoming reservations, historical usage, and trigger maintenance transitions.',
    'In Operational Conflicts: Click the top-right bell icon to inspect active conflicts and click "View Case" or "View Set" to jump directly to the issue.',
    'In API Simulation: Click the tune icon to inject artificial latency or toggle network failures to test error boundaries.',
  ];

  open(): void {
    this.dialogRef()?.nativeElement.showModal();
  }

  close(): void {
    this.dialogRef()?.nativeElement.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialogRef()?.nativeElement) {
      this.close();
    }
  }
}

