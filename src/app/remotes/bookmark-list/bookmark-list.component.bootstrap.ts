import { importProvidersFrom, inject, provideAppInitializer } from '@angular/core'
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { provideRouter } from '@angular/router'
import { TranslateLoader, MissingTranslationHandler } from '@ngx-translate/core'

import { AngularAuthModule } from '@onecx/angular-auth'
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'
import { UserService } from '@onecx/angular-integration-interface'
import { provideTranslationPathFromMeta, createTranslateLoader, provideThemeConfig } from '@onecx/angular-utils'
import { provideTranslateServiceForRoot } from '@onecx/angular-remote-components'
import { AngularAcceleratorMissingTranslationHandler, providePortalDialogService } from '@onecx/angular-accelerator'

import { environment } from 'src/environments/environment'
import { OneCXBookmarkListComponent } from './bookmark-list.component'

function userProfileInitializer(userService: UserService) {
  return async () => {
    await userService.isInitialized
  }
}

bootstrapRemoteComponent(OneCXBookmarkListComponent, 'ocx-bookmark-list-component', environment.production, [
  provideHttpClient(withInterceptorsFromDi()),
  providePortalDialogService(),
  importProvidersFrom(AngularAuthModule, BrowserModule, BrowserAnimationsModule),
  provideThemeConfig(),
  provideRouter([
    {
      path: '**',
      children: []
    }
  ]),
  provideTranslationPathFromMeta(import.meta.url, 'assets/i18n/'),
  provideTranslateServiceForRoot({
    isolate: true,
    loader: {
      provide: TranslateLoader,
      useFactory: createTranslateLoader,
      deps: [HttpClient]
    },
    missingTranslationHandler: {
      provide: MissingTranslationHandler,
      useClass: AngularAcceleratorMissingTranslationHandler
    }
  }),
  provideAppInitializer(() => {
    const initializerFn = userProfileInitializer(inject(UserService))
    return initializerFn()
  })
])
