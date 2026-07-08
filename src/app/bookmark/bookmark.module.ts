import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { DividerModule } from 'primeng/divider'
import { MessageModule } from 'primeng/message'
import { DockModule } from 'primeng/dock'
import { CheckboxModule } from 'primeng/checkbox'
import { FileUploadModule } from 'primeng/fileupload'
import { RadioButtonModule } from 'primeng/radiobutton'
import { InputTextModule } from 'primeng/inputtext'
import { BadgeModule } from 'primeng/badge'
import { TabViewModule } from 'primeng/tabview'
import { TextareaModule } from 'primeng/textarea'
import { ButtonModule } from 'primeng/button'
import { TableModule } from 'primeng/table'
import { PaginatorModule } from 'primeng/paginator'
import { InputGroupModule } from 'primeng/inputgroup'
import { TooltipModule } from 'primeng/tooltip'
import { SelectButtonModule } from 'primeng/selectbutton'

import { TranslateModule } from '@ngx-translate/core'
import { AngularAcceleratorModule, providePortalDialogService } from '@onecx/angular-accelerator'

import { SharedModule } from 'src/app/shared/shared.module'
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
    AngularAcceleratorModule,
    BadgeModule,
    ButtonModule,
    CheckboxModule,
    CommonModule,
    DividerModule,
    DockModule,
    FileUploadModule,
    FormsModule,
    InputGroupModule,
    InputTextModule,
    MessageModule,
    PaginatorModule,
    RadioButtonModule,
    SelectButtonModule,
    TableModule,
    TabViewModule,
    TextareaModule,
    TooltipModule,
    TranslateModule,
    PortalPageComponent,
    EffectsModule.forFeature([BookmarkConfigureEffects, BookmarkOverviewEffects]),
    LetDirective,
    RouterModule.forChild(routes),
    SharedModule,
    StoreModule.forFeature(bookmarkFeature)
  ]
})
export class BookmarkModule {}
