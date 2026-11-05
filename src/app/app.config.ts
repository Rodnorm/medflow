import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';
import { procedureReducer } from './core/store/procedures/procedure.reducer';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { ProceduresEffects } from './core/store/procedures/procedures.effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { INSTRUMENT_SET_API_TOKEN, PROCEDURE_API_TOKEN } from './core/api/api.tokens';
import { ProcedureService } from './core/services/procedure/procedure.service';
import { InstrumentSetService } from './core/services/instrument-set/instrument-set.service';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: PROCEDURE_API_TOKEN, useExisting: ProcedureService },
    { provide: INSTRUMENT_SET_API_TOKEN, useExisting: InstrumentSetService },
    provideZonelessChangeDetection(),
    provideHttpClient(withInterceptors([errorInterceptor])),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withPreloading(PreloadAllModules),
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
