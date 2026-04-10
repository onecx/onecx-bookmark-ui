/* eslint-disable @typescript-eslint/no-var-requires */
import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { BehaviorSubject, of, ReplaySubject, throwError } from 'rxjs'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { provideMockActions } from '@ngrx/effects/testing'
import { MockStore, provideMockStore } from '@ngrx/store/testing'

import { AppStateService, PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import { AppStateServiceMock, provideAppStateServiceMock } from '@onecx/angular-integration-interface/mocks'
import { PortalCoreModule, PortalDialogService } from '@onecx/portal-integration-angular'

import {
  Bookmark,
  BookmarkScope,
  BookmarksInternalAPIService,
  BookmarkExportImportAPIService,
  EximBookmarkScope,
  EximMode
} from 'src/app/shared/generated'
import { initialState as configureInitialState } from './bookmark-configure.reducers'
import { initialState as overviewInitialState } from '../bookmark-overview/bookmark-overview.reducers'
import { BookmarkConfigureActions } from './bookmark-configure.actions'
import { BookmarkConfigureEffects } from './bookmark-configure.effects'
import { bookmarkSearchSelectors, selectBookmarkConfigureViewModel } from './bookmark-configure.selectors'

jest.mock('file-saver', () => ({ __esModule: true, default: { saveAs: jest.fn() } }))

const makeBookmark = (id: string, position: number, scope = BookmarkScope.Private): Bookmark => ({
  id,
  displayName: `Bookmark ${id}`,
  position,
  workspaceName: 'test-ws',
  scope,
  modificationCount: 0
})

const bm1 = makeBookmark('bm-1', 2)
const bm2 = makeBookmark('bm-2', 1)
const bmPublic = makeBookmark('bm-pub', 1, BookmarkScope.Public)

describe('BookmarkConfigureEffects', () => {
  let actions$: ReplaySubject<any>
  let effects: BookmarkConfigureEffects
  let appStateMock: AppStateServiceMock
  let store: MockStore
  let portalDialogServiceMock: jest.Mocked<Pick<PortalDialogService, 'openDialog'>>
  let messageServiceMock: jest.Mocked<Pick<PortalMessageService, 'success' | 'error'>>
  let bookmarksServiceMock: jest.Mocked<
    Pick<
      BookmarksInternalAPIService,
      | 'searchBookmarksByCriteria'
      | 'createNewBookmark'
      | 'updateBookmark'
      | 'deleteBookmarkById'
      | 'updateBookmarksOrder'
    >
  >
  let eximServiceMock: jest.Mocked<Pick<BookmarkExportImportAPIService, 'exportBookmarks' | 'importBookmarks'>>
  let userServiceMock: { hasPermission: jest.Mock; profile$: any; lang$: BehaviorSubject<string> }
  let profileSubject: BehaviorSubject<any>

  beforeEach(async () => {
    actions$ = new ReplaySubject(1)
    profileSubject = new BehaviorSubject({ userId: 'user-1' })

    portalDialogServiceMock = { openDialog: jest.fn() }
    messageServiceMock = { success: jest.fn(), error: jest.fn() }
    bookmarksServiceMock = {
      searchBookmarksByCriteria: jest.fn(),
      createNewBookmark: jest.fn(),
      updateBookmark: jest.fn(),
      deleteBookmarkById: jest.fn(),
      updateBookmarksOrder: jest.fn()
    }
    eximServiceMock = { exportBookmarks: jest.fn(), importBookmarks: jest.fn() }
    userServiceMock = {
      hasPermission: jest.fn().mockReturnValue(false),
      profile$: { asObservable: () => profileSubject.asObservable() },
      lang$: new BehaviorSubject<string>('en')
    }

    await TestBed.configureTestingModule({
      imports: [
        PortalCoreModule,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BookmarkConfigureEffects,
        AppStateService,
        provideAppStateServiceMock(),
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: {
            bookmarks: {
              configure: configureInitialState,
              overview: overviewInitialState
            }
          }
        }),
        { provide: BookmarksInternalAPIService, useValue: bookmarksServiceMock },
        { provide: BookmarkExportImportAPIService, useValue: eximServiceMock },
        { provide: PortalDialogService, useValue: portalDialogServiceMock },
        { provide: PortalMessageService, useValue: messageServiceMock },
        { provide: UserService, useValue: userServiceMock }
      ]
    })

    effects = TestBed.inject(BookmarkConfigureEffects)
    appStateMock = TestBed.inject(AppStateServiceMock)
    await appStateMock.currentWorkspace$.publish({ workspaceName: 'test-ws' } as any)
    store = TestBed.inject(MockStore)
    store.overrideSelector(bookmarkSearchSelectors.selectResults, [bm1, bm2, bmPublic])
    store.overrideSelector(selectBookmarkConfigureViewModel, {
      columns: [],
      results: [bm1, bm2, bmPublic] as any,
      bookmarkFilter: '',
      scopeQuickFilter: 'PRIVATE',
      loading: false,
      exceptionKey: null
    })
    store.refreshState()
  })

  describe('search$', () => {
    it('should dispatch bookmarkSearchResultsReceived on success', (done) => {
      bookmarksServiceMock.searchBookmarksByCriteria.mockReturnValue(
        of({ stream: [bm1, bm2], totalElements: 2 }) as any
      )

      actions$.next(BookmarkConfigureActions.search())

      effects.search$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.bookmarkSearchResultsReceived.type)
        expect((action as any).totalNumberOfResults).toBe(2)
        done()
      })
    })

    it('should sort results by position ascending', (done) => {
      bookmarksServiceMock.searchBookmarksByCriteria.mockReturnValue(
        of({ stream: [bm1, bm2], totalElements: 2 }) as any
      )

      actions$.next(BookmarkConfigureActions.search())

      effects.search$.subscribe((action) => {
        expect((action as any).results[0].id).toBe('bm-2')
        expect((action as any).results[1].id).toBe('bm-1')
        done()
      })
    })

    it('should add scope Private to criteria when user lacks ADMIN_EDIT permission', (done) => {
      bookmarksServiceMock.searchBookmarksByCriteria.mockReturnValue(of({ stream: [], totalElements: 0 }) as any)

      actions$.next(BookmarkConfigureActions.search())

      effects.search$.subscribe(() => {
        expect(bookmarksServiceMock.searchBookmarksByCriteria).toHaveBeenCalledWith(
          expect.objectContaining({ bookmarkSearchCriteria: expect.objectContaining({ scope: BookmarkScope.Private }) })
        )
        done()
      })
    })

    it('should not add scope to criteria when user has ADMIN_EDIT permission', (done) => {
      userServiceMock.hasPermission.mockReturnValue(true)
      bookmarksServiceMock.searchBookmarksByCriteria.mockReturnValue(of({ stream: [], totalElements: 0 }) as any)

      actions$.next(BookmarkConfigureActions.search())

      effects.search$.subscribe(() => {
        expect(bookmarksServiceMock.searchBookmarksByCriteria).toHaveBeenCalledWith(
          expect.objectContaining({
            bookmarkSearchCriteria: expect.not.objectContaining({ scope: expect.anything() })
          })
        )
        done()
      })
    })

    it('should handle null stream and totalElements', (done) => {
      bookmarksServiceMock.searchBookmarksByCriteria.mockReturnValue(of({ stream: null, totalElements: null }) as any)

      actions$.next(BookmarkConfigureActions.search())

      effects.search$.subscribe((action) => {
        expect((action as any).results).toEqual([])
        expect((action as any).totalNumberOfResults).toBe(0)
        done()
      })
    })

    it('should dispatch bookmarkSearchFailed on error', (done) => {
      bookmarksServiceMock.searchBookmarksByCriteria.mockReturnValue(
        throwError(() => ({ status: '500', message: 'Server error' }))
      )

      actions$.next(BookmarkConfigureActions.search())

      effects.search$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.bookmarkSearchFailed.type)
        expect((action as any).status).toBe('500')
        expect((action as any).exceptionKey).toContain('500')
        done()
      })
    })
  })

  describe('refreshSearch$', () => {
    it('should trigger another search when createBookmarkSucceeded is dispatched', (done) => {
      bookmarksServiceMock.searchBookmarksByCriteria.mockReturnValue(of({ stream: [], totalElements: 0 }) as any)

      actions$.next(BookmarkConfigureActions.createBookmarkSucceeded())

      effects.refreshSearch$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.bookmarkSearchResultsReceived.type)
        done()
      })
    })

    it('should trigger another search when sortBookmarksSucceeded is dispatched', (done) => {
      bookmarksServiceMock.searchBookmarksByCriteria.mockReturnValue(of({ stream: [], totalElements: 0 }) as any)

      actions$.next(BookmarkConfigureActions.sortBookmarksSucceeded())

      effects.refreshSearch$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.bookmarkSearchResultsReceived.type)
        done()
      })
    })
  })

  describe('exportBookmarks$', () => {
    it('should cancel when there are no bookmarks to export', (done) => {
      store.overrideSelector(bookmarkSearchSelectors.selectResults, [])
      store.refreshState()

      actions$.next(BookmarkConfigureActions.exportBookmarks())

      effects.exportBookmarks$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.exportBookmarksCancelled.type)
        done()
      })
    })

    it('should export private only when user has no ADMIN_EDIT permission', (done) => {
      eximServiceMock.exportBookmarks.mockReturnValue(of({ bookmarks: [] }) as any)

      actions$.next(BookmarkConfigureActions.exportBookmarks())

      effects.exportBookmarks$.subscribe((action) => {
        expect(eximServiceMock.exportBookmarks).toHaveBeenCalledWith(
          expect.objectContaining({
            exportBookmarksRequest: expect.objectContaining({ scopes: [EximBookmarkScope.Private] })
          })
        )
        expect(action.type).toBe(BookmarkConfigureActions.exportBookmarksSucceeded.type)
        done()
      })
    })

    it('should open export dialog for admin users and cancel on secondary', (done) => {
      userServiceMock.hasPermission.mockReturnValue(true)
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'secondary', result: undefined }) as any)

      actions$.next(BookmarkConfigureActions.exportBookmarks())

      effects.exportBookmarks$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.exportBookmarksCancelled.type)
        done()
      })
    })

    it('should dispatch exportBookmarksFailed when scopes are empty', (done) => {
      userServiceMock.hasPermission.mockReturnValue(true)
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(
        of({ button: 'primary', result: { workspaceName: 'test-ws', scopes: [] } }) as any
      )

      actions$.next(BookmarkConfigureActions.exportBookmarks())

      effects.exportBookmarks$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.exportBookmarksFailed.type)
        done()
      })
    })

    it('should export bookmarks and dispatch success for admin selecting scopes', (done) => {
      userServiceMock.hasPermission.mockReturnValue(true)
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(
        of({
          button: 'primary',
          result: { workspaceName: 'test-ws', scopes: [EximBookmarkScope.Private, EximBookmarkScope.Public] }
        }) as any
      )
      eximServiceMock.exportBookmarks.mockReturnValue(of({ bookmarks: [] }) as any)

      actions$.next(BookmarkConfigureActions.exportBookmarks())

      effects.exportBookmarks$.subscribe((action) => {
        expect(messageServiceMock.success).toHaveBeenCalled()
        expect(action.type).toBe(BookmarkConfigureActions.exportBookmarksSucceeded.type)
        done()
      })
    })

    it('should dispatch exportBookmarksFailed on api error', (done) => {
      eximServiceMock.exportBookmarks.mockReturnValue(throwError(() => ({ status: '500', message: 'Error' })))

      actions$.next(BookmarkConfigureActions.exportBookmarks())

      effects.exportBookmarks$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.exportBookmarksFailed.type)
        done()
      })
    })
  })

  describe('importBookmarks$', () => {
    it('should cancel import when dialog is dismissed', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'secondary', result: undefined }) as any)

      actions$.next(BookmarkConfigureActions.importBookmarks())

      effects.importBookmarks$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.importBookmarksCancelled.type)
        done()
      })
    })

    it('should dispatch importBookmarksFailed when snapshot is missing', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(
        of({
          button: 'primary',
          result: { workspaceName: 'test-ws', scopes: [], snapshot: undefined, importMode: EximMode.Overwrite }
        }) as any
      )

      actions$.next(BookmarkConfigureActions.importBookmarks())

      effects.importBookmarks$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.importBookmarksFailed.type)
        done()
      })
    })

    it('should import bookmarks and dispatch success', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(
        of({
          button: 'primary',
          result: {
            workspaceName: 'test-ws',
            scopes: [EximBookmarkScope.Private],
            snapshot: { bookmarks: [] },
            importMode: EximMode.Overwrite
          }
        }) as any
      )
      eximServiceMock.importBookmarks.mockReturnValue(of(undefined) as any)

      actions$.next(BookmarkConfigureActions.importBookmarks())

      effects.importBookmarks$.subscribe((action) => {
        expect(messageServiceMock.success).toHaveBeenCalled()
        expect(action.type).toBe(BookmarkConfigureActions.importBookmarksSucceeded.type)
        done()
      })
    })

    it('should pass de date format when user language is de', (done) => {
      userServiceMock.lang$.next('de')
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'secondary', result: undefined }) as any)

      actions$.next(BookmarkConfigureActions.importBookmarks())

      effects.importBookmarks$.subscribe(() => {
        // eslint-disable-next-line deprecation/deprecation
        expect(portalDialogServiceMock.openDialog).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ inputs: expect.objectContaining({ dateFormat: 'dd.MM.yyyy HH:mm:ss' }) }),
          expect.anything(),
          expect.anything(),
          expect.anything()
        )
        done()
      })
    })

    it('should dispatch importBookmarksFailed on api error', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(
        of({
          button: 'primary',
          result: {
            workspaceName: 'test-ws',
            scopes: [EximBookmarkScope.Private],
            snapshot: { bookmarks: [] },
            importMode: EximMode.Overwrite
          }
        }) as any
      )
      eximServiceMock.importBookmarks.mockReturnValue(throwError(() => ({ status: '500', message: 'Error' })))

      actions$.next(BookmarkConfigureActions.importBookmarks())

      effects.importBookmarks$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.importBookmarksFailed.type)
        done()
      })
    })
  })

  describe('openSortingDialog$', () => {
    it('should cancel when dialog is dismissed', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'secondary', result: undefined }) as any)

      actions$.next(BookmarkConfigureActions.openSortingDialog())

      effects.openSortingDialog$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.sortBookmarksCancelled.type)
        done()
      })
    })

    it('should dispatch sortBookmarksFailed when result is empty', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'primary', result: [] }) as any)

      actions$.next(BookmarkConfigureActions.openSortingDialog())

      effects.openSortingDialog$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.sortBookmarksFailed.type)
        done()
      })
    })

    it('should update bookmarks order and dispatch success', (done) => {
      const sortedBookmarks = [{ id: 'bm-1', position: 1, displayName: 'B1', modificationCount: 0 }]
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'primary', result: sortedBookmarks }) as any)
      bookmarksServiceMock.updateBookmarksOrder.mockReturnValue(of(undefined) as any)

      actions$.next(BookmarkConfigureActions.openSortingDialog())

      effects.openSortingDialog$.subscribe((action) => {
        expect(messageServiceMock.success).toHaveBeenCalled()
        expect(action.type).toBe(BookmarkConfigureActions.sortBookmarksSucceeded.type)
        done()
      })
    })

    it('should dispatch sortBookmarksFailed on api error', (done) => {
      const sortedBookmarks = [{ id: 'bm-1', position: 1, displayName: 'B1', modificationCount: 0 }]
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'primary', result: sortedBookmarks }) as any)
      bookmarksServiceMock.updateBookmarksOrder.mockReturnValue(throwError(() => ({ status: '500', message: 'Error' })))

      actions$.next(BookmarkConfigureActions.openSortingDialog())

      effects.openSortingDialog$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.sortBookmarksFailed.type)
        done()
      })
    })
  })

  describe('toggleBookmark$', () => {
    it('should dispatch editBookmarkFailed when bookmark is not found', (done) => {
      actions$.next(BookmarkConfigureActions.toggleBookmark({ id: 'non-existent' }))

      effects.toggleBookmark$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.editBookmarkFailed.type)
        expect((action as any).errorText).toBe('Missing Bookmark')
        done()
      })
    })

    it('should toggle disabled and dispatch editBookmarkSucceeded', (done) => {
      bookmarksServiceMock.updateBookmark.mockReturnValue(of(undefined) as any)

      actions$.next(BookmarkConfigureActions.toggleBookmark({ id: 'bm-1' }))

      effects.toggleBookmark$.subscribe((action) => {
        expect(bookmarksServiceMock.updateBookmark).toHaveBeenCalledWith(expect.objectContaining({ id: 'bm-1' }))
        expect(messageServiceMock.success).toHaveBeenCalled()
        expect(action.type).toBe(BookmarkConfigureActions.editBookmarkSucceeded.type)
        done()
      })
    })

    it('should dispatch editBookmarkFailed on api error', (done) => {
      bookmarksServiceMock.updateBookmark.mockReturnValue(throwError(() => ({ status: '500', message: 'Error' })))

      actions$.next(BookmarkConfigureActions.toggleBookmark({ id: 'bm-1' }))

      effects.toggleBookmark$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.editBookmarkFailed.type)
        done()
      })
    })
  })

  describe('viewOrEditBookmark$', () => {
    it('should cancel when secondary button clicked and bookmark is editable', (done) => {
      userServiceMock.hasPermission.mockImplementation((perm: string) => perm === 'BOOKMARK#EDIT')
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'secondary', result: bm1 }) as any)

      actions$.next(BookmarkConfigureActions.viewOrEditBookmark({ id: 'bm-1' }))

      effects.viewOrEditBookmark$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.editBookmarkCancelled.type)
        done()
      })
    })

    it('should cancel when primary button clicked and bookmark is not editable (view mode)', (done) => {
      userServiceMock.hasPermission.mockReturnValue(false)
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'primary', result: bm1 }) as any)

      actions$.next(BookmarkConfigureActions.viewOrEditBookmark({ id: 'bm-1' }))

      effects.viewOrEditBookmark$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.editBookmarkCancelled.type)
        done()
      })
    })

    it('should dispatch editBookmarkFailed when result is missing', (done) => {
      // secondary + canEdit=false → does NOT cancel via secondary path, then throws on missing result
      userServiceMock.hasPermission.mockReturnValue(false)
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'secondary', result: undefined }) as any)

      actions$.next(BookmarkConfigureActions.viewOrEditBookmark({ id: 'bm-1' }))

      effects.viewOrEditBookmark$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.editBookmarkFailed.type)
        done()
      })
    })

    it('should update bookmark and dispatch editBookmarkSucceeded', (done) => {
      userServiceMock.hasPermission.mockImplementation((perm: string) => perm === 'BOOKMARK#EDIT')
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'primary', result: { ...bm1 } }) as any)
      bookmarksServiceMock.updateBookmark.mockReturnValue(of(undefined) as any)

      actions$.next(BookmarkConfigureActions.viewOrEditBookmark({ id: 'bm-1' }))

      effects.viewOrEditBookmark$.subscribe((action) => {
        expect(messageServiceMock.success).toHaveBeenCalled()
        expect(action.type).toBe(BookmarkConfigureActions.editBookmarkSucceeded.type)
        done()
      })
    })

    it('should dispatch editBookmarkFailed on api error', (done) => {
      userServiceMock.hasPermission.mockImplementation((perm: string) => perm === 'BOOKMARK#EDIT')
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'primary', result: { ...bm1 } }) as any)
      bookmarksServiceMock.updateBookmark.mockReturnValue(throwError(() => ({ status: '500', message: 'Error' })))

      actions$.next(BookmarkConfigureActions.viewOrEditBookmark({ id: 'bm-1' }))

      effects.viewOrEditBookmark$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.editBookmarkFailed.type)
        done()
      })
    })
  })

  describe('createBookmark$', () => {
    it('should cancel when dialog is dismissed', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'secondary', result: undefined }) as any)

      actions$.next(BookmarkConfigureActions.createBookmark())

      effects.createBookmark$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.createBookmarkCancelled.type)
        done()
      })
    })

    it('should dispatch createBookmarkFailed when result is missing', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as any)

      actions$.next(BookmarkConfigureActions.createBookmark())

      effects.createBookmark$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.createBookmarkFailed.type)
        done()
      })
    })

    it('should create bookmark and dispatch createBookmarkSucceeded', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(
        of({ button: 'primary', result: { displayName: 'New', scope: BookmarkScope.Private } }) as any
      )
      bookmarksServiceMock.createNewBookmark.mockReturnValue(of(undefined) as any)

      actions$.next(BookmarkConfigureActions.createBookmark())

      effects.createBookmark$.subscribe((action) => {
        expect(messageServiceMock.success).toHaveBeenCalled()
        expect(action.type).toBe(BookmarkConfigureActions.createBookmarkSucceeded.type)
        done()
      })
    })

    it('should dispatch createBookmarkFailed on api error', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(
        of({ button: 'primary', result: { displayName: 'New', scope: BookmarkScope.Private } }) as any
      )
      bookmarksServiceMock.createNewBookmark.mockReturnValue(throwError(() => ({ status: '500', message: 'Error' })))

      actions$.next(BookmarkConfigureActions.createBookmark())

      effects.createBookmark$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.createBookmarkFailed.type)
        done()
      })
    })
  })

  describe('copyBookmark$', () => {
    it('should cancel when dialog is dismissed', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'secondary', result: undefined }) as any)

      actions$.next(BookmarkConfigureActions.copyBookmark({ id: 'bm-1' }))

      effects.copyBookmark$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.createBookmarkCancelled.type)
        done()
      })
    })

    it('should dispatch createBookmarkFailed when result is missing', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as any)

      actions$.next(BookmarkConfigureActions.copyBookmark({ id: 'bm-1' }))

      effects.copyBookmark$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.createBookmarkFailed.type)
        done()
      })
    })

    it('should create a copy and dispatch createBookmarkSucceeded', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(
        of({ button: 'primary', result: { displayName: 'Copy', scope: BookmarkScope.Private } }) as any
      )
      bookmarksServiceMock.createNewBookmark.mockReturnValue(of(undefined) as any)

      actions$.next(BookmarkConfigureActions.copyBookmark({ id: 'bm-1' }))

      effects.copyBookmark$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.createBookmarkSucceeded.type)
        done()
      })
    })
  })

  describe('deleteBookmark$', () => {
    it('should cancel when dialog is dismissed', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'secondary', result: undefined }) as any)

      actions$.next(BookmarkConfigureActions.openDeleteDialog({ id: 'bm-1' }))

      effects.deleteBookmark$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.deleteBookmarkCancelled.type)
        done()
      })
    })

    it('should dispatch deleteBookmarkFailed when item to delete not found', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as any)

      actions$.next(BookmarkConfigureActions.openDeleteDialog({ id: 'non-existent' }))

      effects.deleteBookmark$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.deleteBookmarkFailed.type)
        done()
      })
    })

    it('should delete bookmark and dispatch deleteBookmarkSucceeded', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as any)
      bookmarksServiceMock.deleteBookmarkById.mockReturnValue(of(undefined) as any)

      actions$.next(BookmarkConfigureActions.openDeleteDialog({ id: 'bm-1' }))

      effects.deleteBookmark$.subscribe((action) => {
        expect(bookmarksServiceMock.deleteBookmarkById).toHaveBeenCalledWith({ id: 'bm-1' })
        expect(messageServiceMock.success).toHaveBeenCalled()
        expect(action.type).toBe(BookmarkConfigureActions.deleteBookmarkSucceeded.type)
        done()
      })
    })

    it('should dispatch deleteBookmarkFailed on api error', (done) => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as any)
      bookmarksServiceMock.deleteBookmarkById.mockReturnValue(
        throwError(() => ({ status: '404', message: 'Not found' }))
      )

      actions$.next(BookmarkConfigureActions.openDeleteDialog({ id: 'bm-1' }))

      effects.deleteBookmark$.subscribe((action) => {
        expect(action.type).toBe(BookmarkConfigureActions.deleteBookmarkFailed.type)
        done()
      })
    })
  })

  describe('displayError$', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('should call messageService.error when exportBookmarksFailed is dispatched', () => {
      actions$.next(BookmarkConfigureActions.exportBookmarksFailed({ status: '500', errorText: 'Error' }))

      effects.displayError$.subscribe()

      expect(messageServiceMock.error).toHaveBeenCalledWith(
        expect.objectContaining({ summaryKey: 'BOOKMARK_EXPORT.ERROR' })
      )
    })

    it('should use buildExceptionKey as detailKey when status is present', () => {
      actions$.next(BookmarkConfigureActions.deleteBookmarkFailed({ status: '403', errorText: 'Forbidden' }))

      effects.displayError$.subscribe()

      expect(messageServiceMock.error).toHaveBeenCalledWith(
        expect.objectContaining({ detailKey: expect.stringContaining('403') })
      )
    })

    it('should use errorText as detailKey when it contains VALIDATION.ERRORS and status is absent', () => {
      actions$.next(
        BookmarkConfigureActions.createBookmarkFailed({
          status: undefined,
          errorText: 'VALIDATION.ERRORS.RESULT_WRONG'
        })
      )

      effects.displayError$.subscribe()

      expect(messageServiceMock.error).toHaveBeenCalledWith(
        expect.objectContaining({ detailKey: 'VALIDATION.ERRORS.RESULT_WRONG' })
      )
    })

    it('should use undefined as detailKey when status is absent and errorText is not a validation error', () => {
      actions$.next(BookmarkConfigureActions.editBookmarkFailed({ status: undefined, errorText: 'generic error' }))

      effects.displayError$.subscribe()

      expect(messageServiceMock.error).toHaveBeenCalledWith(expect.objectContaining({ detailKey: undefined }))
    })

    it('should not call messageService.error for non-error actions', () => {
      actions$.next(BookmarkConfigureActions.search())

      effects.displayError$.subscribe()

      expect(messageServiceMock.error).not.toHaveBeenCalled()
    })
  })
})
