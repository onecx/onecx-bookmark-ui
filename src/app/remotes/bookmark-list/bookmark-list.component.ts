import { Component, Inject, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, ReplaySubject } from 'rxjs'
import { TabViewModule } from 'primeng/tabview'
import { MessageModule } from 'primeng/message'
import { SkeletonModule } from 'primeng/skeleton'

import { AngularAuthModule } from '@onecx/angular-auth'
import {
  AngularRemoteComponentsModule,
  ocxRemoteComponent,
  ocxRemoteWebcomponent,
  SLOT_SERVICE,
  SlotService
} from '@onecx/angular-remote-components'
import { REMOTE_COMPONENT_CONFIG, RemoteComponentConfig } from '@onecx/angular-utils'

import { AppConfigService, PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import { AngularAcceleratorModule } from '@onecx/angular-accelerator'

import { Bookmark, BookmarkScope } from 'src/app/shared/generated'
import { BookmarkAPIUtilsService } from 'src/app/shared/utils/bookmarkApiUtils.service'

import { BookmarkLinksComponent } from './bookmark-links/bookmark-links.component'

export function slotInitializer(slotService: SlotService) {
  return () => slotService.init()
}

@Component({
  imports: [
    AngularAuthModule,
    AngularRemoteComponentsModule,
    BookmarkLinksComponent,
    CommonModule,
    AngularAcceleratorModule,
    TranslateModule,
    TabViewModule,
    MessageModule,
    SkeletonModule
  ],
  providers: [
    {
      provide: REMOTE_COMPONENT_CONFIG,
      useValue: new ReplaySubject<string>(1)
    },
    {
      provide: SLOT_SERVICE,
      useExisting: SlotService
    },
    PortalMessageService,
    BookmarkAPIUtilsService
  ],
  selector: 'app-bookmark-list',
  templateUrl: './bookmark-list.component.html',
  styleUrl: './bookmark-list.component.scss'
})
export class OneCXBookmarkListComponent implements ocxRemoteComponent, ocxRemoteWebcomponent {
  publicBookmarks$ = new BehaviorSubject<Bookmark[]>([])
  privateBookmarks$ = new BehaviorSubject<Bookmark[]>([])

  permissions: string[] = []
  bookmarkLoadingError = false
  loading = true

  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }

  constructor(
    @Inject(REMOTE_COMPONENT_CONFIG) private readonly baseUrl: ReplaySubject<string>,
    private readonly appConfigService: AppConfigService,
    private readonly userService: UserService,
    private readonly translateService: TranslateService,
    private readonly bookmarkApiUtils: BookmarkAPIUtilsService,
    private readonly slotService: SlotService
  ) {
    this.translateService.use(this.userService.lang$.getValue())
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.baseUrl.next(config.baseUrl)
    this.permissions = config.permissions
    this.bookmarkApiUtils.overwriteBaseURL(config.baseUrl)
    this.appConfigService.init(config.baseUrl)
    this.bookmarkApiUtils.loadBookmarks(this.handleBookmarkLoadError).subscribe((result) => {
      const bookmarks = result ?? []
      this.privateBookmarks$.next(
        bookmarks.filter((bm) => bm.scope === BookmarkScope.Private).sort((a, b) => a.position - b.position)
      )
      this.publicBookmarks$.next(
        bookmarks.filter((bm) => bm.scope === BookmarkScope.Public).sort((a, b) => a.position - b.position)
      )
      this.loading = false
    })
    this.slotService.init()
  }

  private readonly handleBookmarkLoadError = () => {
    this.bookmarkLoadingError = true
    this.loading = false
  }
}
