import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { procedureReducer } from './core/store/procedures/procedure.reducer';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { ProceduresEffects } from './core/store/procedures/procedures.effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

export const appConfig: ApplicationConfig = {
  providers: [
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
