import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommandPaletteComponent } from './command-palette';

@Injectable({
  providedIn: 'root',
})
export class CommandPaletteService {
  private readonly dialog = inject(MatDialog);
  private isOpen = false;

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;

    this.dialog
      .open(CommandPaletteComponent, {
        width: '560px',
        maxWidth: '92vw',
        position: { top: '12vh' },
        ariaLabel: 'Command palette',
        panelClass: 'command-palette-panel',
        autoFocus: 'first-tabbable',
      })
      .afterClosed()
      .subscribe(() => {
        this.isOpen = false;
      });
  }
}

