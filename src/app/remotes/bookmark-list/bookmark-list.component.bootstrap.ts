import { importProvidersFrom, inject, provideAppInitializer } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ReplaySubject } from 'rxjs'

import { AngularAuthModule } from '@onecx/angular-auth'
import { provideMissingTranslationHandler, provideTranslateLoader, provideTranslateService } from '@ngx-translate/core'
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'
import { AngularAcceleratorModule, providePortalDialogService } from '@onecx/angular-accelerator'
import { UserService } from '@onecx/angular-integration-interface'
import {
  MultiLanguageMissingTranslationHandler,
  OnecxTranslateLoader,
  REMOTE_COMPONENT_CONFIG,
  RemoteComponentConfig,
  provideTranslationPathFromMeta
} from '@onecx/angular-utils'
import { provideThemeConfig } from '@onecx/angular-utils/theme/primeng'

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
  provideTranslateService({
    defaultLanguage: 'en',
    loader: provideTranslateLoader(OnecxTranslateLoader),
    missingTranslationHandler: provideMissingTranslationHandler(MultiLanguageMissingTranslationHandler)
  })
]).catch((err) => console.error(err))
