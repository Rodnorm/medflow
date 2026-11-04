import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ProceduresFacade } from '../../core/store/procedures/procedures.facade';
import { MatDialog } from '@angular/material/dialog';
import { Procedure } from '../../core/models/procedure/procedure.model';
import { ProcedureDetailDialogComponent } from '../procedures/procedure-detail-dialog/procedure-detail-dialog';

@Component({
  selector: 'app-or-schedule',
  styleUrl: './or-schedule.scss',
  templateUrl: './or-schedule.html',
  imports: [DatePipe, NgClass, MatButtonModule, MatCardModule, MatIconModule],
})
export class OrScheduleComponent {
  private readonly proceduresFacade = inject(ProceduresFacade);
  private readonly dialog = inject(MatDialog);

  readonly procedures = this.proceduresFacade.procedures;
  readonly hours = Array.from({ length: 24 }, (_, i) => i);
  readonly operatingRooms = ['OR-1', 'OR-2', 'OR-3', 'OR-4', 'OR-5', 'OR-6'];

  readonly currentTime = signal<Date>(new Date());

  readonly nowPositionPercent = computed(() => {
    const d = this.currentTime();
    const minutesSinceMidnight = d.getHours() * 60 + d.getMinutes();

    return (minutesSinceMidnight / (24 * 60)) * 100;
  });

  constructor() {
    this.proceduresFacade.loadProcedures();
  }

  getProceduresForRoom(room: string): Procedure[] {
    return this.procedures().filter((p) => p.operatingRoom === room);
  }

  getBlockPosition(procedure: Procedure): { left: number; width: number } {
    const date = new Date(procedure.scheduledDate);
    const minutes = date.getHours() * 60 + date.getMinutes();
    const left = (minutes / (24 * 60)) * 100;
    const duration = procedure.durationMinutes || 90;
    const width = (duration / (24 * 60)) * 100;

    return {
      left,
      width,
    };
  }

  openManageDialog(procedure: Procedure): void {
    this.dialog.open(ProcedureDetailDialogComponent, {
      data: { procedure },
      width: '540px',
    });
  }
}
