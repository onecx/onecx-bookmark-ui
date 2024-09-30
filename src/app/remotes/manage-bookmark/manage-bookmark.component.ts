import { HttpClient } from '@angular/common/http'
import { CommonModule } from '@angular/common'
import { APP_INITIALIZER, Component, Inject, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { AppConfigService, createRemoteComponentTranslateLoader } from '@onecx/angular-accelerator'
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
import {
  PortalCoreModule,
  PortalDialogConfig,
  PortalDialogService,
  providePortalDialogService
} from '@onecx/portal-integration-angular'
import { PrimeIcons } from 'primeng/api'
import { RippleModule } from 'primeng/ripple'
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  first,
  map,
  mergeMap,
  Observable,
  of,
  ReplaySubject,
  withLatestFrom
} from 'rxjs'
import { Bookmark, CreateBookmark, CreateBookmarkScopeEnum, UpdateBookmark } from 'src/app/shared/generated'
import { DynamicDialogModule } from 'primeng/dynamicdialog'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { SharedModule } from 'src/app/shared/shared.module'
import { Endpoint, MfeInfo, Workspace } from '@onecx/integration-interface'
import { CreateUpdateBookmarkDialogComponent } from 'src/app/shared/components/dialogs/create-update-bookmark-dialog/create-update-bookmark-dialog.component'
import { PageNotBookmarkableDialogComponent } from './page-not-bookmarkable-dialog/page-not-bookmarkable-dialog.component'
import { mapPathSegmentsToPathParemeters } from 'src/app/shared/utils/path.utils'
import { findPageBookmark, getEndpointForPath, isPageBookmarkable } from 'src/app/shared/utils/bookmark.utils'
import { extractPathAfter } from 'src/app/shared/utils/path.utils'
import { BookmarkAPIUtilsService } from 'src/app/shared/utils/bookmarkApiUtils.service'

export function slotInitializer(slotService: SlotService) {
  return () => slotService.init()
}

