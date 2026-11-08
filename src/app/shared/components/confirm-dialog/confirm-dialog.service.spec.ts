import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ConfirmDialogComponent } from './confirm-dialog';
import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogService', () => {
  const open = vi.fn();

  function setup(result: boolean | undefined) {
    open.mockReturnValue({ afterClosed: () => of(result) });
    TestBed.configureTestingModule({ providers: [{ provide: MatDialog, useValue: { open } }] });
    return TestBed.inject(ConfirmDialogService);
  }

  beforeEach(() => {
    open.mockReset();
  });

  it('opens the confirm dialog with the supplied copy', () => {
    const service = setup(true);
    service.confirm({ title: 'Cancel?', message: 'Sure?' }).subscribe();
    expect(open).toHaveBeenCalledWith(
      ConfirmDialogComponent,
      expect.objectContaining({ data: { title: 'Cancel?', message: 'Sure?' } }),
    );
  });

  it('emits true only when the user confirmed', () => {
    const results: boolean[] = [];
    setup(true).confirm({ title: 't', message: 'm' }).subscribe((value) => results.push(value));
    expect(results).toEqual([true]);
  });

  it('treats cancel and backdrop dismissal as a refusal', () => {
    const cancelled: boolean[] = [];
    setup(false).confirm({ title: 't', message: 'm' }).subscribe((value) => cancelled.push(value));
    expect(cancelled).toEqual([false]);

    TestBed.resetTestingModule();
    const dismissed: boolean[] = [];
    setup(undefined).confirm({ title: 't', message: 'm' }).subscribe((value) => dismissed.push(value));
    expect(dismissed).toEqual([false]);
  });
});

