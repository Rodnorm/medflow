import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommandItem, searchCommands } from '../../../core/util/command-search';
import { ThemeService } from '../../../core/services/theme/theme.service';
import { InstrumentsFacade } from '../../../core/store/instruments/instruments.facade';
import { ProceduresFacade } from '../../../core/store/procedures/procedures.facade';

const STATIC_ITEMS: readonly CommandItem[] = [
  { id: 'page-overview', label: 'Overview', description: 'Operations dashboard and KPIs', icon: 'dashboard', group: 'Pages', url: '/overview' },
  { id: 'page-procedures', label: 'Procedures', description: 'Surgical worklist', icon: 'local_hospital', group: 'Pages', url: '/procedures' },
  { id: 'page-instruments', label: 'Instruments', description: 'Instrument set tracking', icon: 'precision_manufacturing', group: 'Pages', url: '/instruments' },
  { id: 'page-schedule', label: 'Schedule', description: 'Operating room timeline', icon: 'calendar_month', group: 'Pages', url: '/schedule' },
  { id: 'page-activity', label: 'Activity', description: 'Status change log', icon: 'history', group: 'Pages', url: '/activity' },
  { id: 'action-theme', label: 'Toggle theme', description: 'Switch between light and dark mode', icon: 'contrast', group: 'Actions', keywords: 'dark light appearance' },
];

@Component({
  selector: 'app-command-palette',
  imports: [MatIconModule],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
})
export class CommandPaletteComponent {
  private readonly router = inject(Router);
  private readonly dialogRef = inject(MatDialogRef<CommandPaletteComponent>);
  private readonly theme = inject(ThemeService);
  private readonly procedures = inject(ProceduresFacade);
  private readonly instruments = inject(InstrumentsFacade);

  readonly query = signal<string>('');
  readonly activeIndex = signal<number>(0);

  private readonly items = computed<readonly CommandItem[]>(() => [
    ...STATIC_ITEMS,
    ...this.procedures.procedures().map(
      (procedure): CommandItem => ({
        id: `procedure-${procedure.id}`,
        label: `${procedure.code} ${procedure.title}`,
        description: `${procedure.operatingRoom} ${procedure.status}`,
        icon: 'local_hospital',
        group: 'Procedures',
        url: `/procedures/${procedure.id}`,
      }),
    ),
    ...this.instruments.instruments().map(
      (set): CommandItem => ({
        id: `instrument-${set.id}`,
        label: `${set.code} ${set.name}`,
        description: `${set.location} ${set.status}`,
        icon: 'inventory_2',
        group: 'Instruments',
        url: `/instruments/${set.id}`,
      }),
    ),
  ]);

  readonly results = computed(() => searchCommands(this.items(), this.query()));

  constructor() {
    if (this.procedures.total() === 0) this.procedures.loadProcedures();
    if (this.instruments.instruments().length === 0) this.instruments.loadInstruments();
  }

  onQuery(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  onKeydown(event: KeyboardEvent): void {
    const count = this.results().length;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (count === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      this.activeIndex.update((index) => (index + step + count) % count);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const item = this.results()[this.activeIndex()];
      if (item) this.execute(item);
    }
  }

  execute(item: CommandItem): void {
    this.dialogRef.close();

    if (item.url) {
      void this.router.navigateByUrl(item.url);
    } else if (item.id === 'action-theme') {
      this.theme.toggleTheme();
    }
  }
}