@Component({
  standalone: true,
  imports: [
    AngularRemoteComponentsModule,
    CommonModule,
    FormsModule,
    SharedModule,
    RippleModule,
    PortalCoreModule,
    ProgressSpinnerModule,
    TranslateModule,
    DynamicDialogModule,
    PageNotBookmarkableDialogComponent
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
    providePortalDialogService(),
    BookmarkAPIUtilsService
  ],
  selector: 'app-manage-bookmark',
  templateUrl: './manage-bookmark.component.html',
  styleUrls: ['./manage-bookmark.component.scss']
})
export class OneCXManageBookmarkComponent implements ocxRemoteComponent, ocxRemoteWebcomponent {
  permissions: string[] = []
  bookmarks$ = new BehaviorSubject<Bookmark[] | undefined>(undefined)
  isBookmarkable$: Observable<boolean>
  isBookmarked$: Observable<boolean>
  currentBookmark$: Observable<Bookmark | undefined>
  endpointForCurrentPage$: Observable<Endpoint | undefined>
  commonObs$ = combineLatest([
    this.appStateService.currentWorkspace$.asObservable(),
    this.appStateService.currentMfe$.asObservable(),
    this.appStateService.currentPage$.asObservable()
  ])

  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }

  constructor(
    @Inject(BASE_URL) private baseUrl: ReplaySubject<string>,
    private appConfigService: AppConfigService,
    private appStateService: AppStateService,
    private userService: UserService,
    private translateService: TranslateService,
    private portalDialogService: PortalDialogService,
    private bookmarkApiUtils: BookmarkAPIUtilsService
  ) {
    this.userService.lang$.subscribe((lang) => this.translateService.use(lang))

    this.isBookmarkable$ = this.commonObs$.pipe(
      map(([currentWorkspace, currentMfe, currentPage]) => {
        return isPageBookmarkable(currentWorkspace, currentMfe, currentPage)
      }),
      catchError(() => {
        return of(false)
      })
    )

    this.currentBookmark$ = combineLatest([this.bookmarks$, this.commonObs$]).pipe(
      map(([bookmarks, [currentWorkspace, currentMfe, currentPage]]) => {
        return findPageBookmark(bookmarks, currentWorkspace, currentMfe, currentPage)
      }),
      catchError(() => {
        return of(undefined)
      })
    )

    this.isBookmarked$ = combineLatest([this.bookmarks$, this.commonObs$]).pipe(
      map(([bookmarks, [currentWorkspace, currentMfe, currentPage]]) => {
        return !!findPageBookmark(bookmarks, currentWorkspace, currentMfe, currentPage)
      }),
      catchError(() => {
        return of(false)
      })
    )

    this.endpointForCurrentPage$ = this.commonObs$.pipe(
      map(([currentWorkspace, currentMfe, currentPage]) => {
        if (currentPage) {
          const pagePath = extractPathAfter(currentPage.path, currentMfe.baseHref)
          return getEndpointForPath(currentWorkspace, currentMfe, pagePath)
        }
        return undefined
      }),
      catchError(() => {
        return of(undefined)
      })
    )
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.baseUrl.next(config.baseUrl)
    this.permissions = config.permissions
    this.bookmarkApiUtils.overwriteBaseURL(config.baseUrl)
    this.appConfigService.init(config.baseUrl)
    this.appStateService.currentWorkspace$
      .pipe(mergeMap((currentWorkspace) => this.bookmarkApiUtils.loadBookmarks(currentWorkspace.workspaceName)))
      .subscribe(this.bookmarks$)
  }

  openBookmarkDialog() {
    combineLatest([this.isBookmarkable$, this.isBookmarked$, this.currentBookmark$, this.commonObs$])
      .pipe(
        first(),
        mergeMap(([isBookmarkable, isBookmarked, currentBookmark, [currentWorkspace, currentMfe, currentPage]]) => {
          return this.portalDialogService
            .openDialog<unknown>(
              `REMOTES.MANAGE_BOOKMARK.DIALOG.HEADER_${isBookmarked ? 'UPDATE' : 'CREATE'}`,
              isBookmarkable
                ? {
                    type: CreateUpdateBookmarkDialogComponent,
                    inputs: {
                      vm: {
                        initialBookmark: isBookmarked
                          ? currentBookmark
                          : this.generateInitialCreationBookmark(currentMfe, currentWorkspace),
                        permissions: this.permissions
                      }
                    }
                  }
                : {
                    type: PageNotBookmarkableDialogComponent,
                    inputs: {
                      mfeBaseUrl: currentMfe.baseHref
                    }
                  },
              {
                key: isBookmarkable
                  ? `REMOTES.MANAGE_BOOKMARK.DIALOG.${isBookmarked ? 'UPDATE' : 'CREATE'}_ACTIONS.SAVE`
                  : 'REMOTES.MANAGE_BOOKMARK.DIALOG.NO_ENDPOINT_CONFIGURED_CONFIRM_BUTTON',
                icon: isBookmarkable ? PrimeIcons.CHECK : PrimeIcons.TIMES
              },
              isBookmarkable
                ? {
                    key: `REMOTES.MANAGE_BOOKMARK.DIALOG.${isBookmarked ? 'UPDATE' : 'CREATE'}_ACTIONS.CANCEL`,
                    icon: isBookmarked ? PrimeIcons.TRASH : PrimeIcons.TIMES
                  }
                : undefined,
              this.getBookmarkDialogConfig(isBookmarkable)
            )
            .pipe(
              withLatestFrom(this.endpointForCurrentPage$),
              map(([dialogState, endpointForCurrentPage]) => ({
                dialogState,
                isBookmarkable,
                isBookmarked,
                currentWorkspace,
                currentMfe,
                currentPage,
                endpointForCurrentPage
              }))
            )
        }),
        mergeMap(
          ({
            dialogState,
            isBookmarkable,
            isBookmarked,
            currentWorkspace,
            currentMfe,
            currentPage,
            endpointForCurrentPage
          }) => {
            if (!isBookmarkable || !dialogState) {
              return of(undefined)
            }
            if (!isBookmarked) {
              if (dialogState.button === 'secondary') {
                return of(undefined)
              }
              let createBookmark = dialogState.result as CreateBookmark
              if (endpointForCurrentPage) {
                let endpointParameters = {}
                if (currentPage && endpointForCurrentPage.path) {
                  const pagePath = extractPathAfter(currentPage.path, currentMfe.baseHref)
                  endpointParameters = mapPathSegmentsToPathParemeters(endpointForCurrentPage.path, pagePath)
                }
                createBookmark = {
                  ...createBookmark,
                  endpointName: endpointForCurrentPage.name ?? '',
                  endpointParameters
                }
              }
              return this.bookmarkApiUtils
                .createNewBookmark(createBookmark)
                .pipe(map((result) => ({ result, currentWorkspace })))
            }
            if (isBookmarked) {
              const dialogResultBookmark = dialogState.result as Bookmark
              if (dialogState.button === 'secondary') {
                return this.bookmarkApiUtils
                  .deleteBookmarkById(dialogResultBookmark.id)
                  .pipe(map((result) => ({ result, currentWorkspace })))
              }
              const itemToEdit: UpdateBookmark = {
                id: dialogResultBookmark.id,
                position: dialogResultBookmark.position ?? 0,
                displayName: dialogResultBookmark.displayName,
                modificationCount: dialogResultBookmark.modificationCount ?? 0
              }
              return this.bookmarkApiUtils
                .editBookmark(dialogResultBookmark.id, itemToEdit)
                .pipe(map((result) => ({ result, currentWorkspace })))
            }
            return of(undefined)
          }
        ),
        filter((data) => data !== undefined),
        mergeMap(({ result, currentWorkspace }) => {
          if (result === undefined) {
            return of(undefined)
          }
          return this.bookmarkApiUtils.loadBookmarks(currentWorkspace.workspaceName)
        }),
        filter((result) => result !== undefined)
      )
      .subscribe((result) => {
        this.bookmarks$.next(result)
      })
  }

  private getBookmarkDialogConfig(isBookmarkable: boolean): PortalDialogConfig {
    return {
      position: 'top-right',
      style: {
        top: '4rem'
      },
      modal: false,
      draggable: true,
      resizable: true,
      width: isBookmarkable ? '400px' : undefined
    } as PortalDialogConfig
  }

  private generateInitialCreationBookmark(currentMfe: MfeInfo, currentWorkspace: Workspace) {
    const createBookmark: CreateBookmark = {
      displayName: document.title,
      endpointName: '',
      position: 0,
      productName: currentMfe.productName,
      appId: currentMfe.appId,
      workspaceName: currentWorkspace.workspaceName,
      scope: CreateBookmarkScopeEnum.Private
    }
    return createBookmark
  }
}
