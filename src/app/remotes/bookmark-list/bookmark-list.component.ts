import { Component, inject, Input } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, ReplaySubject } from 'rxjs'

import { MessageModule } from 'primeng/message'
import { SkeletonModule } from 'primeng/skeleton'
import { TabsModule } from 'primeng/tabs'
import { TooltipModule } from 'primeng/tooltip'

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
import { BookmarkUtilService } from 'src/app/shared/utils/bookmarkUtil.service'

import { BookmarkLinksComponent } from './bookmark-links/bookmark-links.component'

export function slotInitializer(slotService: SlotService) {
  return () => slotService.init()
}

@Component({
  selector: 'app-bookmark-list',
  standalone: true,
  imports: [
    AngularAuthModule,
    AngularRemoteComponentsModule,
    AsyncPipe,
    AngularAcceleratorModule,
    MessageModule,
    SkeletonModule,
    TabsModule,
    TooltipModule,
    TranslateModule,
    BookmarkLinksComponent
  ],
  providers: [{ provide: SLOT_SERVICE, useExisting: SlotService }, PortalMessageService, BookmarkUtilService],
  templateUrl: './bookmark-list.component.html',
  styleUrl: './bookmark-list.component.scss'
})
export class OneCXBookmarkListComponent implements ocxRemoteComponent, ocxRemoteWebcomponent {
  private readonly remoteComponentConfig = inject<ReplaySubject<RemoteComponentConfig>>(REMOTE_COMPONENT_CONFIG)
  private readonly appConfigService = inject(AppConfigService)
  private readonly userService = inject(UserService)
  private readonly translateService = inject(TranslateService)
  private readonly bookmarkApiUtils = inject(BookmarkUtilService)
  private readonly slotService = inject(SlotService)

  publicBookmarks$ = new BehaviorSubject<Bookmark[]>([])
  privateBookmarks$ = new BehaviorSubject<Bookmark[]>([])

  permissions: string[] = []
  bookmarkLoadingError = false
  loading = true

  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }

  constructor() {
    this.translateService.use(this.userService.lang$.getValue())
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.remoteComponentConfig.next(config)
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
