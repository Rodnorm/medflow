import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from './core/services/theme/theme.service';
import { AlertCenterComponent } from './shared/components/alert-center/alert-center';
import { RealtimeService } from './core/services/realtime/realtime.service';
import { CommandPaletteService } from './shared/components/command-palette/command-palette.service';
import { SimulationPanelComponent } from './shared/components/simulation-panel/simulation-panel';
import { AppInfoDrawerComponent } from './shared/components/app-info/app-info';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    AlertCenterComponent,
    SimulationPanelComponent,
    AppInfoDrawerComponent,
  ],
  host: {
    '(window:keydown)': 'onWindowKeydown($event)',
  },
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('MedFlow Operations');
  readonly themeService = inject(ThemeService);
  readonly realtimeService = inject(RealtimeService);
  readonly commandPalette = inject(CommandPaletteService);

  onWindowKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.commandPalette.open();
    }
  }
}
