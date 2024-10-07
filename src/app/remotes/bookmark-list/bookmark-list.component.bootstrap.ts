import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { BrowserModule } from '@angular/platform-browser'
import { provideRouter } from '@angular/router'
import { APP_INITIALIZER, importProvidersFrom } from '@angular/core'
import { AngularAuthModule } from '@onecx/angular-auth'
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'
import { environment } from 'src/environments/environment'
import { OneCXBookmarkListComponent } from './bookmark-list.component'
import { providePortalDialogService, UserService } from '@onecx/portal-integration-angular'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

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
