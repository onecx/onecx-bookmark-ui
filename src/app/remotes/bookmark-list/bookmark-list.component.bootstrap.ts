import { importProvidersFrom, inject, provideAppInitializer } from '@angular/core'
import { provideRouter } from '@angular/router'
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { TranslateLoader, MissingTranslationHandler } from '@ngx-translate/core'
import { ReplaySubject } from 'rxjs'

import { AngularAuthModule } from '@onecx/angular-auth'
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'
import { provideTranslateServiceForRoot } from '@onecx/angular-remote-components'
import {
  AngularAcceleratorModule,
  AngularAcceleratorMissingTranslationHandler,
  providePortalDialogService
} from '@onecx/angular-accelerator'
import { UserService } from '@onecx/angular-integration-interface'
import {
  REMOTE_COMPONENT_CONFIG,
  RemoteComponentConfig,
  createTranslateLoader,
  provideThemeConfig,
  provideTranslationPathFromMeta
} from '@onecx/angular-utils'

import { environment } from 'src/environments/environment'
import { OneCXBookmarkListComponent } from './bookmark-list.component'

function userProfileInitializer(userService: UserService) {
  return async () => {
    await userService.isInitialized
  }
}

bootstrapRemoteComponent(OneCXBookmarkListComponent, 'ocx-bookmark-list-component', environment.production, [
  {
    provide: REMOTE_COMPONENT_CONFIG,
    useValue: new ReplaySubject<RemoteComponentConfig>(1)
  },
  importProvidersFrom(AngularAcceleratorModule, AngularAuthModule, BrowserAnimationsModule),
  provideAppInitializer(() => {
    const initializerFn = userProfileInitializer(inject(UserService))
    return initializerFn()
  }),
  provideHttpClient(withInterceptorsFromDi()),
  providePortalDialogService(),
  provideRouter([
    {
      path: '**',
      children: []
    }
  ]),
  provideThemeConfig(),
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
  })
])
