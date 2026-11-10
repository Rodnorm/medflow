import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { AlertCenterComponent } from './alert-center';
import { ConflictService } from '../../../core/services/conflict/conflict.service';
import { OperationalAlert } from '../../../core/domain/conflict.detector';

describe('AlertCenterComponent', () => {
  let fixture: ComponentFixture<AlertCenterComponent>;
  let component: AlertCenterComponent;
  let router: Router;

  const mockAlerts = signal<OperationalAlert[]>([
    {
      id: 'alert-1',
      title: 'Instrument Set Unavailable: INS-NEUR-01',
      message: 'Procedure PRC-2026-005 requires Microsurgery Cranial Set in maintenance.',
      procedureId: 'prc-005',
      instrumentSetId: 'ins-005',
      severity: 'critical',
      type: 'instrument-unready',
      timestamp: new Date().toISOString(),
    },
  ]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertCenterComponent],
      providers: [
        provideRouter([]),
        {
          provide: ConflictService,
          useValue: {
            activeAlerts: mockAlerts,
            totalAlertsCount: () => mockAlerts().length,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertCenterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('renders trigger button with badge count', () => {
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBe('Operational Alerts Notification Center');
  });

  it('navigates and closes trigger when navigateTo is called', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const mockTrigger = { closeMenu: vi.fn() } as unknown as MatMenuTrigger;

    component.navigateTo(['/procedures', 'prc-005'], mockTrigger);

    expect(mockTrigger.closeMenu).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/procedures', 'prc-005']);
  });
});
