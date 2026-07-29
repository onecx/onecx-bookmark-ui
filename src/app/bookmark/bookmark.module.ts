import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'

import { providePortalDialogService } from '@onecx/angular-accelerator'

import { PortalPageComponent } from '@onecx/angular-utils'
import { bookmarkFeature } from './bookmark.reducers'
import { routes } from './bookmark.routes'

import { BookmarkOverviewComponent } from './bookmark-overview/bookmark-overview.component'
import { BookmarkOverviewEffects } from './bookmark-overview/bookmark-overview.effects'
import { BookmarkListComponent } from './bookmark-overview/bookmark-list/bookmark-list.component'
import { BookmarkConfigureComponent } from './bookmark-configure/bookmark-configure.component'
import { BookmarkConfigureEffects } from './bookmark-configure/bookmark-configure.effects'
import { BookmarkDeleteComponent } from './bookmark-delete/bookmark-delete.component'
import { BookmarkDetailComponent } from './bookmark-detail/bookmark-detail.component'
import { BookmarkExportComponent } from './bookmark-export/bookmark-export.component'
import { BookmarkImportComponent } from './bookmark-import/bookmark-import.component'
import { BookmarkImageComponent } from './bookmark-image/bookmark-image.component'
import { BookmarkSortComponent } from './bookmark-sort/bookmark-sort.component'

@NgModule({
  providers: [providePortalDialogService()],
  imports: [
    BookmarkConfigureComponent,
    BookmarkDeleteComponent,
    BookmarkDetailComponent,
    BookmarkExportComponent,
    BookmarkImageComponent,
    BookmarkImportComponent,
    BookmarkListComponent,
    BookmarkOverviewComponent,
    BookmarkSortComponent,
    PortalPageComponent,
    EffectsModule.forFeature([BookmarkConfigureEffects, BookmarkOverviewEffects]),
    LetDirective,
    RouterModule.forChild(routes),
    StoreModule.forFeature(bookmarkFeature)
  ]
})
export class BookmarkModule {}
