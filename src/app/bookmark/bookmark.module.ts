import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'

import { providePortalDialogService, PortalCoreModule } from '@onecx/portal-integration-angular'
import { addInitializeModuleGuard } from '@onecx/angular-integration-interface'

import { SharedModule } from 'src/app/shared/shared.module'
import { bookmarkFeature } from './bookmark.reducers'
import { routes } from './bookmark.routes'

import { BookmarkSearchEffects } from './bookmark-search/bookmark-search.effects'
import { BookmarkSearchComponent } from './bookmark-search/bookmark-search.component'
import { BookmarkDeleteComponent } from './bookmark-delete/bookmark-delete.component'
import { BookmarkDetailComponent } from './bookmark-detail/bookmark-detail.component'
import { BookmarkExportComponent } from './bookmark-export/bookmark-export.component'
import { BookmarkImportComponent } from './bookmark-import/bookmark-import.component'
import { BookmarkImageComponent } from './product-image/bookmark-image.component'
import { BookmarkSortComponent } from './bookmark-sort/bookmark-sort.component'

@NgModule({
  providers: [providePortalDialogService()],
  declarations: [
    BookmarkDetailComponent,
    BookmarkDeleteComponent,
    BookmarkExportComponent,
    BookmarkImportComponent,
    BookmarkSearchComponent,
    BookmarkImageComponent,
    BookmarkSortComponent
  ],
  imports: [
    CommonModule,
    LetDirective,
    PortalCoreModule.forMicroFrontend(),
    RouterModule.forChild(addInitializeModuleGuard(routes)),
    SharedModule,
    StoreModule.forFeature(bookmarkFeature),
    EffectsModule.forFeature([BookmarkSearchEffects])
  ]
})
export class BookmarkModule {}
