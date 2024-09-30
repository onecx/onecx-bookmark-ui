import { Injectable } from '@angular/core'
import { Location } from '@angular/common'
import { BookmarkScopeEnum, BookmarksInternal, Configuration, CreateBookmark, UpdateBookmark } from '../generated'
import { PortalMessageService } from '@onecx/angular-integration-interface'
import { catchError, map, of, tap } from 'rxjs'
import { environment } from 'src/environments/environment'

@Injectable({ providedIn: 'any' })
export class BookmarkAPIUtilsService {
  constructor(
    private bookmarkService: BookmarksInternal,
    private messageService: PortalMessageService
  ) {}

  overwriteBaseURL(baseUrl: string) {
    this.bookmarkService.configuration = new Configuration({
      basePath: Location.joinWithSlash(baseUrl, environment.apiPrefix)
    })
  }

  loadBookmarks(workspaceName: string) {
    return this.bookmarkService
      .searchBookmarksByCriteria({
        workspaceName: workspaceName,
        scope: BookmarkScopeEnum.Private
      })
      .pipe(map((res) => res.stream ?? []))
  }

  createNewBookmark(createBookmark: CreateBookmark) {
    return this.bookmarkService.createNewBookmark(createBookmark).pipe(
      tap(() => {
        this.messageService.success({
          summaryKey: 'BOOKMARKS_CREATE_UPDATE.CREATE.SUCCESS'
        })
      }),
      catchError(() => {
        this.messageService.error({
          summaryKey: 'BOOKMARKS_CREATE_UPDATE.CREATE.ERROR'
        })
        return of(undefined)
      })
    )
  }

  deleteBookmarkById(bookmarkId: string) {
    return this.bookmarkService.deleteBookmarkById(bookmarkId).pipe(
      tap(() => {
        this.messageService.success({
          summaryKey: 'BOOKMARKS_DELETE.SUCCESS'
        })
      }),
      catchError(() => {
        this.messageService.error({
          summaryKey: 'BOOKMARKS_DELETE.ERROR'
        })
        return of(undefined)
      })
    )
  }

  editBookmark(bookmarkId: string, updatedBookmark: UpdateBookmark) {
    return this.bookmarkService.updateBookmark(bookmarkId, updatedBookmark).pipe(
      tap(() => {
        this.messageService.success({
          summaryKey: 'BOOKMARKS_CREATE_UPDATE.UPDATE.SUCCESS'
        })
      }),
      catchError(() => {
        this.messageService.error({
          summaryKey: 'BOOKMARKS_CREATE_UPDATE.UPDATE.ERROR'
        })
        return of(undefined)
      })
    )
  }
}
