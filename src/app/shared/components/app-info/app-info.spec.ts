import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppInfoDrawerComponent } from './app-info';

describe('AppInfoDrawerComponent', () => {
  let fixture: ComponentFixture<AppInfoDrawerComponent>;
  let component: AppInfoDrawerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppInfoDrawerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppInfoDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders about trigger button with accessible label', () => {
    const btn = fixture.nativeElement.querySelector('.info-trigger');
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBe('About MedFlow Application');
  });

  it('opens and closes native dialog element', () => {
    const dialog = component.dialogRef()?.nativeElement;
    expect(dialog).toBeTruthy();

    if (dialog) {
      dialog.showModal = vi.fn();
      dialog.close = vi.fn();

      component.open();
      expect(dialog.showModal).toHaveBeenCalled();

      component.close();
      expect(dialog.close).toHaveBeenCalled();
    }
  });

  it('lists core technologies and features', () => {
    expect(component.technologies.length).toBeGreaterThan(5);
    expect(component.whatItDoes.length).toBeGreaterThan(3);
    expect(component.howToUse.length).toBeGreaterThan(3);
  });
});

