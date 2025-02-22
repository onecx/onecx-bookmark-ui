import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { Action, Store } from '@ngrx/store'
import { catchError, map, mergeMap, of, switchMap, tap } from 'rxjs'
import FileSaver from 'file-saver'

import { AppStateService, UserService } from '@onecx/angular-integration-interface'
import {
  DialogState,
  ExportDataService,
  PortalDialogService,
  PortalMessageService
} from '@onecx/portal-integration-angular'

import * as actton from 'src/app/shared/utils/actionButtons'
import {
  Bookmark,
  BookmarkScope,
  BookmarksInternal,
  BookmarkExportImport,
  BookmarkSearchCriteria,
  CreateBookmark,
  UpdateBookmark,
  EximBookmarkScope,
  ExportBookmarksRequest,
  ImportBookmarksRequest
} from 'src/app/shared/generated'
import { getCurrentDateTime } from 'src/app/shared/utils/utils'

import { BookmarkSearchActions, ActionErrorType } from './bookmark-search.actions'
import { bookmarkSearchSelectors, selectBookmarkSearchViewModel } from './bookmark-search.selectors'
import { BookmarkDetailComponent, CombinedBookmark } from '../bookmark-detail/bookmark-detail.component'
import { BookmarkDeleteComponent } from '../bookmark-delete/bookmark-delete.component'
import { BookmarkSortComponent } from '../bookmark-sort/bookmark-sort.component'
import { BookmarkExportComponent } from '../bookmark-export/bookmark-export.component'
import { BookmarkImportComponent } from '../bookmark-import/bookmark-import.component'

