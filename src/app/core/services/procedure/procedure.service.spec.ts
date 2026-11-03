import { firstValueFrom } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ProcedureService } from './procedure.service';

describe('Procedure Service', () => {
  let service: ProcedureService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProcedureService],
    });
    service = TestBed.inject(ProcedureService);
  });

  it('should retrieve all procedures', async () => {
    const procedures = await firstValueFrom(service.getProcedures());

    expect(procedures).toBeDefined();
    expect(procedures.length).toBeGreaterThan(0);
  });

  it('should retrieve a procedure by id', async () => {
    const id = 'prc-001';
    const procedure = await firstValueFrom(service.getProcedureById(id));

    expect(procedure).toBeDefined();
    expect(procedure?.id).toBe(id);
  });

  it('should update status when transition is valid', async () => {
    const updated = await firstValueFrom(service.updateStatus('prc-001', 'in-progress'));
    expect(updated.status).toBe('in-progress');

    const retrieved = await firstValueFrom(service.getProcedureById('prc-001'));
    expect(retrieved?.status).toBe('in-progress');
  });

  it('should reject invalid status transitions with an error', async () => {
    await expect(firstValueFrom(service.updateStatus('prc-001', 'completed'))).rejects.toThrow();
  });
});
