import { Injectable } from '@angular/core'
import { Location } from '@angular/common'
import { catchError, map, mergeMap, Observable, of, retry, tap } from 'rxjs'

import { MfeInfo, PageInfo, Workspace } from '@onecx/integration-interface'
import { AppStateService, PortalMessageService } from '@onecx/angular-integration-interface'

import { BookmarksInternal, Configuration, CreateBookmark, UpdateBookmark } from '../generated'
import { environment } from 'src/environments/environment'

@Injectable({ providedIn: 'any' })
export class BookmarkAPIUtilsService {
  constructor(
    private readonly bookmarkService: BookmarksInternal,
    private readonly messageService: PortalMessageService,
    private readonly appStateService: AppStateService
  ) {}

  overwriteBaseURL(baseUrl: string) {
    this.bookmarkService.configuration = new Configuration({
      basePath: Location.joinWithSlash(baseUrl, environment.apiPrefix)
    })
  }

  loadBookmarksForApp(obs: Observable<[Workspace, MfeInfo, PageInfo | undefined]>, onError?: () => void) {
    return obs.pipe(
      mergeMap(([currentWorkspace, currentMfe]) => {
        return this.bookmarkService.searchUserBookmarksByCriteria({
          workspaceName: currentWorkspace.workspaceName,
          productName: currentMfe.productName,
          appId: currentMfe.appId
        })
      }),
      map((res) => res.stream ?? []),
      retry({ delay: 500, count: 3 }),
      catchError((err) => {
        console.error('Unable to load bookmarks for current application or user.', err)
        if (onError) {
          onError()
        }
        return of(undefined)
      })
    )
  }

  loadBookmarks(onError?: () => void) {
    return this.appStateService.currentWorkspace$.pipe(
      mergeMap((workspace) => {
        return this.bookmarkService.searchBookmarksByCriteria({
          workspaceName: workspace.workspaceName
        })
      }),
      map((res) => res.stream ?? []),
      retry({ delay: 500, count: 3 }),
      catchError((err) => {
        console.error('Unable to load bookmarks for current user.', err)
        if (onError) {
          onError()
        }
        return of(undefined)
      })
    )
  }

  createNewBookmark(createBookmark: CreateBookmark) {
    return this.bookmarkService.createNewBookmark(createBookmark).pipe(
      tap(() => {
        this.messageService.success({
          summaryKey: 'BOOKMARK_DETAIL.CREATE.SUCCESS'
        })
      }),
      catchError(() => {
        this.messageService.error({
          summaryKey: 'BOOKMARK_DETAIL.CREATE.ERROR'
        })
        return of(undefined)
      })
    )
  }

  deleteBookmarkById(bookmarkId: string) {
    return this.bookmarkService.deleteBookmarkById(bookmarkId).pipe(
      tap(() => {
        this.messageService.success({
          summaryKey: 'BOOKMARK_DELETE.SUCCESS'
        })
      }),
      catchError(() => {
        this.messageService.error({
          summaryKey: 'BOOKMARK_DELETE.ERROR'
        })
        return of(undefined)
      })
    )
  }

  editBookmark(bookmarkId: string, updatedBookmark: UpdateBookmark) {
    return this.bookmarkService.updateBookmark(bookmarkId, updatedBookmark).pipe(
      tap(() => {
        this.messageService.success({
          summaryKey: 'BOOKMARK_DETAIL.EDIT.SUCCESS'
        })
      }),
      catchError(() => {
        this.messageService.error({
          summaryKey: 'BOOKMARK_DETAIL.EDIT.ERROR'
        })
        return of(undefined)
      })
    )
  }
}
