import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { ConflictService } from '../../../core/services/conflict/conflict.service';

@Component({
  selector: 'app-alert-center',
  styleUrl: './alert-center.scss',
  templateUrl: './alert-center.html',
  imports: [MatButtonModule, MatIconModule, MatBadgeModule, MatMenuModule],
})
export class AlertCenterComponent {
  readonly conflictService = inject(ConflictService);
}
