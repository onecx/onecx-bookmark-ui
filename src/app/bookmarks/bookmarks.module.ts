import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { TranslateModule } from '@ngx-translate/core'

import { providePortalDialogService, PortalCoreModule } from '@onecx/portal-integration-angular'
import { addInitializeModuleGuard } from '@onecx/angular-integration-interface'

import { SharedModule } from 'src/app/shared/shared.module'
import { bookmarksFeature } from './bookmarks.reducers'
import { routes } from './bookmarks.routes'

import { BookmarksSearchComponent } from './pages/bookmarks-search/bookmarks-search.component'
import { BookmarksSearchEffects } from './pages/bookmarks-search/bookmarks-search.effects'
import { BookmarksDeleteComponent } from './pages/bookmarks-search/dialogs/bookmarks-delete/bookmarks-delete.component'
import { BookmarkImageComponent } from './pages/bookmarks-search/product-image/bookmark-image.component'

@NgModule({
  providers: [providePortalDialogService()],
  declarations: [BookmarksDeleteComponent, BookmarksSearchComponent, BookmarkImageComponent],
  imports: [
    CommonModule,
    SharedModule,
    LetDirective,
    PortalCoreModule.forMicroFrontend(),
    RouterModule.forChild(addInitializeModuleGuard(routes)),
    FormsModule,
    ReactiveFormsModule,
    StoreModule.forFeature(bookmarksFeature),
    EffectsModule.forFeature([BookmarksSearchEffects]),
    TranslateModule
  ]
})
export class BookmarksModule {}