@Injectable()
export class BookmarkSearchEffects {
  public userId: string | undefined
  public workspaceName = ''
  public datetimeFormat = 'medium'
  private context = 'BOOKMARK'

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store,
    private readonly portalDialogService: PortalDialogService,
    private readonly messageService: PortalMessageService,
    private readonly exportDataService: ExportDataService,
    private readonly appStateService: AppStateService,
    private readonly user: UserService,
    private readonly bookmarksService: BookmarksInternal,
    private readonly eximService: BookmarkExportImport
  ) {
    this.datetimeFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'M/d/yy, hh:mm:ss a'
    this.user.profile$.subscribe({
      next: (data) => {
        this.userId = data.userId
      }
    })
    this.appStateService.currentWorkspace$.subscribe({
      next: (data) => {
        this.workspaceName = data.workspaceName
      }
    })
  }

  private buildExceptionKey(status: string): string {
    return 'EXCEPTIONS.HTTP_STATUS_' + status + '.' + this.context
  }

  private sortByPosition(a: Bookmark, b: Bookmark): number {
    return a.position - b.position
  }

  search$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BookmarkSearchActions.search),
      mergeMap(() => {
        return this.performSearch(this.workspaceName)
      })
    )
  })
  refreshSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        BookmarkSearchActions.createBookmarkSucceeded,
        BookmarkSearchActions.editBookmarkSucceeded,
        BookmarkSearchActions.deleteBookmarkSucceeded,
        BookmarkSearchActions.importBookmarksSucceeded,
        BookmarkSearchActions.sortBookmarksSucceeded
      ),
      mergeMap(() => {
        return this.performSearch(this.workspaceName)
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
    return this.bookmarksService.searchBookmarksByCriteria(criteria).pipe(
      map(({ stream, totalElements }) =>
        BookmarkSearchActions.bookmarkSearchResultsReceived({
          results: stream?.sort(this.sortByPosition) ?? [],
          totalNumberOfResults: totalElements ?? 0
        })
      ),
      catchError((error) => {
        return of(
          BookmarkSearchActions.bookmarkSearchFailed({
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
      ofType(BookmarkSearchActions.exportBookmarks),
      concatLatestFrom(() => this.store.select(bookmarkSearchSelectors.selectResults)),
      map(([, results]) => {
        return { exist: results.length > 0 }
      }),
      mergeMap((data) => {
        // no bookmarks to be exported
        if (!data.exist) return of({ button: 'secondary' } as DialogState<ExportBookmarksRequest | undefined>)
        // no ADMIN permission: export PRIVATE bookmarks only
        if (!this.user.hasPermission('BOOKMARK#ADMIN_EDIT'))
          return of({
            button: 'primary',
            result: { workspaceName: this.workspaceName, scopes: [EximBookmarkScope.Private] }
          } as DialogState<ExportBookmarksRequest>)
        // any other cases: ADMIN user select scopes
        return this.portalDialogService.openDialog<ExportBookmarksRequest | undefined>(
          'BOOKMARK_EXPORT.HEADER',
          { type: BookmarkExportComponent, inputs: { workspaceName: this.workspaceName } },
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
          return of(BookmarkSearchActions.exportBookmarksCancelled())
        // wrong result
        if (!dialogResult?.result || dialogResult?.result.scopes.length === 0) {
          throw new Error('VALIDATION.ERRORS.RESULT_WRONG') // error message
        }
        // execute
        return this.eximService.exportBookmarks(dialogResult?.result).pipe(
          map((snapshot) => {
            const workspaceJson = JSON.stringify(snapshot, null, 2)
            FileSaver.saveAs(
              new Blob([workspaceJson], { type: 'text/json' }),
              `onecx-bookmarks_${getCurrentDateTime()}.json`
            )
            this.messageService.success({ summaryKey: 'BOOKMARK_EXPORT.SUCCESS' })
            return BookmarkSearchActions.exportBookmarksSucceeded()
          })
        )
      }),
      catchError((error) => {
        return of(BookmarkSearchActions.exportBookmarksFailed({ status: error.status, errorText: error.message }))
      })
    )
  })

  /**
   * IMPORT
   */
  importBookmarks$ = createEffect(() => {
    this.context = 'BOOKMARKS'
    return this.actions$.pipe(
      ofType(BookmarkSearchActions.importBookmarks),
      mergeMap(() => {
        // select file
        return this.portalDialogService.openDialog<ImportBookmarksRequest | undefined>(
          'BOOKMARK_IMPORT.HEADER',
          {
            type: BookmarkImportComponent,
            inputs: { workspaceName: this.workspaceName, dateFormat: this.datetimeFormat }
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
          return of(BookmarkSearchActions.importBookmarksCancelled())
        // wrong result
        if (!dialogResult?.result?.snapshot) {
          throw new Error('VALIDATION.ERRORS.RESULT_WRONG')
        }
        // execute
        return this.eximService.importBookmarks(dialogResult?.result).pipe(
          map(() => {
            this.messageService.success({ summaryKey: 'BOOKMARK_EXPORT.SUCCESS' })
            return BookmarkSearchActions.importBookmarksSucceeded()
          })
        )
      }),
      catchError((error) => {
        return of(BookmarkSearchActions.importBookmarksFailed({ status: error.status, errorText: error.message }))
      })
    )
  })

  /**
   * SORT
   */
  openSortingDialog$ = createEffect(() => {
    this.context = 'BOOKMARKS'
    return this.actions$.pipe(
      ofType(BookmarkSearchActions.openSortingDialog),
      concatLatestFrom(() => this.store.select(selectBookmarkSearchViewModel)),
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
          return of(BookmarkSearchActions.sortBookmarksCancelled())
        if (!dialogResult?.result || dialogResult?.result.length === 0) {
          throw new Error('VALIDATION.ERRORS.RESULT_WRONG') // error message
        }
        // execute
        return this.bookmarksService.updateBookmarksOrder({ bookmarks: dialogResult?.result }).pipe(
          map(() => {
            this.messageService.success({ summaryKey: 'BOOKMARK_SORT.SUCCESS' })
            return BookmarkSearchActions.sortBookmarksSucceeded()
          })
        )
      }),
      catchError((error) => {
        return of(BookmarkSearchActions.sortBookmarksFailed({ status: error.status, errorText: error.message }))
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
      ofType(BookmarkSearchActions.viewOrEditBookmark),
      concatLatestFrom(() => this.store.select(bookmarkSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id === action.id)
      }),
      mergeMap((bookmark) => {
        const editable = canEdit(bookmark)
        return this.portalDialogService.openDialog<CombinedBookmark | undefined>(
          `DIALOG.DETAIL.${editable ? 'EDIT' : 'VIEW'}.HEADER`,
          {
            type: BookmarkDetailComponent,
            inputs: {
              workspaceName: this.workspaceName,
              dateFormat: this.datetimeFormat,
              userId: this.userId,
              editable: editable,
              vm: { initialBookmark: bookmark, changeMode: editable ? 'EDIT' : 'VIEW' }
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
          return of(BookmarkSearchActions.editBookmarkCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('VALIDATION.ERRORS.RESULT_WRONG') // error message
        }
        // execute
        return this.bookmarksService
          .updateBookmark((dialogResult.result as Bookmark).id, dialogResult.result as UpdateBookmark)
          .pipe(
            map(() => {
              this.messageService.success({ summaryKey: 'BOOKMARK_DETAIL.EDIT.SUCCESS' })
              return BookmarkSearchActions.editBookmarkSucceeded()
            })
          )
      }),
      catchError((error) => {
        return of(BookmarkSearchActions.editBookmarkFailed({ status: error.status, errorText: error.message }))
      })
    )
  })

  /**
   * DETAIL => create URL bookmark
   */
  createBookmark$ = createEffect(() => {
    this.context = 'BOOKMARK'
    return this.actions$.pipe(
      ofType(BookmarkSearchActions.createBookmark),
      mergeMap(() => {
        return this.portalDialogService.openDialog<CombinedBookmark | undefined>(
          `DIALOG.DETAIL.CREATE.HEADER`,
          {
            type: BookmarkDetailComponent,
            inputs: {
              workspaceName: this.workspaceName,
              editable: true,
              userId: this.userId,
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
          return of(BookmarkSearchActions.createBookmarkCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('VALIDATION.ERRORS.RESULT_WRONG') // error message
        }
        // execute
        const item = { ...dialogResult.result } as CreateBookmark
        return this.bookmarksService.createNewBookmark(item).pipe(
          map(() => {
            this.messageService.success({ summaryKey: 'BOOKMARK_DETAIL.CREATE.SUCCESS' })
            return BookmarkSearchActions.createBookmarkSucceeded()
          })
        )
      }),
      catchError((error) => {
        return of(BookmarkSearchActions.createBookmarkFailed({ status: error.status, errorText: error.message }))
      })
    )
  })

  /**
   * DETAIL => copy bookmark
   */
  copyBookmark$ = createEffect(() => {
    this.context = 'BOOKMARK'
    return this.actions$.pipe(
      ofType(BookmarkSearchActions.copyBookmark),
      concatLatestFrom(() => this.store.select(bookmarkSearchSelectors.selectResults)),
      map(([action, results]) => {
        return { ...results.find((item) => item.id === action.id), id: undefined } as CombinedBookmark
      }),
      mergeMap((bookmark) => {
        return this.portalDialogService.openDialog<CombinedBookmark | undefined>(
          `DIALOG.DETAIL.CREATE.HEADER`,
          {
            type: BookmarkDetailComponent,
            inputs: {
              workspaceName: this.workspaceName,
              editable: true,
              userId: this.userId,
              vm: { initialBookmark: bookmark, changeMode: 'COPY' }
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
          return of(BookmarkSearchActions.createBookmarkCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('VALIDATION.ERRORS.RESULT_WRONG') // error message
        }
        // execute
        const item = { ...dialogResult.result } as CreateBookmark
        return this.bookmarksService.createNewBookmark(item).pipe(
          map(() => {
            this.messageService.success({ summaryKey: 'BOOKMARK_DETAIL.CREATE.SUCCESS' })
            return BookmarkSearchActions.createBookmarkSucceeded()
          })
        )
      }),
      catchError((error) => {
        return of(BookmarkSearchActions.createBookmarkFailed({ status: error.status, errorText: error.message }))
      })
    )
  })

  /**
   * DELETE
   */
  deleteBookmark$ = createEffect(() => {
    this.context = 'BOOKMARK'
    return this.actions$.pipe(
      ofType(BookmarkSearchActions.openDeleteDialog),
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
              draggable: true,
              resizable: true,
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
          return of(BookmarkSearchActions.deleteBookmarkCancelled())
        }
        if (!itemToDelete) {
          throw new Error('VALIDATION.ERRORS.NOT_FOUND') // error message
        }
        // execute
        return this.bookmarksService.deleteBookmarkById(itemToDelete.id).pipe(
          map(() => {
            this.messageService.success({ summaryKey: 'BOOKMARK_DELETE.SUCCESS' })
            return BookmarkSearchActions.deleteBookmarkSucceeded()
          })
        )
      }),
      catchError((error) => {
        return of(
          BookmarkSearchActions.deleteBookmarkFailed({
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
      action: BookmarkSearchActions.exportBookmarksFailed,
      key: 'BOOKMARK_EXPORT.ERROR'
    },
    {
      action: BookmarkSearchActions.importBookmarksFailed,
      key: 'BOOKMARK_IMPORT.ERROR'
    },
    {
      action: BookmarkSearchActions.sortBookmarksFailed,
      key: 'BOOKMARK_SORT.ERROR'
    },
    {
      action: BookmarkSearchActions.createBookmarkFailed,
      key: 'BOOKMARK_DETAIL.CREATE.ERROR'
    },
    {
      action: BookmarkSearchActions.editBookmarkFailed,
      key: 'BOOKMARK_DETAIL.EDIT.ERROR'
    },
    {
      action: BookmarkSearchActions.deleteBookmarkFailed,
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
