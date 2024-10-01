import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { BrowserModule } from '@angular/platform-browser'
import { provideRouter } from '@angular/router'
import { importProvidersFrom } from '@angular/core'
import { AngularAuthModule } from '@onecx/angular-auth'
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'
import { environment } from 'src/environments/environment'
import { OneCXManageBookmarkComponent } from './manage-bookmark.component'
import { providePortalDialogService } from '@onecx/portal-integration-angular'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

bootstrapRemoteComponent(OneCXManageBookmarkComponent, 'ocx-manage-bookmark-component', environment.production, [
  provideHttpClient(withInterceptorsFromDi()),
  providePortalDialogService(),
  importProvidersFrom(AngularAuthModule, BrowserModule, BrowserAnimationsModule),
  provideRouter([
    {
      path: '**',
      children: []
    }
  ])
])
