import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { APP_INITIALIZER, Component, Inject, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { AppConfigService, createRemoteComponentTranslateLoader } from '@onecx/angular-accelerator'
import { AngularAuthModule } from '@onecx/angular-auth'
import { AppStateService, PortalMessageService, UserService } from '@onecx/angular-integration-interface'
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
import { PortalCoreModule } from '@onecx/portal-integration-angular'
import { RippleModule } from 'primeng/ripple'
import { BehaviorSubject, combineLatest, ReplaySubject } from 'rxjs'
import { Bookmark } from 'src/app/shared/generated'
import { SharedModule } from 'src/app/shared/shared.module'
import { BookmarkAPIUtilsService } from 'src/app/shared/utils/bookmarkApiUtils.service'

export function slotInitializer(slotService: SlotService) {
  return () => slotService.init()
}

@Component({
  standalone: true,
  imports: [
    AngularAuthModule,
    AngularRemoteComponentsModule,
    CommonModule,
    FormsModule,
    SharedModule,
    RippleModule,
    PortalCoreModule,
    TranslateModule
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
  styleUrls: ['./bookmark-list.component.scss']
})
export class OneCXBookmarkListComponent implements ocxRemoteComponent, ocxRemoteWebcomponent {
  bookmarks$ = new BehaviorSubject<Bookmark[] | undefined>(undefined)
  commonObs$ = combineLatest([
    this.appStateService.currentWorkspace$.asObservable(),
    this.appStateService.currentMfe$.asObservable(),
    this.appStateService.currentPage$.asObservable()
  ])

  permissions: string[] = []
  bookmarkLoadingError = false

  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }

  constructor(
    @Inject(BASE_URL) private baseUrl: ReplaySubject<string>,
    private appConfigService: AppConfigService,
    private appStateService: AppStateService,
    private userService: UserService,
    private translateService: TranslateService,
    private bookmarkApiUtils: BookmarkAPIUtilsService
  ) {
    this.userService.lang$.subscribe((lang) => this.translateService.use(lang))
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.baseUrl.next(config.baseUrl)
    this.permissions = config.permissions
    this.bookmarkApiUtils.overwriteBaseURL(config.baseUrl)
    this.appConfigService.init(config.baseUrl)
    this.bookmarkApiUtils.loadBookmarks(this.commonObs$, this.handleBookmarkLoadError).subscribe((result) => {
      this.bookmarks$.next(result)
    })
  }

  private handleBookmarkLoadError = () => {
    this.bookmarkLoadingError = true
  }
}
