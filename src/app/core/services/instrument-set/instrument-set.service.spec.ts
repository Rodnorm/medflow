import { firstValueFrom } from "rxjs";
import { TestBed } from "@angular/core/testing";
import { InstrumentSetService } from "./instrument-set.service";

describe('InstrumentSet Service', () => {
    let service: InstrumentSetService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [InstrumentSetService]
        });
        service = TestBed.inject(InstrumentSetService)
    });


    it('should retrieve all instrument sets', async () => {
        const sets = await firstValueFrom(service.getInstrumentSets());

        expect(sets).toBeDefined();
        expect(sets.length).toBeGreaterThan(0);
    });

    it('should retrieve an instrument set by id', async () => {
        const id = 'ins-003';
        const set = await firstValueFrom(service.getInstrumentSetById(id));

        expect(set).toBeDefined();
        expect(set?.id).toBe(id);
    });

    it('should update status when transition is valid', async () => {

        const updated = await firstValueFrom(service.updateStatus('ins-001', 'reserved'));
        expect(updated.status).toBe('reserved');

        const retrieved = await firstValueFrom(service.getInstrumentSetById('ins-001'));
        expect(retrieved?.status).toBe('reserved');
    });
    it('should reject invalid status transitions with an error', async () => {

        await expect(firstValueFrom(service.updateStatus('ins-001', 'cleaning'))).rejects.toThrow();
    });


});