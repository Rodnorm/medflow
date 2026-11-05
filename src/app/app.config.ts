import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { procedureReducer } from './core/store/procedures/procedure.reducer';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { ProceduresEffects } from './core/store/procedures/procedures.effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { INSTRUMENT_SET_API_TOKEN, PROCEDURE_API_TOKEN } from './core/api/api.tokens';
import { ProcedureService } from './core/services/procedure/procedure.service';
import { InstrumentSetService } from './core/services/instrument-set/instrument-set.service';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: PROCEDURE_API_TOKEN, useExisting: ProcedureService },
    { provide: INSTRUMENT_SET_API_TOKEN, useExisting: InstrumentSetService },
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions({ skipInitialTransition: true }),
    ),
    provideStore({ procedures: procedureReducer }),
    provideEffects([ProceduresEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode,
    }),
  ],
};
