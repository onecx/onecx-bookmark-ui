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
import { bookmarkFeature } from './bookmark.reducers'
import { routes } from './bookmark.routes'

import { BookmarkSearchEffects } from './pages/bookmark-search/bookmark-search.effects'
import { BookmarkSearchComponent } from './pages/bookmark-search/bookmark-search.component'
import { BookmarkDeleteComponent } from './pages/bookmark-search/bookmark-delete/bookmark-delete.component'
import { BookmarkDetailComponent } from './pages/bookmark-search/bookmark-detail/bookmark-detail.component'
import { BookmarkImageComponent } from './pages/bookmark-search/product-image/bookmark-image.component'

@NgModule({
  providers: [providePortalDialogService()],
  declarations: [BookmarkDetailComponent, BookmarkDeleteComponent, BookmarkSearchComponent, BookmarkImageComponent],
  imports: [
    CommonModule,
    SharedModule,
    LetDirective,
    PortalCoreModule.forMicroFrontend(),
    RouterModule.forChild(addInitializeModuleGuard(routes)),
    FormsModule,
    ReactiveFormsModule,
    StoreModule.forFeature(bookmarkFeature),
    EffectsModule.forFeature([BookmarkSearchEffects]),
    TranslateModule
  ]
})
export class BookmarkModule {}
