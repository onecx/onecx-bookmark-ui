import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { Action, Store } from '@ngrx/store'
import {
  AppStateService,
  DialogState,
  ExportDataService,
  PortalDialogService,
  PortalMessageService,
  UserService
} from '@onecx/portal-integration-angular'
import { PrimeIcons } from 'primeng/api'
import { catchError, map, mergeMap, of, switchMap, tap, withLatestFrom } from 'rxjs'
import { Bookmark, BookmarkScopeEnum, BookmarksInternal, UpdateBookmark } from 'src/app/shared/generated'
import { BookmarksSearchActions } from './bookmarks-search.actions'
import { bookmarksSearchSelectors, selectBookmarksSearchViewModel } from './bookmarks-search.selectors'
import { BookmarksDeleteComponent } from './dialogs/bookmarks-delete/bookmarks-delete.component'
import { CreateUpdateBookmarkDialogComponent } from 'src/app/shared/components/dialogs/create-update-bookmark-dialog/create-update-bookmark-dialog.component'
@Injectable()
export class BookmarksSearchEffects {
  constructor(
    private portalDialogService: PortalDialogService,
    private actions$: Actions,
    private bookmarksService: BookmarksInternal,
    private store: Store,
    private messageService: PortalMessageService,
    private readonly exportDataService: ExportDataService,
    private appStateService: AppStateService,
    private userService: UserService
  ) {}

  searchTriggered$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BookmarksSearchActions.searchTriggered),
      withLatestFrom(this.appStateService.currentWorkspace$.asObservable()),
      mergeMap(([, workspace]) => {
        return this.performSearch(workspace.workspaceName)
      })
    )
  })

  performSearch(workspaceName: string) {
    return this.bookmarksService
      .searchBookmarksByCriteria({
        workspaceName: workspaceName
      })
      .pipe(
        map(({ stream, totalElements }) =>
          BookmarksSearchActions.bookmarksSearchResultsReceived({
            results: stream ?? [],
            totalNumberOfResults: totalElements ?? 0
          })
        ),
        catchError((error) =>
          of(
            BookmarksSearchActions.bookmarksSearchResultsLoadingFailed({
              error
            })
          )
        )
      )
  }

  exportData$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(BookmarksSearchActions.exportButtonClicked),
        concatLatestFrom(() => this.store.select(selectBookmarksSearchViewModel)),
        map(([, viewModel]) => {
          this.exportDataService.exportCsv(viewModel.columns, viewModel.results, 'Bookmarks.csv')
        })
      )
    },
    { dispatch: false }
  )

  refreshSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BookmarksSearchActions.updateBookmarksSucceeded, BookmarksSearchActions.deleteBookmarksSucceeded),
      withLatestFrom(this.appStateService.currentWorkspace$.asObservable()),
      mergeMap(([, workspace]) => {
        return this.performSearch(workspace.workspaceName)
      })
    )
  })

  editButtonClicked$ = createEffect(() => {
    const canEdit = (bookmark?: Bookmark) => {
      return this.userService.hasPermission('BOOKMARK#EDIT') && bookmark?.scope !== BookmarkScopeEnum.Public
    }
    return this.actions$.pipe(
      ofType(BookmarksSearchActions.editBookmarksButtonClicked),
      concatLatestFrom(() => this.store.select(bookmarksSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id == action.id)
      }),
      mergeMap((initialBookmark) => {
        return this.portalDialogService.openDialog<Bookmark | undefined>(
          `BOOKMARKS_CREATE_UPDATE.UPDATE.HEADER${canEdit(initialBookmark) ? '' : '_READONLY'}`,
          {
            type: CreateUpdateBookmarkDialogComponent,
            inputs: {
              vm: {
                initialBookmark
              }
            }
          },
          `BOOKMARKS_CREATE_UPDATE.UPDATE.FORM.${canEdit(initialBookmark) ? 'SAVE' : 'CANCEL'}`,
          canEdit(initialBookmark) ? 'BOOKMARKS_CREATE_UPDATE.UPDATE.FORM.CANCEL' : undefined,
          {
            baseZIndex: 100,
            draggable: true,
            resizable: true,
            width: '400px'
          }
        )
      }),
      switchMap((dialogResult) => {
        if (
          !dialogResult ||
          (dialogResult.button == 'secondary' && canEdit(dialogResult.result)) ||
          (dialogResult.button == 'primary' && !canEdit(dialogResult.result))
        ) {
          return of(BookmarksSearchActions.updateBookmarksCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('DialogResult was not set as expected!')
        }
        const itemToEditId = dialogResult.result.id ?? ''
        const itemToEdit = {
          id: dialogResult.result.id,
          position: dialogResult.result.position ?? 0,
          displayName: dialogResult.result.displayName,
          modificationCount: dialogResult.result.modificationCount
        } as UpdateBookmark
        return this.bookmarksService.updateBookmark(itemToEditId, itemToEdit).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'BOOKMARKS_CREATE_UPDATE.UPDATE.SUCCESS'
            })
            return BookmarksSearchActions.updateBookmarksSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'BOOKMARKS_CREATE_UPDATE.UPDATE.ERROR'
        })
        return of(
          BookmarksSearchActions.updateBookmarksFailed({
            error
          })
        )
      })
    )
  })

  deleteButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BookmarksSearchActions.deleteBookmarksButtonClicked),
      concatLatestFrom(() => this.store.select(bookmarksSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id == action.id)
      }),
      mergeMap((itemToDelete) => {
        return this.portalDialogService
          .openDialog<unknown>(
            'BOOKMARKS_DELETE.HEADER',
            { type: BookmarksDeleteComponent, inputs: { bookmark: itemToDelete } },
            { key: 'ACTIONS.CONFIRMATION.YES', icon: PrimeIcons.CHECK },
            { key: 'ACTIONS.CONFIRMATION.NO', icon: PrimeIcons.TIMES }
          )
          .pipe(
            map((state): [DialogState<unknown>, Bookmark | undefined] => {
              return [state, itemToDelete]
            })
          )
      }),
      switchMap(([dialogResult, itemToDelete]) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(BookmarksSearchActions.deleteBookmarksCancelled())
        }
        if (!itemToDelete) {
          throw new Error('Item to delete not found!')
        }

        return this.bookmarksService.deleteBookmarkById(itemToDelete.id ?? '').pipe(
          map(() => {
            this.messageService.success({ summaryKey: 'BOOKMARKS_DELETE.SUCCESS' })
            return BookmarksSearchActions.deleteBookmarksSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({ summaryKey: 'BOOKMARKS_DELETE.ERROR' })
        return of(BookmarksSearchActions.deleteBookmarksFailed({ error }))
      })
    )
  })

  // for each error build the message
  errorMessages: { action: Action; key: string }[] = [
    {
      action: BookmarksSearchActions.bookmarksSearchResultsLoadingFailed,
      key: 'BOOKMARK_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
    },
    {
      action: BookmarksSearchActions.deleteBookmarksFailed,
      key: 'BOOKMARK_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
    }
  ]

  // listen on all errors
  displayError$ = createEffect(
    () => {
      return this.actions$.pipe(
        tap((action) => {
          const e = this.errorMessages.find((e) => e.action.type === action.type)
          if (e) {
            this.messageService.error({ summaryKey: e.key })
          }
        })
      )
    },
    { dispatch: false }
  )
}
