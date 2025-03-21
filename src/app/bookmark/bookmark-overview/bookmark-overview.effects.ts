import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { ActivatedRoute, Router } from '@angular/router'
import { Action } from '@ngrx/store'
import { catchError, map, mergeMap, of, tap } from 'rxjs'

import { AppStateService, UserService } from '@onecx/angular-integration-interface'
import { PortalMessageService } from '@onecx/portal-integration-angular'

import { Bookmark, BookmarkScope, BookmarksInternal, BookmarkSearchCriteria } from 'src/app/shared/generated'

import { BookmarkOverviewActions, ActionErrorType } from './bookmark-overview.actions'

@Injectable()
export class BookmarkOverviewEffects {
  public userId: string | undefined
  public workspaceName = ''
  public datetimeFormat = 'medium'
  private context = 'BOOKMARK'

  constructor(
    private readonly actions$: Actions,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly messageService: PortalMessageService,
    private readonly appStateService: AppStateService,
    private readonly user: UserService,
    private readonly bookmarksService: BookmarksInternal
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
      ofType(BookmarkOverviewActions.search),
      mergeMap(() => {
        return this.performSearch(this.workspaceName)
      })
    )
  })
  refreshSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(),
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
        BookmarkOverviewActions.bookmarkSearchResultsReceived({
          results: stream?.sort(this.sortByPosition) ?? [],
          totalNumberOfResults: totalElements ?? 0
        })
      ),
      catchError((error) => {
        return of(
          BookmarkOverviewActions.bookmarkSearchFailed({
            status: error.status,
            errorText: error.message,
            exceptionKey: this.buildExceptionKey(error.status)
          })
        )
      })
    )
  }

  navigate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BookmarkOverviewActions.navigate),
        tap((action) => {
          this.router.navigate(action.path, { relativeTo: this.route })
        })
      ),
    { dispatch: false }
  )

  /**
   * ERROR handling
   */

  // for each failed action which a TOAST message should appear
  errorMessages: { action: Action; key: string }[] = [
    {
      action: BookmarkOverviewActions.bookmarkSearchFailed,
      key: 'BOOKMARK_EXPORT.ERROR'
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
