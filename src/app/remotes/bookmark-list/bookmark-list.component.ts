import { APP_INITIALIZER, Component, Inject, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, ReplaySubject } from 'rxjs'
import { TabViewModule } from 'primeng/tabview'

import { AngularAuthModule } from '@onecx/angular-auth'
import {
  AngularRemoteComponentsModule,
  BASE_URL,
  ocxRemoteComponent,
  ocxRemoteWebcomponent,
  provideTranslateServiceForRoot,
  RemoteComponentConfig,
  SLOT_SERVICE,
  SlotService
} from '@onecx/angular-remote-components'

import { AppConfigService, PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import { createRemoteComponentTranslateLoader } from '@onecx/angular-accelerator'
import { PortalCoreModule } from '@onecx/portal-integration-angular'

import { Bookmark, BookmarkScope } from 'src/app/shared/generated'
import { BookmarkAPIUtilsService } from 'src/app/shared/utils/bookmarkApiUtils.service'

import { BookmarkLinksComponent } from './bookmark-links/bookmark-links.component'

export function slotInitializer(slotService: SlotService) {
  return () => slotService.init()
}

@Component({
  standalone: true,
  imports: [
    AngularAuthModule,
    AngularRemoteComponentsModule,
    BookmarkLinksComponent,
    CommonModule,
    PortalCoreModule,
    TranslateModule,
    TabViewModule
  ],
  providers: [
    {
      provide: BASE_URL,
      useValue: new ReplaySubject<string>(1)
    },
    provideTranslateServiceForRoot({
      isolate: true,
      loader: {
        provide: TranslateLoader,
        useFactory: createRemoteComponentTranslateLoader,
        deps: [HttpClient, BASE_URL]
      }
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: slotInitializer,
      deps: [SLOT_SERVICE],
      multi: true
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
    @Inject(BASE_URL) private readonly baseUrl: ReplaySubject<string>,
    private readonly appConfigService: AppConfigService,
    private readonly userService: UserService,
    private readonly translateService: TranslateService,
    private readonly bookmarkApiUtils: BookmarkAPIUtilsService
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
  }

  private readonly handleBookmarkLoadError = () => {
    this.bookmarkLoadingError = true
    this.loading = false
  }
}
