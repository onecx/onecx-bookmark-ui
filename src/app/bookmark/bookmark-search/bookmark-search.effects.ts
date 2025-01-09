import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { Action, Store } from '@ngrx/store'
import { catchError, map, mergeMap, of, switchMap, tap, withLatestFrom } from 'rxjs'
import { PrimeIcons } from 'primeng/api'

import { AppStateService, UserService } from '@onecx/angular-integration-interface'
import {
  DialogState,
  ExportDataService,
  PortalDialogService,
  PortalMessageService
} from '@onecx/portal-integration-angular'

import { Bookmark, BookmarkScopeEnum, BookmarksInternal, UpdateBookmark } from 'src/app/shared/generated'

import { BookmarkSearchActions } from './bookmark-search.actions'
import { bookmarkSearchSelectors, selectBookmarkSearchViewModel } from './bookmark-search.selectors'
import { BookmarkDetailComponent } from '../bookmark-detail/bookmark-detail.component'
import { BookmarkDeleteComponent } from '../bookmark-delete/bookmark-delete.component'

@Injectable()
export class BookmarkSearchEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly store: Store,
    private readonly portalDialogService: PortalDialogService,
    private readonly bookmarksService: BookmarksInternal,
    private readonly messageService: PortalMessageService,
    private readonly exportDataService: ExportDataService,
    private readonly appStateService: AppStateService,
    private readonly userService: UserService
  ) {}

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
      ofType(BookmarkSearchActions.updateBookmarksSucceeded, BookmarkSearchActions.deleteBookmarksSucceeded),
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
      catchError((error) => of(BookmarkSearchActions.bookmarkSearchResultsLoadingFailed({ error })))
    )
  }

  exportData$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(BookmarkSearchActions.exportButtonClicked),
        concatLatestFrom(() => this.store.select(selectBookmarkSearchViewModel)),
        map(([, viewModel]) => {
          this.exportDataService.exportCsv(viewModel.columns, viewModel.results, 'Bookmarks.csv')
        })
      )
    },
    { dispatch: false }
  )

  detailButtonClicked$ = createEffect(() => {
    const canEdit = (bookmark?: Bookmark) => {
      return (
        (this.userService.hasPermission('BOOKMARK#EDIT') && bookmark?.scope === BookmarkScopeEnum.Private) ||
        (this.userService.hasPermission('BOOKMARK#ADMIN_EDIT') && bookmark?.scope === BookmarkScopeEnum.Public)
      )
    }
    return this.actions$.pipe(
      ofType(BookmarkSearchActions.openDetailDialog),
      concatLatestFrom(() => this.store.select(bookmarkSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id === action.id)
      }),
      mergeMap((bookmark) => {
        return this.portalDialogService.openDialog<Bookmark | undefined>(
          `BOOKMARK_DETAIL.${canEdit(bookmark) ? 'EDIT' : 'VIEW'}.HEADER`,
          {
            type: BookmarkDetailComponent,
            inputs: { vm: { initialBookmark: bookmark } }
          },
          canEdit(bookmark) ? 'ACTIONS.SAVE' : 'ACTIONS.NAVIGATION.CLOSE',
          canEdit(bookmark) ? 'ACTIONS.CANCEL' : undefined,
          {
            modal: true,
            draggable: true,
            resizable: true,
            width: '400px'
          }
        )
      }),
      switchMap((dialogResult) => {
        console.log('dialogResult', dialogResult)
        if (
          !dialogResult ||
          (dialogResult.button === 'secondary' && canEdit(dialogResult.result)) ||
          (dialogResult.button === 'primary' && !canEdit(dialogResult.result))
        ) {
          return of(BookmarkSearchActions.updateBookmarksCancelled())
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
            this.messageService.success({ summaryKey: 'BOOKMARK_DETAIL.EDIT.SUCCESS' })
            return BookmarkSearchActions.updateBookmarksSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({ summaryKey: 'BOOKMARK_DETAIL.EDIT.ERROR' })
        return of(BookmarkSearchActions.updateBookmarksFailed({ error }))
      })
    )
  })

  deleteButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BookmarkSearchActions.deleteBookmarksButtonClicked),
      concatLatestFrom(() => this.store.select(bookmarkSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id == action.id)
      }),
      mergeMap((itemToDelete) => {
        return this.portalDialogService
          .openDialog<unknown>(
            'BOOKMARK_DELETE.HEADER',
            { type: BookmarkDeleteComponent, inputs: { bookmark: itemToDelete } },
            { key: 'ACTIONS.CONFIRMATION.YES', icon: PrimeIcons.CHECK },
            { key: 'ACTIONS.CONFIRMATION.NO', icon: PrimeIcons.TIMES },
            {
              modal: true,
              draggable: true,
              resizable: true
            }
          )
          .pipe(
            map((state): [DialogState<unknown>, Bookmark | undefined] => {
              return [state, itemToDelete]
            })
          )
      }),
      switchMap(([dialogResult, itemToDelete]) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(BookmarkSearchActions.deleteBookmarksCancelled())
        }
        if (!itemToDelete) {
          throw new Error('Item to delete not found!')
        }

        return this.bookmarksService.deleteBookmarkById(itemToDelete.id ?? '').pipe(
          map(() => {
            this.messageService.success({ summaryKey: 'BOOKMARK_DELETE.SUCCESS' })
            return BookmarkSearchActions.deleteBookmarksSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({ summaryKey: 'BOOKMARK_DELETE.ERROR' })
        return of(BookmarkSearchActions.deleteBookmarksFailed({ error }))
      })
    )
  })

  // for each error build the message
  errorMessages: { action: Action; key: string }[] = [
    {
      action: BookmarkSearchActions.bookmarkSearchResultsLoadingFailed,
      key: 'BOOKMARK_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
    },
    {
      action: BookmarkSearchActions.deleteBookmarksFailed,
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
