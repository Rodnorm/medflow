import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router } from '@angular/router';
import { interval } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Procedure } from '../../core/models/procedure/procedure.model';
import {
  canPlaceProcedure,
  collectRooms,
  dayKeyToDate,
  findOverlappingProcedureIds,
  isoAtMinutes,
  MINUTES_PER_DAY,
  minutesSinceMidnight,
  procedureDuration,
  resolveReferenceDay,
  shiftDayKey,
  SLOT_MINUTES,
  snapToSlot,
  toDayKey,
} from '../../core/domain/schedule.rules';
import { ProceduresFacade } from '../../core/store/procedures/procedures.facade';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { ProcedureDetailDialogComponent } from '../procedures/procedure-detail-dialog/procedure-detail-dialog';

export interface ScheduleBlock {
  readonly procedure: Procedure;
  readonly left: number;
  readonly width: number;
  readonly overlapping: boolean;
  readonly movable: boolean;
}

export interface ScheduleRow {
  readonly room: string;
  readonly blocks: readonly ScheduleBlock[];
}

@Component({
  selector: 'app-or-schedule',
  styleUrl: './or-schedule.scss',
  templateUrl: './or-schedule.html',
  imports: [
    DatePipe,
    CdkDrag,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    PageHeaderComponent,
  ],
  providers: [provideNativeDateAdapter()],
})
export class OrScheduleComponent {
  readonly date = input<string | undefined>();

  private readonly proceduresFacade = inject(ProceduresFacade);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly procedures = this.proceduresFacade.procedures;
  readonly error = this.proceduresFacade.error;
  readonly hours = Array.from({ length: 24 }, (_, i) => i);
  readonly currentTime = signal<Date>(new Date());
  readonly announcement = signal<string>('');

  private suppressClick = false;

  readonly rooms = computed(() => collectRooms(this.procedures()));

  readonly selectedDay = computed(() => {
    const requested = this.date();
    return requested && dayKeyToDate(requested)
      ? requested
      : resolveReferenceDay(this.procedures(), this.currentTime());
  });

  readonly selectedDate = computed(() => dayKeyToDate(this.selectedDay()) ?? new Date());
  readonly isToday = computed(() => this.selectedDay() === toDayKey(this.currentTime()));

  readonly dayProcedures = computed(() =>
    this.procedures().filter((procedure) => toDayKey(procedure.scheduledDate) === this.selectedDay()),
  );

  readonly overlappingIds = computed(() => findOverlappingProcedureIds(this.dayProcedures()));
  readonly conflictCount = computed(() => this.overlappingIds().size);

  readonly rows = computed<readonly ScheduleRow[]>(() => {
    const overlapping = this.overlappingIds();
    const byRoom = new Map<string, Procedure[]>();
    this.dayProcedures().forEach((procedure) => {
      byRoom.set(procedure.operatingRoom, [...(byRoom.get(procedure.operatingRoom) ?? []), procedure]);
    });

    return this.rooms().map((room) => ({
      room,
      blocks: (byRoom.get(room) ?? []).map((procedure) => ({
        procedure,
        left: (minutesSinceMidnight(procedure.scheduledDate) / MINUTES_PER_DAY) * 100,
        width: (procedureDuration(procedure) / MINUTES_PER_DAY) * 100,
        overlapping: overlapping.has(procedure.id),
        movable: procedure.status === 'planned',
      })),
    }));
  });

  readonly nowPositionPercent = computed(
    () => (minutesSinceMidnight(this.currentTime()) / MINUTES_PER_DAY) * 100,
  );

  constructor() {
    this.proceduresFacade.loadProcedures();
    interval(60_000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.currentTime.set(new Date());
      });
  }

  goToDay(dayKey: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { date: dayKey },
      queryParamsHandling: 'merge',
    });
  }

  shiftDay(days: number): void {
    this.goToDay(shiftDayKey(this.selectedDay(), days));
  }

  goToToday(): void {
    this.goToDay(toDayKey(new Date()));
  }

  onDatePicked(value: Date | null): void {
    if (value) {
      this.goToDay(toDayKey(value));
    }
  }

  dismissError(): void {
    this.proceduresFacade.clearError();
  }

  onBlockClick(procedure: Procedure): void {
    if (this.suppressClick) return;
    this.dialog.open(ProcedureDetailDialogComponent, {
      data: { procedure },
      width: '540px',
    });
  }

  onDragStarted(): void {
    this.suppressClick = true;
  }

  onDragEnded(event: CdkDragEnd, block: ScheduleBlock): void {
    const track = event.source.element.nativeElement.parentElement;
    const row = track?.parentElement;
    const trackWidth = track?.getBoundingClientRect().width || 1;
    const rowHeight = row?.getBoundingClientRect().height || 68;

    const minutesDelta = snapToSlot((event.distance.x / trackWidth) * MINUTES_PER_DAY);
    const roomDelta = Math.round(event.distance.y / rowHeight);

    event.source.reset();
    setTimeout(() => (this.suppressClick = false));

    this.requestMove(
      block.procedure,
      this.rooms().indexOf(block.procedure.operatingRoom) + roomDelta,
      minutesSinceMidnight(block.procedure.scheduledDate) + minutesDelta,
    );
  }

  onBlockKeydown(event: KeyboardEvent, procedure: Procedure): void {
    if (!event.shiftKey || procedure.status !== 'planned') return;

    const moves: Record<string, readonly [number, number]> = {
      ArrowLeft: [0, -SLOT_MINUTES],
      ArrowRight: [0, SLOT_MINUTES],
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
    };
    const move = moves[event.key];
    if (!move) return;

    event.preventDefault();
    this.requestMove(
      procedure,
      this.rooms().indexOf(procedure.operatingRoom) + move[0],
      minutesSinceMidnight(procedure.scheduledDate) + move[1],
    );
  }

  private requestMove(procedure: Procedure, roomIndex: number, startMinutes: number): void {
    const rooms = this.rooms();
    const room = rooms[Math.min(rooms.length - 1, Math.max(0, roomIndex))];
    const latestStart = MINUTES_PER_DAY - procedureDuration(procedure);
    const start = Math.min(latestStart, Math.max(0, snapToSlot(startMinutes)));

    if (
      room === procedure.operatingRoom &&
      start === minutesSinceMidnight(procedure.scheduledDate)
    ) {
      return;
    }

    const scheduledDate = isoAtMinutes(this.selectedDay(), start);
    const placement = canPlaceProcedure(this.procedures(), procedure, room, scheduledDate);

    if (!placement.ok) {
      this.announcement.set(placement.reason);
      this.snackBar.open(placement.reason, 'Dismiss', { duration: 4000 });
      return;
    }

    this.proceduresFacade.moveProcedure(procedure.id, room, scheduledDate);
    const time = `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`;
    this.announcement.set(`${procedure.code} moved to ${room} at ${time}`);
  }
}
