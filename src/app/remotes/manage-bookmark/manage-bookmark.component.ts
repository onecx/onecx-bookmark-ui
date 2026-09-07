import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Input,
  OnDestroy,
  Renderer2,
  ViewChild
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AsyncPipe } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
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

import { ButtonModule } from 'primeng/button'
import { DynamicDialogModule } from 'primeng/dynamicdialog'
import { RippleModule } from 'primeng/ripple'
import { PrimeIcons } from 'primeng/api'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { TooltipModule } from 'primeng/tooltip'

import { AngularAuthModule } from '@onecx/angular-auth'
import {
  AppConfigService,
  AppStateService,
  PortalMessageService,
  UserService
} from '@onecx/angular-integration-interface'
import { Endpoint, MfeInfo, PageInfo, Workspace } from '@onecx/integration-interface'
import {
  AngularRemoteComponentsModule,
  ocxRemoteComponent,
  ocxRemoteWebcomponent,
  SLOT_SERVICE,
  SlotService
} from '@onecx/angular-remote-components'
import {
  ButtonDialogButtonDetails,
  AngularAcceleratorModule,
  PortalDialogConfig,
  providePortalDialogService,
  PortalDialogService
} from '@onecx/angular-accelerator'
import { REMOTE_COMPONENT_CONFIG, RemoteComponentConfig } from '@onecx/angular-utils'

import { Bookmark, CreateBookmark, BookmarkScope, UpdateBookmark } from 'src/app/shared/generated'
import { BookmarkDialogCoordinatorService } from 'src/app/shared/utils/bookmark-dialog-coordinator.service'
import { extractPathAfter, mapPathSegmentsToPathParameters } from 'src/app/shared/utils/path.utils'
import { findPageBookmark, getEndpointForPath, isPageBookmarkable } from 'src/app/shared/utils/bookmark.utils'
import { BookmarkUtilService } from 'src/app/shared/utils/bookmarkUtil.service'

import { BookmarkCreateUpdateComponent } from './bookmark-create-update/bookmark-create-update.component'
import { PageNotBookmarkableDialogComponent } from './page-not-bookmarkable-dialog/page-not-bookmarkable-dialog.component'

export function slotInitializer(slotService: SlotService) {
  return () => slotService.init()
}

@Component({
  selector: 'app-manage-bookmark',
  imports: [
    AngularAuthModule,
    AngularAcceleratorModule,
    AngularRemoteComponentsModule,
    AsyncPipe,
    ButtonModule,
    DynamicDialogModule,
    ProgressSpinnerModule,
    RippleModule,
    TooltipModule,
    TranslateModule
  ],
  providers: [
    { provide: SLOT_SERVICE, useExisting: SlotService },
    providePortalDialogService(),
    BookmarkUtilService,
    PortalMessageService
  ],
  templateUrl: './manage-bookmark.component.html',
  styleUrl: './manage-bookmark.component.scss'
})
export class OneCXManageBookmarkComponent
  implements ocxRemoteComponent, ocxRemoteWebcomponent, AfterViewInit, OnDestroy
{
  private readonly remoteComponentConfig = inject<ReplaySubject<RemoteComponentConfig>>(REMOTE_COMPONENT_CONFIG)
  private readonly appConfigService = inject(AppConfigService)
  private readonly appStateService = inject(AppStateService)
  private readonly userService = inject(UserService)
  private readonly translateService = inject(TranslateService)
  private readonly portalDialogService = inject(PortalDialogService)
  private readonly bookmarkApiUtils = inject(BookmarkUtilService)
  private readonly slotService = inject(SlotService)
  private readonly destroyRef = inject(DestroyRef)

  permissions: string[] = []
  bookmarkLoadingError = false
  @ViewChild('bookmarkHost')
  private readonly bookmarkHost!: ElementRef<HTMLElement>
  removeDocumentClickListener: (() => void) | undefined
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
    private readonly renderer: Renderer2,
    private readonly bookmarkDialogCoordinatorService: BookmarkDialogCoordinatorService
  ) {
    this.bookmarkDialogCoordinatorService.register('manage', () => {
      this.closeActivePortalDialog()
    })

    this.userService.lang$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lang) => this.translateService.use(lang))

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

  ngAfterViewInit(): void {
    this.removeDocumentClickListener = this.renderer.listen('body', 'click', (event: Event) => {
      const target = event.target
      const hostElement = this.bookmarkHost?.nativeElement

      if (!(target instanceof Node) || !hostElement) {
        return
      }

      const clickedInsideHost = hostElement.contains(target)
      const clickedInsideDialog = target instanceof Element && !!target.closest('[role="dialog"], .p-dialog')

      if (clickedInsideHost || clickedInsideDialog || !this.bookmarkDialogCoordinatorService.isOpen('manage')) {
        return
      }

      this.bookmarkDialogCoordinatorService.close('manage')
    })
  }

  ngOnDestroy(): void {
    this.removeDocumentClickListener?.()
  }

  private closeActivePortalDialog(): void {
    const dialogService = (this.portalDialogService as any).dialogService
    if (dialogService?.dialogComponentRefMap) {
      dialogService.dialogComponentRefMap.forEach((_: unknown, dialogRef: { close: () => void }) => {
        dialogRef?.close?.()
      })
    }
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.remoteComponentConfig.next(config)
    this.permissions = config.permissions
    this.bookmarkApiUtils.overwriteBaseURL(config.baseUrl)
    this.appConfigService.init(config.baseUrl)
    this.bookmarkApiUtils.loadBookmarksForApp(this.commonObs$, this.handleBookmarkLoadError).subscribe((result) => {
      this.bookmarks$.next(result)
    })
    this.slotService.init()
  }

  onOpenBookmarkDialog(): void {
    if (this.bookmarkDialogCoordinatorService.isOpen('manage')) {
      this.bookmarkDialogCoordinatorService.close('manage')
      return
    }

    this.bookmarkDialogCoordinatorService.open('manage')

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
            return of([])
          }
          if (!isBookmarked) {
            if (dialogState.button === 'secondary') {
              return of([])
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
          // istanbul ignore next
          return of(undefined)
        }),
        filter((data) => data !== undefined),
        mergeMap((result) => {
          return this.bookmarkApiUtils.loadBookmarksForApp(this.commonObs$, this.handleBookmarkLoadError)
        }),
        filter((result) => result !== undefined),
        first()
      )
      .subscribe({
        next: () => {
          this.bookmarkDialogCoordinatorService.close('manage')
        },
        error: () => {
          this.bookmarkDialogCoordinatorService.close('manage')
        }
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
      modal: true,
      draggable: true,
      resizable: true,
      width: isBookmarkable ? '400px' : undefined,
      closeOnEscape: true,
      showHeader: true,
      showXButton: true,
      keepInViewport: true
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
