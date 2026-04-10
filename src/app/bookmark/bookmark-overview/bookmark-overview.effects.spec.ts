/* eslint-disable @typescript-eslint/no-var-requires */
import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { ReplaySubject, throwError, of } from 'rxjs'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { provideMockActions } from '@ngrx/effects/testing'

import { AppStateService, PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import { AppStateServiceMock, provideAppStateServiceMock } from '@onecx/angular-integration-interface/mocks'
import { PortalCoreModule } from '@onecx/portal-integration-angular'

import { BookmarksInternalAPIService } from 'src/app/shared/generated'
import { BookmarkOverviewActions } from './bookmark-overview.actions'
import { BookmarkOverviewEffects } from './bookmark-overview.effects'

describe('BookmarkOverviewEffects', () => {
  let actions$: ReplaySubject<any>
  let effects: BookmarkOverviewEffects
  let appStateMock: AppStateServiceMock
  let bookmarksServiceMock: jest.Mocked<Pick<BookmarksInternalAPIService, 'searchBookmarksByCriteria'>>
  let messageServiceMock: jest.Mocked<Pick<PortalMessageService, 'error'>>
  let routerMock: jest.Mocked<Pick<Router, 'navigate'>>
  let userServiceMock: jest.Mocked<Pick<UserService, 'hasPermission'>>

  beforeEach(async () => {
    actions$ = new ReplaySubject(1)
    bookmarksServiceMock = { searchBookmarksByCriteria: jest.fn() }
    messageServiceMock = { error: jest.fn() }
    routerMock = { navigate: jest.fn() }

    await TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([]),
        PortalCoreModule,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BookmarkOverviewEffects,
        AppStateService,
        provideAppStateServiceMock(),
        provideMockActions(() => actions$),
        { provide: BookmarksInternalAPIService, useValue: bookmarksServiceMock },
        { provide: PortalMessageService, useValue: messageServiceMock }
      ]
    })

    effects = TestBed.inject(BookmarkOverviewEffects)
    appStateMock = TestBed.inject(AppStateServiceMock)
    await appStateMock.currentWorkspace$.publish({ workspaceName: 'test-ws' } as any)

    userServiceMock = TestBed.inject(UserService) as unknown as jest.Mocked<Pick<UserService, 'hasPermission'>>
    userServiceMock.hasPermission = jest.fn().mockReturnValue(false)
    routerMock = { navigate: jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true) } as any
  })

  describe('search$', () => {
    it('should dispatch bookmarkSearchResultsReceived on success', (done) => {
      bookmarksServiceMock.searchBookmarksByCriteria.mockReturnValue(
        of({ stream: [{ id: '1', position: 0, scope: 'PRIVATE' as any, workspaceName: 'ws', displayName: 'B1' }], totalElements: 1 }) as any
      )

      actions$.next(BookmarkOverviewActions.search())

      effects.search$.subscribe((action) => {
        expect(action.type).toBe(BookmarkOverviewActions.bookmarkSearchResultsReceived.type)
        expect((action as any).results).toHaveLength(1)
        expect((action as any).totalNumberOfResults).toBe(1)
        done()
      })
    })

    it('should add scope Private to criteria when user lacks ADMIN_EDIT permission', (done) => {
      bookmarksServiceMock.searchBookmarksByCriteria.mockReturnValue(of({ stream: [], totalElements: 0 }) as any)

      actions$.next(BookmarkOverviewActions.search())

      effects.search$.subscribe(() => {
        expect(bookmarksServiceMock.searchBookmarksByCriteria).toHaveBeenCalledWith(
          expect.objectContaining({ bookmarkSearchCriteria: expect.objectContaining({ scope: 'PRIVATE' }) })
        )
        done()
      })
    })

    it('should not add scope to criteria when user has ADMIN_EDIT permission', (done) => {
      userServiceMock.hasPermission = jest.fn().mockReturnValue(true)
      bookmarksServiceMock.searchBookmarksByCriteria.mockReturnValue(of({ stream: [], totalElements: 0 }) as any)

      actions$.next(BookmarkOverviewActions.search())

      effects.search$.subscribe(() => {
        expect(bookmarksServiceMock.searchBookmarksByCriteria).toHaveBeenCalledWith(
          expect.objectContaining({
            bookmarkSearchCriteria: expect.not.objectContaining({ scope: expect.anything() })
          })
        )
        done()
      })
    })

    it('should sort results by position', (done) => {
      const unsorted = [
        { id: '2', position: 2, scope: 'PRIVATE' as any, workspaceName: 'ws', displayName: 'B2' },
        { id: '1', position: 1, scope: 'PRIVATE' as any, workspaceName: 'ws', displayName: 'B1' }
      ]
      bookmarksServiceMock.searchBookmarksByCriteria.mockReturnValue(of({ stream: unsorted, totalElements: 2 }) as any)

      actions$.next(BookmarkOverviewActions.search())

      effects.search$.subscribe((action) => {
        expect((action as any).results[0].id).toBe('1')
        expect((action as any).results[1].id).toBe('2')
        done()
      })
    })

    it('should handle null stream in results', (done) => {
      bookmarksServiceMock.searchBookmarksByCriteria.mockReturnValue(of({ stream: null, totalElements: null }) as any)

      actions$.next(BookmarkOverviewActions.search())

      effects.search$.subscribe((action) => {
        expect((action as any).results).toEqual([])
        expect((action as any).totalNumberOfResults).toBe(0)
        done()
      })
    })

    it('should dispatch bookmarkSearchFailed on error', (done) => {
      bookmarksServiceMock.searchBookmarksByCriteria.mockReturnValue(
        throwError(() => ({ status: '500', message: 'Internal server error' }))
      )

      actions$.next(BookmarkOverviewActions.search())

      effects.search$.subscribe((action) => {
        expect(action.type).toBe(BookmarkOverviewActions.bookmarkSearchFailed.type)
        expect((action as any).status).toBe('500')
        expect((action as any).exceptionKey).toContain('500')
        done()
      })
    })
  })

  describe('navigate$', () => {
    it('should call router.navigate with the given path relative to activated route', () => {
      const route = TestBed.inject(ActivatedRoute)

      actions$.next(BookmarkOverviewActions.navigate({ path: ['configure'] }))

      effects.navigate$.subscribe()

      expect(routerMock.navigate).toHaveBeenCalledWith(['configure'], { relativeTo: route }
      )
    })
  })

  describe('displayError$', () => {
    it('should call messageService.error when bookmarkSearchFailed is dispatched', () => {
      actions$.next(
        BookmarkOverviewActions.bookmarkSearchFailed({ status: '404', errorText: 'Not found', exceptionKey: 'EX_KEY' })
      )

      effects.displayError$.subscribe()

      expect(messageServiceMock.error).toHaveBeenCalledWith(
        expect.objectContaining({ summaryKey: 'BOOKMARK_EXPORT.ERROR' })
      )
    })

    it('should pass errorText as detailKey when it contains VALIDATION.ERRORS', () => {
      actions$.next(
        BookmarkOverviewActions.bookmarkSearchFailed({
          status: undefined,
          errorText: 'VALIDATION.ERRORS.some_error',
          exceptionKey: 'EX_KEY'
        })
      )

      effects.displayError$.subscribe()

      expect(messageServiceMock.error).toHaveBeenCalledWith(
        expect.objectContaining({ detailKey: 'VALIDATION.ERRORS.some_error' })
      )
    })

    it('should pass undefined as detailKey when status is absent and errorText is not a validation error', () => {
      actions$.next(
        BookmarkOverviewActions.bookmarkSearchFailed({
          status: undefined,
          errorText: 'some generic error',
          exceptionKey: 'EX_KEY'
        })
      )

      effects.displayError$.subscribe()

      expect(messageServiceMock.error).toHaveBeenCalledWith(
        expect.objectContaining({ detailKey: undefined })
      )
    })

    it('should pass undefined as detailKey when errorText is undefined', () => {
      actions$.next(
        BookmarkOverviewActions.bookmarkSearchFailed({
          status: undefined,
          errorText: undefined,
          exceptionKey: 'EX_KEY'
        })
      )

      effects.displayError$.subscribe()

      expect(messageServiceMock.error).toHaveBeenCalledWith(
        expect.objectContaining({ detailKey: undefined })
      )
    })

    it('should not call messageService.error for unrelated actions', () => {
      actions$.next(BookmarkOverviewActions.search())

      effects.displayError$.subscribe()

      expect(messageServiceMock.error).not.toHaveBeenCalled()
    })
  })
})
