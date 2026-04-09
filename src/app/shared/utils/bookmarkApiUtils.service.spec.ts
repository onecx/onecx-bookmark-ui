import { TestBed } from '@angular/core/testing'
import { of, ReplaySubject, Subject, throwError } from 'rxjs'

import { AppStateService, PortalMessageService } from '@onecx/angular-integration-interface'

import { BookmarksInternalAPIService } from '../generated'
import { BookmarkAPIUtilsService } from './bookmarkApiUtils.service'

describe('BookmarkAPIUtilsService', () => {
  let service: BookmarkAPIUtilsService
  let bookmarkServiceMock: jest.Mocked<BookmarksInternalAPIService>
  let messageServiceMock: jest.Mocked<PortalMessageService>
  let appStateServiceMock: { currentWorkspace$: Subject<any> }

  beforeEach(() => {
    bookmarkServiceMock = {
      configuration: {} as any,
      searchUserBookmarksByCriteria: jest.fn(),
      searchBookmarksByCriteria: jest.fn(),
      createNewBookmark: jest.fn(),
      deleteBookmarkById: jest.fn(),
      updateBookmark: jest.fn()
    } as unknown as jest.Mocked<BookmarksInternalAPIService>

    messageServiceMock = {
      success: jest.fn(),
      error: jest.fn()
    } as unknown as jest.Mocked<PortalMessageService>

    appStateServiceMock = { currentWorkspace$: new ReplaySubject(1) }

    TestBed.configureTestingModule({
      providers: [
        BookmarkAPIUtilsService,
        { provide: BookmarksInternalAPIService, useValue: bookmarkServiceMock },
        { provide: PortalMessageService, useValue: messageServiceMock },
        { provide: AppStateService, useValue: appStateServiceMock }
      ]
    })

    service = TestBed.inject(BookmarkAPIUtilsService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('overwriteBaseURL', () => {
    it('should set the configuration basePath to joined baseUrl and apiPrefix', () => {
      service.overwriteBaseURL('http://example.com')

      expect(bookmarkServiceMock.configuration.basePath).toBe('http://example.com/bff')
    })
  })

  describe('loadBookmarks', () => {
    it('should search bookmarks for the current workspace and return the stream', (done) => {
      bookmarkServiceMock.searchBookmarksByCriteria.mockReturnValue(
        of({
          stream: [{ id: '1', displayName: 'B1', workspaceName: 'ws', scope: 'PRIVATE' as any, position: 0 }]
        }) as any
      )

      service.loadBookmarks().subscribe((result) => {
        expect(bookmarkServiceMock.searchBookmarksByCriteria).toHaveBeenCalledWith({
          bookmarkSearchCriteria: { workspaceName: 'my-workspace' }
        })
        expect(result).toHaveLength(1)
        done()
      })

      appStateServiceMock.currentWorkspace$.next({ workspaceName: 'my-workspace' })
    })

    it('should return an empty array when stream is undefined', (done) => {
      bookmarkServiceMock.searchBookmarksByCriteria.mockReturnValue(of({ stream: undefined }) as any)

      service.loadBookmarks().subscribe((result) => {
        expect(result).toEqual([])
        done()
      })

      appStateServiceMock.currentWorkspace$.next({ workspaceName: 'ws' })
    })

    it('should call onError and return undefined when the API fails', (done) => {
      bookmarkServiceMock.searchBookmarksByCriteria.mockReturnValue(throwError(() => new Error('fail')))
      const onError = jest.fn()

      service.loadBookmarks(onError).subscribe((result) => {
        expect(onError).toHaveBeenCalled()
        expect(result).toBeUndefined()
        done()
      })

      appStateServiceMock.currentWorkspace$.next({ workspaceName: 'ws' })
    })

    it('should return undefined without calling onError when no onError is passed on failure', (done) => {
      bookmarkServiceMock.searchBookmarksByCriteria.mockReturnValue(throwError(() => new Error('fail')))

      service.loadBookmarks().subscribe((result) => {
        expect(result).toBeUndefined()
        done()
      })

      appStateServiceMock.currentWorkspace$.next({ workspaceName: 'ws' })
    })
  })

  describe('loadBookmarksForApp', () => {
    it('should search user bookmarks for the current workspace and mfe and return the stream', (done) => {
      bookmarkServiceMock.searchUserBookmarksByCriteria.mockReturnValue(
        of({
          stream: [{ id: '1', displayName: 'B1', workspaceName: 'ws', scope: 'PRIVATE' as any, position: 0 }]
        }) as any
      )
      const obs$ = of([{ workspaceName: 'ws' }, { productName: 'product', appId: 'app' }, undefined] as any)

      service.loadBookmarksForApp(obs$).subscribe((result) => {
        expect(bookmarkServiceMock.searchUserBookmarksByCriteria).toHaveBeenCalledWith({
          bookmarkSearchCriteria: { workspaceName: 'ws', productName: 'product', appId: 'app' }
        })
        expect(result).toHaveLength(1)
        done()
      })
    })

    it('should return an empty array when stream is undefined', (done) => {
      bookmarkServiceMock.searchUserBookmarksByCriteria.mockReturnValue(of({ stream: undefined }) as any)
      const obs$ = of([{ workspaceName: 'ws' }, { productName: 'p', appId: 'a' }, undefined] as any)

      service.loadBookmarksForApp(obs$).subscribe((result) => {
        expect(result).toEqual([])
        done()
      })
    })

    it('should call onError and return undefined when the API fails', (done) => {
      bookmarkServiceMock.searchUserBookmarksByCriteria.mockReturnValue(throwError(() => new Error('fail')))
      const onError = jest.fn()
      const obs$ = of([{ workspaceName: 'ws' }, { productName: 'p', appId: 'a' }, undefined] as any)

      service.loadBookmarksForApp(obs$, onError).subscribe((result) => {
        expect(onError).toHaveBeenCalled()
        expect(result).toBeUndefined()
        done()
      })
    })

    it('should return undefined without calling onError when no onError is passed on failure', (done) => {
      bookmarkServiceMock.searchUserBookmarksByCriteria.mockReturnValue(throwError(() => new Error('fail')))
      const obs$ = of([{ workspaceName: 'ws' }, { productName: 'p', appId: 'a' }, undefined] as any)

      service.loadBookmarksForApp(obs$).subscribe((result) => {
        expect(result).toBeUndefined()
        done()
      })
    })
  })

  describe('createNewBookmark', () => {
    const newBookmark = { displayName: 'New', workspaceName: 'ws', scope: 'PRIVATE' as any, position: 0 }

    it('should call the API and show a success message', (done) => {
      bookmarkServiceMock.createNewBookmark.mockReturnValue(of({ id: '1', ...newBookmark }) as any)

      service.createNewBookmark(newBookmark).subscribe(() => {
        expect(bookmarkServiceMock.createNewBookmark).toHaveBeenCalledWith({ createBookmark: newBookmark })
        expect(messageServiceMock.success).toHaveBeenCalledWith({ summaryKey: 'BOOKMARK_DETAIL.CREATE.SUCCESS' })
        done()
      })
    })

    it('should show an error message and return undefined when the API fails', (done) => {
      bookmarkServiceMock.createNewBookmark.mockReturnValue(throwError(() => new Error('fail')))

      service.createNewBookmark(newBookmark).subscribe((result) => {
        expect(messageServiceMock.error).toHaveBeenCalledWith({ summaryKey: 'BOOKMARK_DETAIL.CREATE.ERROR' })
        expect(result).toBeUndefined()
        done()
      })
    })
  })

  describe('deleteBookmarkById', () => {
    it('should call the API and show a success message', (done) => {
      bookmarkServiceMock.deleteBookmarkById.mockReturnValue(of(undefined as any))

      service.deleteBookmarkById('42').subscribe(() => {
        expect(bookmarkServiceMock.deleteBookmarkById).toHaveBeenCalledWith({ id: '42' })
        expect(messageServiceMock.success).toHaveBeenCalledWith({ summaryKey: 'BOOKMARK_DELETE.SUCCESS' })
        done()
      })
    })

    it('should show an error message and return undefined when the API fails', (done) => {
      bookmarkServiceMock.deleteBookmarkById.mockReturnValue(throwError(() => new Error('fail')))

      service.deleteBookmarkById('42').subscribe((result) => {
        expect(messageServiceMock.error).toHaveBeenCalledWith({ summaryKey: 'BOOKMARK_DELETE.ERROR' })
        expect(result).toBeUndefined()
        done()
      })
    })
  })

  describe('editBookmark', () => {
    const updateBookmark = {
      id: 'u1',
      modificationCount: 0,
      displayName: 'Updated',
      workspaceName: 'ws',
      scope: 'PRIVATE' as any,
      position: 0
    }

    it('should call the API and show a success message', (done) => {
      bookmarkServiceMock.updateBookmark.mockReturnValue(of({ ...updateBookmark }) as any)

      service.editBookmark('7', updateBookmark).subscribe(() => {
        expect(bookmarkServiceMock.updateBookmark).toHaveBeenCalledWith({ id: '7', updateBookmark })
        expect(messageServiceMock.success).toHaveBeenCalledWith({ summaryKey: 'BOOKMARK_DETAIL.EDIT.SUCCESS' })
        done()
      })
    })

    it('should show an error message and return undefined when the API fails', (done) => {
      bookmarkServiceMock.updateBookmark.mockReturnValue(throwError(() => new Error('fail')))

      service.editBookmark('7', updateBookmark).subscribe((result) => {
        expect(messageServiceMock.error).toHaveBeenCalledWith({ summaryKey: 'BOOKMARK_DETAIL.EDIT.ERROR' })
        expect(result).toBeUndefined()
        done()
      })
    })
  })
})
