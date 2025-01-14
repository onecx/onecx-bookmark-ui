import { APP_INITIALIZER, Component, Inject, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { PrimeIcons } from 'primeng/api'
import { RippleModule } from 'primeng/ripple'
import { DynamicDialogModule } from 'primeng/dynamicdialog'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
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

import { AngularAuthModule } from '@onecx/angular-auth'
import { createRemoteComponentTranslateLoader } from '@onecx/angular-accelerator'
import { AppStateService, PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import { Endpoint, MfeInfo, PageInfo, Workspace } from '@onecx/integration-interface'
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
  ButtonDialogButtonDetails,
  PortalCoreModule,
  PortalDialogConfig,
  PortalDialogService,
  providePortalDialogService,
  AppConfigService
} from '@onecx/portal-integration-angular'

import { Bookmark, CreateBookmark, BookmarkScope, UpdateBookmark } from 'src/app/shared/generated'
import { extractPathAfter, mapPathSegmentsToPathParameters } from 'src/app/shared/utils/path.utils'
import { findPageBookmark, getEndpointForPath, isPageBookmarkable } from 'src/app/shared/utils/bookmark.utils'
import { BookmarkAPIUtilsService } from 'src/app/shared/utils/bookmarkApiUtils.service'

import { BookmarkCreateUpdateComponent } from './bookmark-create-update/bookmark-create-update.component'
import { PageNotBookmarkableDialogComponent } from './page-not-bookmarkable-dialog/page-not-bookmarkable-dialog.component'

export function slotInitializer(slotService: SlotService) {
  return () => slotService.init()
}

@Component({
  standalone: true,
  imports: [
    AngularAuthModule,
    AngularRemoteComponentsModule,
    CommonModule,
    RippleModule,
    PortalCoreModule,
    ProgressSpinnerModule,
    TranslateModule,
    DynamicDialogModule
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
  bookmarkLoadingError = false
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
    @Inject(BASE_URL) private readonly baseUrl: ReplaySubject<string>,
    private readonly appConfigService: AppConfigService,
    private readonly appStateService: AppStateService,
    private readonly userService: UserService,
    private readonly translateService: TranslateService,
    private readonly portalDialogService: PortalDialogService,
    private readonly bookmarkApiUtils: BookmarkAPIUtilsService
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
    this.bookmarkApiUtils.loadBookmarksForApp(this.commonObs$, this.handleBookmarkLoadError).subscribe((result) => {
      this.bookmarks$.next(result)
    })
  }

  onOpenBookmarkDialog(): void {
    combineLatest([this.isBookmarkable$, this.isBookmarked$, this.currentBookmark$, this.commonObs$])
      .pipe(
        first(),
        mergeMap(([isBookmarkable, isBookmarked, currentBookmark, [currentWorkspace, currentMfe, currentPage]]) => {
          return this.portalDialogService
            .openDialog<unknown>(
              `REMOTES.MANAGE_BOOKMARK.DIALOG.HEADER_${isBookmarked ? 'EDIT' : 'CREATE'}`,
              this.getDialogBody(isBookmarkable, isBookmarked, currentBookmark, currentMfe, currentWorkspace),
              this.getPrimaryButton(isBookmarkable, isBookmarked),
              this.getSecondaryButton(isBookmarkable, isBookmarked),
              this.getBookmarkDialogConfig(isBookmarkable)
            )
            .pipe(
              withLatestFrom(this.endpointForCurrentPage$),
              map(([dialogState, endpointForCurrentPage]) => ({
                dialogState,
                isBookmarkable,
                isBookmarked,
                currentMfe,
                currentPage,
                endpointForCurrentPage
              }))
            )
        }),
        mergeMap(({ dialogState, isBookmarkable, isBookmarked, currentMfe, currentPage, endpointForCurrentPage }) => {
          if (!isBookmarkable || !dialogState) {
            return of(undefined)
          }
          if (!isBookmarked) {
            if (dialogState.button === 'secondary') {
              return of(undefined)
            }
            const newBookmark = dialogState.result as CreateBookmark
            return this.createBookmark(newBookmark, endpointForCurrentPage, currentMfe, currentPage)
          }
          if (isBookmarked) {
            const dialogResultBookmark = dialogState.result as Bookmark
            if (dialogState.button === 'secondary') {
              return this.deleteBookmark(dialogResultBookmark.id)
            }
            return this.editBookmark(dialogResultBookmark)
          }
          return of(undefined)
        }),
        filter((data) => data !== undefined),
        mergeMap((result) => {
          if (result === undefined) {
            return of(undefined)
          }
          return this.bookmarkApiUtils.loadBookmarksForApp(this.commonObs$, this.handleBookmarkLoadError)
        }),
        filter((result) => result !== undefined),
        first()
      )
      .subscribe((result) => {
        this.bookmarks$.next(result)
      })
  }

  /**
   * DIALOG details
   */
  private getDialogBody(
    isBookmarkable: boolean,
    isBookmarked: boolean,
    currentBookmark: Bookmark | undefined,
    currentMfe: MfeInfo,
    currentWorkspace: Workspace
  ) {
    const dialogBody = isBookmarkable
      ? {
          type: BookmarkCreateUpdateComponent,
          inputs: {
            vm: {
              initialBookmark: isBookmarked ? currentBookmark : this.prepareNewBookmark(currentMfe, currentWorkspace),
              mode: isBookmarked ? 'EDIT' : 'CREATE',
              permissions: this.permissions
            }
          }
        }
      : {
          type: PageNotBookmarkableDialogComponent,
          inputs: {
            mfeBaseUrl: currentMfe.baseHref
          }
        }
    return dialogBody
  }

  private getPrimaryButton(isBookmarkable: boolean, isBookmarked: boolean): ButtonDialogButtonDetails {
    const mode = isBookmarked ? 'EDIT' : 'CREATE'
    return {
      key: isBookmarkable ? 'REMOTES.MANAGE_BOOKMARK.DIALOG.' + mode + '_ACTIONS.SAVE' : 'ACTIONS.NAVIGATION.CLOSE',
      icon: isBookmarkable ? PrimeIcons.SAVE : PrimeIcons.TIMES
    }
  }

  private getSecondaryButton(isBookmarkable: boolean, isBookmarked: boolean): ButtonDialogButtonDetails | undefined {
    const secondaryButton = isBookmarkable
      ? ({
          key: `REMOTES.MANAGE_BOOKMARK.DIALOG.${isBookmarked ? 'EDIT' : 'CREATE'}_ACTIONS.CANCEL`,
          icon: isBookmarked ? PrimeIcons.TRASH : PrimeIcons.TIMES
        } as ButtonDialogButtonDetails)
      : undefined
    return secondaryButton
  }

  private getBookmarkDialogConfig(isBookmarkable: boolean): PortalDialogConfig {
    return {
      position: 'top-right',
      style: { top: '4rem' },
      modal: false,
      draggable: true,
      resizable: true,
      width: isBookmarkable ? '400px' : undefined
    } as PortalDialogConfig
  }

  /**
   * CREATE
   */
  private prepareNewBookmark(currentMfe: MfeInfo, currentWorkspace: Workspace) {
    const newBookmark: CreateBookmark = {
      displayName: document.title,
      position: 0,
      productName: currentMfe.productName,
      appId: currentMfe.appId,
      workspaceName: currentWorkspace.workspaceName,
      scope: BookmarkScope.Private
    }
    return newBookmark
  }

  private createBookmark(
    newBookmark: CreateBookmark,
    endpointForCurrentPage: Endpoint | undefined,
    currentMfe: MfeInfo,
    currentPage: PageInfo | undefined
  ) {
    if (endpointForCurrentPage) {
      let endpointParameters = {}
      if (currentPage && endpointForCurrentPage.path) {
        const pagePath = extractPathAfter(currentPage.path, currentMfe.baseHref)
        endpointParameters = mapPathSegmentsToPathParameters(endpointForCurrentPage.path, pagePath)
      }
      newBookmark = {
        ...newBookmark,
        endpointName: endpointForCurrentPage.name,
        endpointParameters
      }
    }
    return this.bookmarkApiUtils.createNewBookmark(newBookmark)
  }

  private editBookmark(dialogResultBookmark: Bookmark) {
    const itemToEdit: UpdateBookmark = {
      id: dialogResultBookmark.id,
      position: dialogResultBookmark.position ?? 0,
      displayName: dialogResultBookmark.displayName,
      modificationCount: dialogResultBookmark.modificationCount ?? 0
    }
    return this.bookmarkApiUtils.editBookmark(dialogResultBookmark.id, itemToEdit)
  }

  private deleteBookmark(bookmarkId: string) {
    return this.bookmarkApiUtils.deleteBookmarkById(bookmarkId)
  }

  private readonly handleBookmarkLoadError = () => {
    this.bookmarkLoadingError = true
  }
}
