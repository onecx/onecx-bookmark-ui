import { APP_INITIALIZER, importProvidersFrom } from '@angular/core'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { provideRouter } from '@angular/router'

import { AngularAuthModule } from '@onecx/angular-auth'
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'
import { UserService } from '@onecx/angular-integration-interface'
import { providePortalDialogService } from '@onecx/portal-integration-angular'

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
  provideRouter([
    {
      path: '**',
      children: []
    }
  ]),
  {
    provide: APP_INITIALIZER,
    useFactory: userProfileInitializer,
    deps: [UserService],
    multi: true
  }
])
