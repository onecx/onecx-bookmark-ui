import { APP_INITIALIZER, DoBootstrap, Injector, isDevMode, NgModule } from '@angular/core'
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { Router, RouterModule } from '@angular/router'
import { MissingTranslationHandler, TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { Actions, EffectsModule, EffectSources, EffectsRunner } from '@ngrx/effects'
import { StoreRouterConnectingModule } from '@ngrx/router-store'
import { StoreModule } from '@ngrx/store'
import { StoreDevtoolsModule } from '@ngrx/store-devtools'

import { AngularAuthModule } from '@onecx/angular-auth'
import { createAppEntrypoint, initializeRouter } from '@onecx/angular-webcomponents'
import { createTranslateLoader, TRANSLATION_PATH, translationPathFactory } from '@onecx/angular-utils'
import { addInitializeModuleGuard, AppStateService, ConfigurationService } from '@onecx/angular-integration-interface'
import { PortalCoreModule, PortalMissingTranslationHandler } from '@onecx/portal-integration-angular'

import { Configuration } from './shared/generated'
import { SharedModule } from './shared/shared.module'
import { apiConfigProvider } from './shared/utils/apiConfigProvider.utils'
import { AppEntrypointComponent } from './app-entrypoint.component'
import { routes } from './app-routing.module'
import { commonImports } from './app.module'
import { metaReducers, reducers } from './app.reducers'

// Workaround for the following issue:
// https://github.com/ngrx/platform/issues/3700
const effectProvidersForWorkaround = [EffectsRunner, EffectSources, Actions]
effectProvidersForWorkaround.forEach((p) => (p.ɵprov.providedIn = null))

@NgModule({
  declarations: [AppEntrypointComponent],
  imports: [
    ...commonImports,
    PortalCoreModule.forMicroFrontend(),
    RouterModule.forRoot(addInitializeModuleGuard(routes)),
    TranslateModule.forRoot({
      extend: true,
      isolate: false,
      loader: { provide: TranslateLoader, useFactory: createTranslateLoader, deps: [HttpClient] },
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: PortalMissingTranslationHandler
      }
    }),
    SharedModule,
    AngularAuthModule,
    StoreModule.forRoot(reducers, { metaReducers }),
    EffectsModule.forRoot(effectProvidersForWorkaround),
    StoreRouterConnectingModule.forRoot(),
    StoreDevtoolsModule.instrument({
      maxAge: 25, // Retains last 25 states
      logOnly: !isDevMode(), // Restrict extension to log-only mode
      autoPause: true, // Pauses recording actions and state changes when the extension window is not open
      trace: false, //  If set to true, will include stack trace for every dispatched action, so you can see it in trace tab jumping directly to that part of code
      traceLimit: 75 // maximum stack trace frames to be stored (in case trace option was provided as true)
    })
  ],
  exports: [],
  providers: [
    {
      provide: Configuration,
      useFactory: apiConfigProvider,
      deps: [ConfigurationService, AppStateService]
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeRouter,
      multi: true,
      deps: [Router, AppStateService]
    },
    {
      provide: TRANSLATION_PATH,
      useFactory: (appStateService: AppStateService) => translationPathFactory('assets/i18n/')(appStateService),
      multi: true,
      deps: [AppStateService]
    },
    provideHttpClient(withInterceptorsFromDi())
  ]
})
export class OneCXBookmarkModule implements DoBootstrap {
  constructor(private readonly injector: Injector) {}

  ngDoBootstrap(): void {
    createAppEntrypoint(AppEntrypointComponent, 'ocx-bookmark-component', this.injector)
  }
}
