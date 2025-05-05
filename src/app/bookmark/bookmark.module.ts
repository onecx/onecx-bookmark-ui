import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { DividerModule } from 'primeng/divider'

import { providePortalDialogService, PortalCoreModule } from '@onecx/portal-integration-angular'
import { addInitializeModuleGuard } from '@onecx/angular-integration-interface'

import { SharedModule } from 'src/app/shared/shared.module'
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
  declarations: [
    BookmarkOverviewComponent,
    BookmarkListComponent,
    BookmarkConfigureComponent,
    BookmarkDetailComponent,
    BookmarkDeleteComponent,
    BookmarkExportComponent,
    BookmarkImportComponent,
    BookmarkImageComponent,
    BookmarkSortComponent
  ],
  imports: [
    CommonModule,
    DividerModule,
    LetDirective,
    PortalCoreModule.forMicroFrontend(),
    RouterModule.forChild(addInitializeModuleGuard(routes)),
    SharedModule,
    StoreModule.forFeature(bookmarkFeature),
    EffectsModule.forFeature([BookmarkConfigureEffects, BookmarkOverviewEffects])
  ]
})
export class BookmarkModule {}
