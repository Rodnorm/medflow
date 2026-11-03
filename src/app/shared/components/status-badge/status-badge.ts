import { Component, computed, input } from "@angular/core";
import { InstrumentSetStatus } from "../../../core/models/instrument-set/instrument-set.model";
import { ProcedureStatus } from "../../../core/models/procedure/procedure.model";

export type AnyStatus = ProcedureStatus | InstrumentSetStatus;

@Component({
    selector: 'app-status-badge',
    styleUrl: './status-badge.scss',
    templateUrl: './status-badge.html',
})
export class StatusBadge {
    readonly status = input.required<AnyStatus>();

    readonly label = computed(() => {
        return this.status().replace('-', ' ').toUpperCase();
    })
}