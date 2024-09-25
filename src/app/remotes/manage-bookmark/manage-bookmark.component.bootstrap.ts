import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { BrowserModule } from '@angular/platform-browser'
import { provideRouter } from '@angular/router'
import { importProvidersFrom } from '@angular/core'
import { AngularAuthModule } from '@onecx/angular-auth'
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'
import { environment } from 'src/environments/environment'
import { OneCXManageBookmarkComponent } from './manage-bookmark.component'

bootstrapRemoteComponent(OneCXManageBookmarkComponent, 'ocx-manage-bookmark-component', environment.production, [
  provideHttpClient(withInterceptorsFromDi()),
  importProvidersFrom(AngularAuthModule),
  importProvidersFrom(BrowserModule),
  provideRouter([
    {
      path: '**',
      children: []
    }
  ])
])