import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { Action, Store } from '@ngrx/store'
import { catchError, map, mergeMap, of, switchMap, tap, withLatestFrom } from 'rxjs'

import { AppStateService, UserService } from '@onecx/angular-integration-interface'
import {
  DialogState,
  ExportDataService,
  PortalDialogService,
  PortalMessageService
} from '@onecx/portal-integration-angular'

import * as actton from 'src/app/shared/utils/actionButtons'
import { Bookmark, BookmarkScope, BookmarksInternal, CreateBookmark, UpdateBookmark } from 'src/app/shared/generated'

import { BookmarkSearchActions, ActionErrorType } from './bookmark-search.actions'
import { bookmarkSearchSelectors, selectBookmarkSearchViewModel } from './bookmark-search.selectors'
import { BookmarkDetailComponent, CombinedBookmark } from '../bookmark-detail/bookmark-detail.component'
import { BookmarkDeleteComponent } from '../bookmark-delete/bookmark-delete.component'
import { BookmarkSortComponent } from '../bookmark-sort/bookmark-sort.component'

@Injectable()
export class BookmarkSearchEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly store: Store,
    private readonly portalDialogService: PortalDialogService,
    private readonly messageService: PortalMessageService,
    private readonly exportDataService: ExportDataService,
    private readonly appStateService: AppStateService,
    private readonly userService: UserService,
    private readonly bookmarksService: BookmarksInternal
  ) {}

  private buildExceptionKey(status: string): string {
    return 'EXCEPTIONS.HTTP_STATUS_' + status + '.BOOKMARK'
  }

  search$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BookmarkSearchActions.search),
      withLatestFrom(this.appStateService.currentWorkspace$.asObservable()),
      mergeMap(([, workspace]) => {
        return this.performSearch(workspace.workspaceName)
      })
    )
  })
  refreshSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        BookmarkSearchActions.copyBookmarkSucceeded,
        BookmarkSearchActions.createBookmarkSucceeded,
        BookmarkSearchActions.editBookmarkSucceeded,
        BookmarkSearchActions.deleteBookmarkSucceeded,
        BookmarkSearchActions.sortBookmarksSucceeded
      ),
      withLatestFrom(this.appStateService.currentWorkspace$.asObservable()),
      mergeMap(([, workspace]) => {
        return this.performSearch(workspace.workspaceName)
      })
    )
  })

  /**
   * Bookmark Search in context of current workspace
   */
  private performSearch(workspaceName: string) {
    return this.bookmarksService.searchBookmarksByCriteria({ workspaceName: workspaceName }).pipe(
      map(({ stream, totalElements }) =>
        BookmarkSearchActions.bookmarkSearchResultsReceived({
          results: stream ?? [],
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
   * EXPORT / IMPORT
   */
  exportData$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(BookmarkSearchActions.exportBookmarks),
        concatLatestFrom(() => this.store.select(selectBookmarkSearchViewModel)),
        map(([, viewModel]) => {
          this.exportDataService.exportCsv(viewModel.columns, viewModel.results, 'Bookmarks.csv')
        })
      )
    },
    { dispatch: false }
  )

  /**
   * SORT
   */
  openSortingDialog$ = createEffect(() => {
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
    const canEdit = (bookmark?: CombinedBookmark) => {
      return (
        (this.userService.hasPermission('BOOKMARK#EDIT') && bookmark?.scope === BookmarkScope.Private) ||
        (this.userService.hasPermission('BOOKMARK#ADMIN_EDIT') && bookmark?.scope === BookmarkScope.Public)
      )
    }
    return this.actions$.pipe(
      ofType(BookmarkSearchActions.viewOrEditBookmark),
      concatLatestFrom(() => this.store.select(bookmarkSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id === action.id) as CombinedBookmark
      }),
      mergeMap((bookmark: CombinedBookmark) => {
        const editable = canEdit(bookmark)
        return this.portalDialogService.openDialog<CombinedBookmark | undefined>(
          `BOOKMARK_DETAIL.${editable ? 'EDIT' : 'VIEW'}.HEADER`,
          {
            type: BookmarkDetailComponent,
            inputs: { vm: { initialBookmark: bookmark, changeMode: editable ? 'EDIT' : 'VIEW' } }
          },
          editable ? actton.saveButton : actton.closeButton,
          editable ? actton.cancelButton : undefined,
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
    return this.actions$.pipe(
      ofType(BookmarkSearchActions.createBookmark),
      mergeMap(() => {
        return this.portalDialogService.openDialog<CombinedBookmark | undefined>(
          `BOOKMARK_DETAIL.CREATE.HEADER`,
          {
            type: BookmarkDetailComponent,
            inputs: { vm: { initialBookmark: {}, changeMode: 'CREATE' } }
          },
          actton.saveButton,
          actton.cancelButton,
          {
            modal: true,
            draggable: true,
            resizable: true,
            width: '450px',
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

  copyBookmark$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BookmarkSearchActions.copyBookmark),
      concatLatestFrom(() => this.store.select(bookmarkSearchSelectors.selectResults)),
      map(([action, results]) => {
        return { ...results.find((item) => item.id === action.id), id: undefined }
      }),
      mergeMap((bookmark) => {
        return this.portalDialogService.openDialog<CreateBookmark | undefined>(
          `BOOKMARK_DETAIL.CREATE.HEADER`,
          {
            type: BookmarkDetailComponent,
            inputs: { vm: { initialBookmark: bookmark, changeMode: 'COPY' } }
          },
          actton.saveButton,
          actton.cancelButton,
          {
            modal: true,
            draggable: true,
            resizable: true,
            width: '450px',
            autoFocusButton: 'secondary'
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button === 'secondary') {
          return of(BookmarkSearchActions.copyBookmarkCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('VALIDATION.ERRORS.RESULT_WRONG') // error message
        }
        const item = { ...dialogResult.result } as CreateBookmark
        return this.bookmarksService.createNewBookmark(item).pipe(
          map(() => {
            this.messageService.success({ summaryKey: 'BOOKMARK_DETAIL.CREATE.SUCCESS' })
            return BookmarkSearchActions.copyBookmarkSucceeded()
          })
        )
      }),
      catchError((error) => {
        return of(BookmarkSearchActions.copyBookmarkFailed({ status: error.status, errorText: error.message }))
      })
    )
  })

  deleteBookmark$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BookmarkSearchActions.openDeleteDialog),
      concatLatestFrom(() => this.store.select(bookmarkSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id === action.id)
      }),
      mergeMap((itemToDelete) => {
        return this.portalDialogService
          .openDialog<unknown>(
            'BOOKMARK_DELETE.HEADER',
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
        if (!dialogResult || dialogResult.button === 'secondary') {
          return of(BookmarkSearchActions.deleteBookmarkCancelled())
        }
        if (!itemToDelete) {
          throw new Error('VALIDATION.ERRORS.NOT_FOUND') // error message
        }

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

  // for each failed action build the toast message key
  errorMessages: { action: Action; key: string }[] = [
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
