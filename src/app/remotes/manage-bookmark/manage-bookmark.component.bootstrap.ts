import { importProvidersFrom } from '@angular/core'
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { BrowserModule } from '@angular/platform-browser'
import { provideRouter } from '@angular/router'
import { TranslateLoader, MissingTranslationHandler } from '@ngx-translate/core'
import { ReplaySubject } from 'rxjs'

import { AngularAuthModule } from '@onecx/angular-auth'
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import {
  provideTranslationPathFromMeta,
  createTranslateLoader,
  provideThemeConfig,
  REMOTE_COMPONENT_CONFIG,
  RemoteComponentConfig
} from '@onecx/angular-utils'
import { provideTranslateServiceForRoot } from '@onecx/angular-remote-components'
import { AngularAcceleratorMissingTranslationHandler, providePortalDialogService } from '@onecx/angular-accelerator'

import { environment } from 'src/environments/environment'
import { OneCXManageBookmarkComponent } from './manage-bookmark.component'

bootstrapRemoteComponent(OneCXManageBookmarkComponent, 'ocx-bookmark-manage-component', environment.production, [
  {
    provide: REMOTE_COMPONENT_CONFIG,
    useValue: new ReplaySubject<RemoteComponentConfig>(1)
  },
  provideHttpClient(withInterceptorsFromDi()),
  providePortalDialogService(),
  provideThemeConfig(),
  importProvidersFrom(AngularAuthModule, BrowserModule, BrowserAnimationsModule),
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
  })
])
