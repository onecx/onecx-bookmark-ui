import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { Action, Store } from '@ngrx/store'
import { catchError, map, mergeMap, of, switchMap, tap, withLatestFrom } from 'rxjs'
import FileSaver from 'file-saver'

import { AppStateService, PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import { DialogState, PortalDialogService } from '@onecx/portal-integration-angular'

import * as actton from 'src/app/shared/utils/actionButtons'
import {
  Bookmark,
  BookmarkScope,
  BookmarksInternalAPIService,
  BookmarkExportImportAPIService,
  BookmarkSearchCriteria,
  CreateBookmark,
  UpdateBookmark,
  EximBookmarkScope,
  ExportBookmarksRequest,
  BookmarkSnapshot,
  EximMode
} from 'src/app/shared/generated'
import { getCurrentDateTime } from 'src/app/shared/utils/utils'

import { BookmarkConfigureActions, ActionErrorType } from './bookmark-configure.actions'
import { bookmarkSearchSelectors, selectBookmarkConfigureViewModel } from './bookmark-configure.selectors'
import { BookmarkDetailComponent, CombinedBookmark } from '../bookmark-detail/bookmark-detail.component'
import { BookmarkDeleteComponent } from '../bookmark-delete/bookmark-delete.component'
import { BookmarkExportComponent } from '../bookmark-export/bookmark-export.component'
import { BookmarkImportComponent } from '../bookmark-import/bookmark-import.component'
import { BookmarkSortComponent } from '../bookmark-sort/bookmark-sort.component'

export type ImportBookmarkData = {
  workspaceName: string
  scopes: Array<EximBookmarkScope>
  snapshot: BookmarkSnapshot | undefined
  importMode: EximMode
}
@Injectable()
export class BookmarkConfigureEffects {
  private context = 'BOOKMARK'

  constructor(
    private readonly actions$: Actions,
    private readonly user: UserService,
    private readonly store: Store,
    private readonly appStateService: AppStateService,
    private readonly portalDialogService: PortalDialogService,
    private readonly messageService: PortalMessageService,
    private readonly bookmarksService: BookmarksInternalAPIService,
    private readonly eximService: BookmarkExportImportAPIService
  ) {}

  private dateFormat(lang: string) {
    return lang === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'M/d/yy, hh:mm:ss a'
  }

  private buildExceptionKey(status: string): string {
    return 'EXCEPTIONS.HTTP_STATUS_' + status + '.' + this.context
  }

  private sortByPosition(a: Bookmark, b: Bookmark): number {
    return a.position - b.position
  }

  search$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BookmarkConfigureActions.search),
      withLatestFrom(this.appStateService.currentWorkspace$.asObservable()),
      mergeMap(([, { workspaceName }]) => {
        return this.performSearch(workspaceName)
      })
    )
  })

  refreshSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        BookmarkConfigureActions.createBookmarkSucceeded,
        BookmarkConfigureActions.editBookmarkSucceeded,
        BookmarkConfigureActions.deleteBookmarkSucceeded,
        BookmarkConfigureActions.importBookmarksSucceeded,
        BookmarkConfigureActions.sortBookmarksSucceeded
      ),
      withLatestFrom(this.appStateService.currentWorkspace$.asObservable()),
      mergeMap(([, { workspaceName }]) => {
        return this.performSearch(workspaceName)
      })
    )
  })

  /**
   * Bookmark Search in context of current workspace
   */
  private performSearch(workspaceName: string) {
    this.context = 'BOOKMARKS'
    let criteria: BookmarkSearchCriteria = { workspaceName: workspaceName }
    // Normal user must see only his own bookmarks
    if (!this.user.hasPermission('BOOKMARK#ADMIN_EDIT')) criteria = { ...criteria, scope: BookmarkScope.Private }
    return this.bookmarksService.searchBookmarksByCriteria({ bookmarkSearchCriteria: criteria }).pipe(
      map(({ stream, totalElements }) =>
        BookmarkConfigureActions.bookmarkSearchResultsReceived({
          results: stream?.sort(this.sortByPosition) ?? [],
          totalNumberOfResults: totalElements ?? 0
        })
      ),
      catchError((error) => {
        return of(
          BookmarkConfigureActions.bookmarkSearchFailed({
            status: error.status,
            errorText: error.message,
            exceptionKey: this.buildExceptionKey(error.status)
          })
        )
      })
    )
  }

  /**
   * EXPORT
   */
  exportBookmarks$ = createEffect(() => {
    this.context = 'BOOKMARKS'
    return this.actions$.pipe(
      ofType(BookmarkConfigureActions.exportBookmarks),
      withLatestFrom(
        this.appStateService.currentWorkspace$.asObservable(),
        this.store.select(bookmarkSearchSelectors.selectResults)
      ),
      map(([, { workspaceName }, results]) => {
        return { workspaceName: workspaceName, exist: results.length > 0 }
      }),
      mergeMap((data) => {
        // no bookmarks to be exported
        if (!data.exist) return of({ button: 'secondary' } as DialogState<ExportBookmarksRequest | undefined>)
        // no ADMIN permission: export PRIVATE bookmarks only
        if (!this.user.hasPermission('BOOKMARK#ADMIN_EDIT'))
          return of({
            button: 'primary',
            result: { workspaceName: data.workspaceName, scopes: [EximBookmarkScope.Private] }
          } as DialogState<ExportBookmarksRequest>)
        // any other cases: ADMIN user select scopes
        return this.portalDialogService.openDialog<ExportBookmarksRequest | undefined>(
          'BOOKMARK_EXPORT.HEADER',
          { type: BookmarkExportComponent, inputs: { workspaceName: data.workspaceName } },
          actton.exportButton,
          actton.cancelButton,
          {
            modal: true,
            draggable: true,
            resizable: true,
            width: '400px',
            autoFocusButton: 'secondary'
          }
        )
      }),
      switchMap((dialogResult) => {
        // cancel
        if (!dialogResult || dialogResult.button === 'secondary')
          return of(BookmarkConfigureActions.exportBookmarksCancelled())
        // wrong result
        if (!dialogResult?.result || dialogResult?.result.scopes.length === 0) {
          throw new Error('VALIDATION.ERRORS.RESULT_WRONG') // error message
        }
        // execute
        return this.eximService.exportBookmarks({ exportBookmarksRequest: dialogResult?.result }).pipe(
          map((snapshot) => {
            const workspaceJson = JSON.stringify(snapshot, null, 2)
            FileSaver.saveAs(
              new Blob([workspaceJson], { type: 'text/json' }),
              `onecx-bookmarks_${getCurrentDateTime()}.json`
            )
            this.messageService.success({ summaryKey: 'BOOKMARK_EXPORT.SUCCESS' })
            return BookmarkConfigureActions.exportBookmarksSucceeded()
          })
        )
      }),
      catchError((error) => {
        return of(BookmarkConfigureActions.exportBookmarksFailed({ status: error.status, errorText: error.message }))
      })
    )
  })

  /**
   * IMPORT
   */
  importBookmarks$ = createEffect(() => {
    this.context = 'BOOKMARKS'
    return this.actions$.pipe(
      ofType(BookmarkConfigureActions.importBookmarks),
      withLatestFrom(this.appStateService.currentWorkspace$.asObservable(), this.user.lang$.asObservable()),
      mergeMap(([, { workspaceName }, lang]) => {
        // select file
        return this.portalDialogService.openDialog<ImportBookmarkData | undefined>(
          'BOOKMARK_IMPORT.HEADER',
          {
            type: BookmarkImportComponent,
            inputs: { workspaceName: workspaceName, dateFormat: this.dateFormat(lang) }
          },
          actton.importButton,
          actton.cancelButton,
          {
            modal: true,
            draggable: true,
            resizable: true,
            width: '550px',
            autoFocusButton: 'secondary'
          }
        )
      }),
      switchMap((dialogResult) => {
        // cancel
        if (!dialogResult || dialogResult.button === 'secondary')
          return of(BookmarkConfigureActions.importBookmarksCancelled())
        // wrong result
        if (!dialogResult?.result?.snapshot) {
          throw new Error('VALIDATION.ERRORS.RESULT_WRONG')
        }
        // execute
        return this.eximService
          .importBookmarks({
            workspaceName: dialogResult?.result.workspaceName,
            bookmarkSnapshot: dialogResult?.result.snapshot,
            importMode: dialogResult?.result.importMode,
            scopes: dialogResult?.result.scopes
          })
          .pipe(
            map(() => {
              this.messageService.success({ summaryKey: 'BOOKMARK_EXPORT.SUCCESS' })
              return BookmarkConfigureActions.importBookmarksSucceeded()
            })
          )
      }),
      catchError((error) => {
        return of(BookmarkConfigureActions.importBookmarksFailed({ status: error.status, errorText: error.message }))
      })
    )
  })

  /**
   * SORT
   */
  openSortingDialog$ = createEffect(() => {
    this.context = 'BOOKMARKS'
    return this.actions$.pipe(
      ofType(BookmarkConfigureActions.openSortingDialog),
      concatLatestFrom(() => this.store.select(selectBookmarkConfigureViewModel)),
      map(([, viewModel]) => {
        return viewModel.results
      }),
      mergeMap((bookmarks) => {
        return this.portalDialogService.openDialog<UpdateBookmark[] | undefined>(
          'BOOKMARK_SORT.HEADER',
          {
            type: BookmarkSortComponent,
            inputs: { vm: { initialBookmarks: bookmarks } }
          },
          actton.saveButton,
          actton.cancelButton,
          {
            modal: true,
            draggable: true,
            resizable: true,
            autoFocusButton: 'secondary'
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button === 'secondary')
          return of(BookmarkConfigureActions.sortBookmarksCancelled())
        if (!dialogResult?.result || dialogResult?.result.length === 0) {
          throw new Error('VALIDATION.ERRORS.RESULT_WRONG') // error message
        }
        // execute
        return this.bookmarksService
          .updateBookmarksOrder({ bookmarkReorderRequest: { bookmarks: dialogResult?.result } })
          .pipe(
            map(() => {
              this.messageService.success({ summaryKey: 'BOOKMARK_SORT.SUCCESS' })
              return BookmarkConfigureActions.sortBookmarksSucceeded()
            })
          )
      }),
      catchError((error) => {
        return of(BookmarkConfigureActions.sortBookmarksFailed({ status: error.status, errorText: error.message }))
      })
    )
  })

  /**
   * DETAIL => displaying & editing
   */
  toggleBookmark$ = createEffect(() => {
    this.context = 'BOOKMARK'
    return this.actions$.pipe(
      ofType(BookmarkConfigureActions.toggleBookmark),
      withLatestFrom(
        this.appStateService.currentWorkspace$.asObservable(),
        this.user.profile$.asObservable(),
        this.user.lang$.asObservable(),
        this.store.select(bookmarkSearchSelectors.selectResults)
      ),
      map(([action, { workspaceName }, profile, lang, results]) => {
        return {
          bookmark: results.find((item) => item.id === action.id),
          workspaceName: workspaceName,
          userId: profile.userId,
          lang: lang
        }
      }),
      switchMap((data) => {
        if (!data.bookmark)
          return of(BookmarkConfigureActions.editBookmarkFailed({ status: '', errorText: 'Missing Bookmark' }))
        // execute
        return this.bookmarksService
          .updateBookmark({
            id: data.bookmark?.id,
            updateBookmark: { ...data.bookmark, disabled: !data.bookmark.disabled } as UpdateBookmark
          })
          .pipe(
            map(() => {
              this.messageService.success({ summaryKey: 'BOOKMARK_DETAIL.EDIT.SUCCESS' })
              return BookmarkConfigureActions.editBookmarkSucceeded()
            })
          )
      }),
      catchError((error) => {
        return of(BookmarkConfigureActions.editBookmarkFailed({ status: error.status, errorText: error.message }))
      })
    )
  })

  /**
   * DETAIL => displaying & editing
   */
  viewOrEditBookmark$ = createEffect(() => {
    this.context = 'BOOKMARK'
    const canEdit = (bookmark?: CombinedBookmark) => {
      return (
        (this.user.hasPermission('BOOKMARK#EDIT') && bookmark?.scope === BookmarkScope.Private) ||
        (this.user.hasPermission('BOOKMARK#ADMIN_EDIT') && bookmark?.scope === BookmarkScope.Public)
      )
    }
    return this.actions$.pipe(
      ofType(BookmarkConfigureActions.viewOrEditBookmark),
      withLatestFrom(
        this.appStateService.currentWorkspace$.asObservable(),
        this.user.profile$.asObservable(),
        this.user.lang$.asObservable(),
        this.store.select(bookmarkSearchSelectors.selectResults)
      ),
      map(([action, { workspaceName }, profile, lang, results]) => {
        return {
          bookmark: results.find((item) => item.id === action.id),
          workspaceName: workspaceName,
          userId: profile.userId,
          lang: lang
        }
      }),
      mergeMap((data) => {
        const editable = canEdit(data.bookmark)
        return this.portalDialogService.openDialog<CombinedBookmark | undefined>(
          `DIALOG.DETAIL.${editable ? 'EDIT' : 'VIEW'}.HEADER`,
          {
            type: BookmarkDetailComponent,
            inputs: {
              workspaceName: data.workspaceName,
              dateFormat: this.dateFormat(data.lang),
              userId: data.userId,
              editable: editable,
              vm: { initialBookmark: data.bookmark, changeMode: editable ? 'EDIT' : 'VIEW' }
            }
          },
          editable ? actton.saveButton : actton.closeButton,
          editable ? actton.cancelButton : undefined,
          {
            modal: true,
            draggable: true,
            resizable: true,
            width: '600px',
            autoFocusButton: 'secondary'
          }
        )
      }),
      switchMap((dialogResult) => {
        if (
          !dialogResult ||
          (dialogResult.button === 'secondary' && canEdit(dialogResult.result)) ||
          (dialogResult.button === 'primary' && !canEdit(dialogResult.result))
        ) {
          return of(BookmarkConfigureActions.editBookmarkCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('VALIDATION.ERRORS.RESULT_WRONG') // error message
        }
        // execute
        return this.bookmarksService
          .updateBookmark({
            id: (dialogResult.result as Bookmark).id,
            updateBookmark: dialogResult.result as UpdateBookmark
          })
          .pipe(
            map(() => {
              this.messageService.success({ summaryKey: 'BOOKMARK_DETAIL.EDIT.SUCCESS' })
              return BookmarkConfigureActions.editBookmarkSucceeded()
            })
          )
      }),
      catchError((error) => {
        return of(BookmarkConfigureActions.editBookmarkFailed({ status: error.status, errorText: error.message }))
      })
    )
  })

  /**
   * DETAIL => create URL bookmark
   */
  createBookmark$ = createEffect(() => {
    this.context = 'BOOKMARK'
    return this.actions$.pipe(
      ofType(BookmarkConfigureActions.createBookmark),
      withLatestFrom(this.appStateService.currentWorkspace$.asObservable(), this.user.profile$.asObservable()),
      mergeMap(([, { workspaceName }, profile]) => {
        return this.portalDialogService.openDialog<CombinedBookmark | undefined>(
          `DIALOG.DETAIL.CREATE.HEADER`,
          {
            type: BookmarkDetailComponent,
            inputs: {
              workspaceName: workspaceName,
              editable: true,
              userId: profile.userId,
              vm: { initialBookmark: {}, changeMode: 'CREATE' }
            }
          },
          actton.saveButton,
          actton.cancelButton,
          {
            modal: true,
            draggable: true,
            resizable: true,
            width: '500px',
            autoFocusButton: 'secondary'
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button === 'secondary') {
          return of(BookmarkConfigureActions.createBookmarkCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('VALIDATION.ERRORS.RESULT_WRONG') // error message
        }
        // execute
        const item = { ...dialogResult.result } as CreateBookmark
        return this.bookmarksService.createNewBookmark({ createBookmark: item }).pipe(
          map(() => {
            this.messageService.success({ summaryKey: 'BOOKMARK_DETAIL.CREATE.SUCCESS' })
            return BookmarkConfigureActions.createBookmarkSucceeded()
          })
        )
      }),
      catchError((error) => {
        return of(BookmarkConfigureActions.createBookmarkFailed({ status: error.status, errorText: error.message }))
      })
    )
  })

  /**
   * DETAIL => copy bookmark
   */
  copyBookmark$ = createEffect(() => {
    this.context = 'BOOKMARK'
    return this.actions$.pipe(
      ofType(BookmarkConfigureActions.copyBookmark),
      withLatestFrom(
        this.appStateService.currentWorkspace$.asObservable(),
        this.user.profile$.asObservable(),
        this.store.select(bookmarkSearchSelectors.selectResults)
      ),
      map(([action, { workspaceName }, profile, results]) => {
        return {
          bookmark: { ...results.find((item) => item.id === action.id), id: undefined } as CombinedBookmark,
          workspaceName: workspaceName,
          userId: profile.userId
        }
      }),
      mergeMap((data) => {
        return this.portalDialogService.openDialog<CombinedBookmark | undefined>(
          `DIALOG.DETAIL.CREATE.HEADER`,
          {
            type: BookmarkDetailComponent,
            inputs: {
              workspaceName: data.workspaceName,
              editable: true,
              userId: data.userId,
              vm: { initialBookmark: data.bookmark, changeMode: 'COPY' }
            }
          },
          actton.saveButton,
          actton.cancelButton,
          {
            modal: true,
            draggable: true,
            resizable: true,
            width: '500px',
            autoFocusButton: 'secondary'
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button === 'secondary') {
          return of(BookmarkConfigureActions.createBookmarkCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('VALIDATION.ERRORS.RESULT_WRONG') // error message
        }
        // execute
        const item = { ...dialogResult.result } as CreateBookmark
        return this.bookmarksService.createNewBookmark({ createBookmark: item }).pipe(
          map(() => {
            this.messageService.success({ summaryKey: 'BOOKMARK_DETAIL.CREATE.SUCCESS' })
            return BookmarkConfigureActions.createBookmarkSucceeded()
          })
        )
      }),
      catchError((error) => {
        return of(BookmarkConfigureActions.createBookmarkFailed({ status: error.status, errorText: error.message }))
      })
    )
  })

  /**
   * DELETE
   */
  deleteBookmark$ = createEffect(() => {
    this.context = 'BOOKMARK'
    return this.actions$.pipe(
      ofType(BookmarkConfigureActions.openDeleteDialog),
      concatLatestFrom(() => this.store.select(bookmarkSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id === action.id)
      }),
      mergeMap((itemToDelete) => {
        return this.portalDialogService
          .openDialog<unknown>(
            `DIALOG.DETAIL.DELETE.HEADER`,
            { type: BookmarkDeleteComponent, inputs: { bookmark: itemToDelete } },
            actton.yesButton,
            actton.noButton,
            {
              modal: true,
              width: '450px',
              draggable: true,
              resizable: true,
              closeOnEscape: true,
              closeAriaLabel: 'ACTIONS.NAVIGATION.CLOSE.TOOLTIP',
              autoFocusButton: 'secondary'
            }
          )
          .pipe(
            map((state): [DialogState<unknown>, Bookmark | undefined] => {
              return [state, itemToDelete]
            })
          )
      }),
      switchMap(([dialogResult, itemToDelete]) => {
        // cancel
        if (!dialogResult || dialogResult.button === 'secondary') {
          return of(BookmarkConfigureActions.deleteBookmarkCancelled())
        }
        if (!itemToDelete) {
          throw new Error('VALIDATION.ERRORS.NOT_FOUND') // error message
        }
        // execute
        return this.bookmarksService.deleteBookmarkById({ id: itemToDelete.id }).pipe(
          map(() => {
            this.messageService.success({ summaryKey: 'BOOKMARK_DELETE.SUCCESS' })
            return BookmarkConfigureActions.deleteBookmarkSucceeded()
          })
        )
      }),
      catchError((error) => {
        return of(
          BookmarkConfigureActions.deleteBookmarkFailed({
            status: error.status,
            errorText: error.message
          })
        )
      })
    )
  })

  /**
   * ERROR handling
   */

  // for each failed action which a TOAST message should appear
  errorMessages: { action: Action; key: string }[] = [
    {
      action: BookmarkConfigureActions.exportBookmarksFailed,
      key: 'BOOKMARK_EXPORT.ERROR'
    },
    {
      action: BookmarkConfigureActions.importBookmarksFailed,
      key: 'BOOKMARK_IMPORT.ERROR'
    },
    {
      action: BookmarkConfigureActions.sortBookmarksFailed,
      key: 'BOOKMARK_SORT.ERROR'
    },
    {
      action: BookmarkConfigureActions.createBookmarkFailed,
      key: 'BOOKMARK_DETAIL.CREATE.ERROR'
    },
    {
      action: BookmarkConfigureActions.editBookmarkFailed,
      key: 'BOOKMARK_DETAIL.EDIT.ERROR'
    },
    {
      action: BookmarkConfigureActions.deleteBookmarkFailed,
      key: 'BOOKMARK_DELETE.ERROR'
    }
  ]

  // build the toast message
  displayError$ = createEffect(
    () => {
      return this.actions$.pipe(
        tap((action) => {
          const e = this.errorMessages.find((e) => e.action.type === action.type)
          if (e) {
            console.error('displayError:', action)
            const error = action as ActionErrorType // convert due to access the props
            const text = error.errorText?.includes('VALIDATION.ERRORS') ? error.errorText : undefined
            this.messageService.error({
              summaryKey: e.key,
              detailKey: error.status ? this.buildExceptionKey(error.status) : text
            })
          }
        })
      )
    },
    { dispatch: false }
  )
}
