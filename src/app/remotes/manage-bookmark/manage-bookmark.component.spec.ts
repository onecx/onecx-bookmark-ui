import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { BehaviorSubject, of, ReplaySubject } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { PortalCoreModule, PortalDialogService } from '@onecx/portal-integration-angular'
import { BASE_URL, RemoteComponentConfig, SLOT_SERVICE, SlotService } from '@onecx/angular-remote-components'
import {
  AppConfigService,
  AppStateService,
  PortalMessageService,
  UserService
} from '@onecx/angular-integration-interface'

import { BookmarkScope } from 'src/app/shared/generated'
import { BookmarkAPIUtilsService } from 'src/app/shared/utils/bookmarkApiUtils.service'
import { OneCXManageBookmarkComponent, slotInitializer } from './manage-bookmark.component'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})

describe('OneCXManageBookmarkComponent', () => {
  let component: OneCXManageBookmarkComponent
  let fixture: ComponentFixture<OneCXManageBookmarkComponent>

  let baseUrlSubject: ReplaySubject<string>
  let bookmarkApiUtilsMock: jest.Mocked<
    Pick<
      BookmarkAPIUtilsService,
      'overwriteBaseURL' | 'loadBookmarksForApp' | 'createNewBookmark' | 'editBookmark' | 'deleteBookmarkById'
    >
  >
  let appConfigServiceMock: jest.Mocked<Pick<AppConfigService, 'init'>>
  let appStateServiceMock: {
    currentWorkspace$: BehaviorSubject<any>
    currentMfe$: BehaviorSubject<any>
    currentPage$: BehaviorSubject<any>
  }
  let userServiceMock: { lang$: BehaviorSubject<string> }
  let portalDialogServiceMock: jest.Mocked<Pick<PortalDialogService, 'openDialog'>>

  const currentWorkspace = { workspaceName: 'ws', endpoints: [] }
  const currentMfe = { productName: 'product', appId: 'app', baseHref: '/app' }
  const currentPage = { path: '/app/page' }

  const remoteComponentConfig: RemoteComponentConfig = {
    baseUrl: 'http://test-base-url',
    permissions: ['BOOKMARK#VIEW', 'BOOKMARK#CREATE'],
    appId: 'app',
    productName: 'product'
  }

  beforeEach(async () => {
    baseUrlSubject = new ReplaySubject<string>(1)
    bookmarkApiUtilsMock = {
      overwriteBaseURL: jest.fn(),
      loadBookmarksForApp: jest.fn().mockReturnValue(of([])),
      createNewBookmark: jest.fn().mockReturnValue(of(undefined)),
      editBookmark: jest.fn().mockReturnValue(of(undefined)),
      deleteBookmarkById: jest.fn().mockReturnValue(of(undefined))
    }
    appConfigServiceMock = { init: jest.fn().mockReturnValue(of(undefined)) }
    appStateServiceMock = {
      currentWorkspace$: new BehaviorSubject(currentWorkspace),
      currentMfe$: new BehaviorSubject(currentMfe),
      currentPage$: new BehaviorSubject(currentPage)
    }
    userServiceMock = { lang$: new BehaviorSubject<string>('en') }
    portalDialogServiceMock = { openDialog: jest.fn().mockReturnValue(of(undefined)) }

    await TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
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
        { provide: UserService, useValue: userServiceMock },
        { provide: AppStateService, useValue: appStateServiceMock }
      ]
    })
      .overrideComponent(OneCXManageBookmarkComponent, {
        set: {
          providers: [
            { provide: BASE_URL, useValue: baseUrlSubject },
            { provide: BookmarkAPIUtilsService, useValue: bookmarkApiUtilsMock },
            { provide: AppConfigService, useValue: appConfigServiceMock },
            { provide: PortalDialogService, useValue: portalDialogServiceMock },
            { provide: PortalMessageService, useValue: { success: jest.fn(), error: jest.fn() } },
            { provide: SLOT_SERVICE, useValue: { init: jest.fn().mockReturnValue(Promise.resolve()) } }
          ]
        }
      })
      .compileComponents()
  })

  function initializeComponent() {
    fixture = TestBed.createComponent(OneCXManageBookmarkComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  it('should create', () => {
    initializeComponent()

    expect(component).toBeTruthy()
  })

  it('should initialize with no error and empty permissions', () => {
    initializeComponent()

    expect(component.bookmarkLoadingError).toBe(false)
    expect(component.permissions).toEqual([])
  })

  describe('slotInitializer', () => {
    it('should call SlotService.init', () => {
      const slotService = { init: jest.fn().mockReturnValue(Promise.resolve()) } as unknown as jest.Mocked<SlotService>
      const initializer = slotInitializer(slotService)
      initializer()

      expect(slotService.init).toHaveBeenCalled()
    })
  })

  describe('translateService', () => {
    it('should call translateService.use with the current language', () => {
      const translateService = TestBed.inject(TranslateService)
      jest.spyOn(translateService, 'use')

      initializeComponent()

      expect(translateService.use).toHaveBeenCalledWith('en')
    })
  })

  describe('ocxInitRemoteComponent', () => {
    it('should emit the base URL to the subject', () => {
      initializeComponent()
      let emittedUrl: string | undefined
      baseUrlSubject.subscribe((url) => (emittedUrl = url))

      component.ocxInitRemoteComponent(remoteComponentConfig)

      expect(emittedUrl).toBe('http://test-base-url')
    })

    it('should set permissions from config', () => {
      initializeComponent()

      component.ocxInitRemoteComponent(remoteComponentConfig)

      expect(component.permissions).toEqual(['BOOKMARK#VIEW', 'BOOKMARK#CREATE'])
    })

    it('should call overwriteBaseURL with the config baseUrl', () => {
      initializeComponent()

      component.ocxInitRemoteComponent(remoteComponentConfig)

      expect(bookmarkApiUtilsMock.overwriteBaseURL).toHaveBeenCalledWith('http://test-base-url')
    })

    it('should call appConfigService.init with the config baseUrl', () => {
      initializeComponent()

      component.ocxInitRemoteComponent(remoteComponentConfig)

      expect(appConfigServiceMock.init).toHaveBeenCalledWith('http://test-base-url')
    })

    it('should update bookmarks$ with the result of loadBookmarksForApp', () => {
      const bookmarks = [{ id: '1', displayName: 'B1', workspaceName: 'ws', scope: BookmarkScope.Private, position: 0 }]
      bookmarkApiUtilsMock.loadBookmarksForApp.mockReturnValue(of(bookmarks))
      initializeComponent()

      component.ocxInitRemoteComponent(remoteComponentConfig)

      expect(component.bookmarks$.getValue()).toEqual(bookmarks)
    })

    it('should set bookmarkLoadingError to true when handleBookmarkLoadError is called', () => {
      initializeComponent()

      component['handleBookmarkLoadError']()

      expect(component.bookmarkLoadingError).toBe(true)
    })
  })

  describe('ocxRemoteComponentConfig setter', () => {
    it('should delegate to ocxInitRemoteComponent', () => {
      initializeComponent()
      const initSpy = jest.spyOn(component, 'ocxInitRemoteComponent')

      component.ocxRemoteComponentConfig = remoteComponentConfig

      expect(initSpy).toHaveBeenCalledWith(remoteComponentConfig)
    })
  })

  describe('isBookmarkable$', () => {
    it('should emit false when currentPage is undefined', (done) => {
      appStateServiceMock.currentPage$.next(undefined)
      initializeComponent()

      component.isBookmarkable$.subscribe((val) => {
        expect(val).toBe(false)
        done()
      })
    })

    it('should emit true when page path matches baseHref root', (done) => {
      appStateServiceMock.currentPage$.next({ path: '/app' })
      initializeComponent()

      component.isBookmarkable$.subscribe((val) => {
        expect(val).toBe(true)
        done()
      })
    })

    it('should emit false when isPageBookmarkable throws an error', (done) => {
      appStateServiceMock.currentWorkspace$.error(new Error('workspace error'))
      initializeComponent()

      component.isBookmarkable$.subscribe((val) => {
        expect(val).toBe(false)
        done()
      })
    })
  })

  describe('isBookmarked$', () => {
    it('should emit false when bookmarks$ is undefined', (done) => {
      initializeComponent()
      component.bookmarks$.next(undefined)

      component.isBookmarked$.subscribe((val) => {
        expect(val).toBe(false)
        done()
      })
    })

    it('should emit true when a matching bookmark exists', (done) => {
      const bookmark = {
        id: '1',
        displayName: 'B1',
        workspaceName: 'ws',
        scope: BookmarkScope.Private,
        position: 0,
        productName: 'product',
        appId: 'app'
      }
      appStateServiceMock.currentPage$.next({ path: '/app' })
      initializeComponent()
      component.bookmarks$.next([bookmark])

      component.isBookmarked$.subscribe((val) => {
        expect(val).toBe(true)
        done()
      })
    })

    it('should emit false when commonObs$ throws an error', (done) => {
      appStateServiceMock.currentWorkspace$.error(new Error('error'))
      initializeComponent()

      component.isBookmarked$.subscribe((val) => {
        expect(val).toBe(false)
        done()
      })
    })
  })

  describe('currentBookmark$', () => {
    it('should emit undefined when bookmarks$ is undefined', (done) => {
      initializeComponent()
      component.bookmarks$.next(undefined)

      component.currentBookmark$.subscribe((val) => {
        expect(val).toBeUndefined()
        done()
      })
    })

    it('should emit matching bookmark when found', (done) => {
      const bookmark = {
        id: '1',
        displayName: 'B1',
        workspaceName: 'ws',
        scope: BookmarkScope.Private,
        position: 0,
        productName: 'product',
        appId: 'app'
      }
      appStateServiceMock.currentPage$.next({ path: '/app' })
      initializeComponent()
      component.bookmarks$.next([bookmark])

      component.currentBookmark$.subscribe((val) => {
        expect(val).toEqual(bookmark)
        done()
      })
    })

    it('should emit undefined when commonObs$ throws an error', (done) => {
      appStateServiceMock.currentWorkspace$.error(new Error('error'))
      initializeComponent()

      component.currentBookmark$.subscribe((val) => {
        expect(val).toBeUndefined()
        done()
      })
    })
  })

  describe('endpointForCurrentPage$', () => {
    it('should emit undefined when currentPage is undefined', (done) => {
      appStateServiceMock.currentPage$.next(undefined)
      initializeComponent()

      component.endpointForCurrentPage$.subscribe((val) => {
        expect(val).toBeUndefined()
        done()
      })
    })

    it('should emit undefined when no matching endpoint exists', (done) => {
      appStateServiceMock.currentPage$.next({ path: '/app/unknown-path' })
      initializeComponent()

      component.endpointForCurrentPage$.subscribe((val) => {
        expect(val).toBeUndefined()
        done()
      })
    })

    it('should emit undefined when commonObs$ throws an error', (done) => {
      appStateServiceMock.currentWorkspace$.error(new Error('error'))
      initializeComponent()

      component.endpointForCurrentPage$.subscribe((val) => {
        expect(val).toBeUndefined()
        done()
      })
    })
  })

  describe('onOpenBookmarkDialog', () => {
    it('should open a dialog when called', () => {
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of(undefined) as any)
      bookmarkApiUtilsMock.loadBookmarksForApp.mockReturnValue(of([]))
      initializeComponent()
      component.ocxInitRemoteComponent(remoteComponentConfig)

      component.onOpenBookmarkDialog()

      // eslint-disable-next-line deprecation/deprecation
      expect(portalDialogServiceMock.openDialog).toHaveBeenCalled()
    })

    it('should do nothing when page is not bookmarkable and dialog returns null', () => {
      appStateServiceMock.currentPage$.next({ path: '/unrelated' })
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of(null) as any)
      initializeComponent()
      component.ocxInitRemoteComponent(remoteComponentConfig)

      component.onOpenBookmarkDialog()

      expect(bookmarkApiUtilsMock.createNewBookmark).not.toHaveBeenCalled()
    })

    it('should do nothing when page is not bookmarkable and primary button is clicked', () => {
      appStateServiceMock.currentPage$.next({ path: '/unrelated' })
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as any)
      initializeComponent()
      component.ocxInitRemoteComponent(remoteComponentConfig)

      component.onOpenBookmarkDialog()

      expect(bookmarkApiUtilsMock.createNewBookmark).not.toHaveBeenCalled()
    })

    it('should cancel create when secondary button clicked and page is bookmarkable but not bookmarked', () => {
      appStateServiceMock.currentPage$.next({ path: '/app' })
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'secondary', result: undefined }) as any)
      initializeComponent()
      component.ocxInitRemoteComponent(remoteComponentConfig)

      component.onOpenBookmarkDialog()

      expect(bookmarkApiUtilsMock.createNewBookmark).not.toHaveBeenCalled()
    })

    it('should reload bookmarks after a successful create dialog result', () => {
      const bookmark = { id: '1', displayName: 'B1', workspaceName: 'ws', scope: BookmarkScope.Private, position: 0 }
      appStateServiceMock.currentPage$.next({ path: '/app' })
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'primary', result: bookmark }) as any)
      bookmarkApiUtilsMock.createNewBookmark.mockReturnValue(of(bookmark) as any)
      bookmarkApiUtilsMock.loadBookmarksForApp.mockReturnValue(of([bookmark]))
      initializeComponent()
      component.ocxInitRemoteComponent(remoteComponentConfig)

      component.onOpenBookmarkDialog()

      expect(bookmarkApiUtilsMock.loadBookmarksForApp).toHaveBeenCalledTimes(2)
    })

    it('should create bookmark with endpoint parameters when workspace has a matching endpoint', () => {
      const endpoint = { name: 'detail', path: '/detail/{id}' }
      appStateServiceMock.currentWorkspace$.next({
        workspaceName: 'ws',
        routes: [{ appId: 'app', productName: 'product', endpoints: [endpoint] }]
      })
      appStateServiceMock.currentPage$.next({ path: '/app/detail/123' })
      const bookmark = { id: '1', displayName: 'B1', workspaceName: 'ws', scope: BookmarkScope.Private, position: 0 }
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'primary', result: bookmark }) as any)
      bookmarkApiUtilsMock.createNewBookmark.mockReturnValue(of(bookmark) as any)
      bookmarkApiUtilsMock.loadBookmarksForApp.mockReturnValue(of([bookmark]))
      initializeComponent()
      component.ocxInitRemoteComponent(remoteComponentConfig)

      component.onOpenBookmarkDialog()

      expect(bookmarkApiUtilsMock.createNewBookmark).toHaveBeenCalledWith(
        expect.objectContaining({ endpointName: 'detail', endpointParameters: { id: '123' } })
      )
    })

    it('should edit bookmark when primary button clicked and page is already bookmarked', () => {
      const bookmark = {
        id: '1',
        displayName: 'B1',
        workspaceName: 'ws',
        scope: BookmarkScope.Private,
        position: 0,
        productName: 'product',
        appId: 'app',
        modificationCount: 1
      }
      appStateServiceMock.currentPage$.next({ path: '/app' })
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'primary', result: bookmark }) as any)
      bookmarkApiUtilsMock.editBookmark.mockReturnValue(of(undefined) as any)
      bookmarkApiUtilsMock.loadBookmarksForApp.mockReturnValue(of([bookmark]))
      initializeComponent()
      component.ocxInitRemoteComponent(remoteComponentConfig)
      component.bookmarks$.next([bookmark])

      component.onOpenBookmarkDialog()

      expect(bookmarkApiUtilsMock.editBookmark).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ id: '1', displayName: 'B1', modificationCount: 1 })
      )
    })

    it('should default position and modificationCount to 0 when undefined on edit', () => {
      const bookmark = {
        id: '2',
        displayName: 'B2',
        workspaceName: 'ws',
        scope: BookmarkScope.Private,
        position: undefined as unknown as number,
        productName: 'product',
        appId: 'app',
        modificationCount: undefined
      }
      appStateServiceMock.currentPage$.next({ path: '/app' })
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'primary', result: bookmark }) as any)
      bookmarkApiUtilsMock.editBookmark.mockReturnValue(of(undefined) as any)
      bookmarkApiUtilsMock.loadBookmarksForApp.mockReturnValue(of([bookmark]))
      initializeComponent()
      component.ocxInitRemoteComponent(remoteComponentConfig)
      component.bookmarks$.next([bookmark])

      component.onOpenBookmarkDialog()

      expect(bookmarkApiUtilsMock.editBookmark).toHaveBeenCalledWith(
        '2',
        expect.objectContaining({ position: 0, modificationCount: 0 })
      )
    })

    it('should delete bookmark when secondary button clicked and page is already bookmarked', () => {
      const bookmark = {
        id: '1',
        displayName: 'B1',
        workspaceName: 'ws',
        scope: BookmarkScope.Private,
        position: 0,
        productName: 'product',
        appId: 'app'
      }
      appStateServiceMock.currentPage$.next({ path: '/app' })
      // eslint-disable-next-line deprecation/deprecation
      portalDialogServiceMock.openDialog.mockReturnValue(of({ button: 'secondary', result: bookmark }) as any)
      bookmarkApiUtilsMock.deleteBookmarkById.mockReturnValue(of(undefined) as any)
      bookmarkApiUtilsMock.loadBookmarksForApp.mockReturnValue(of([]))
      initializeComponent()
      component.ocxInitRemoteComponent(remoteComponentConfig)
      component.bookmarks$.next([bookmark])

      component.onOpenBookmarkDialog()

      expect(bookmarkApiUtilsMock.deleteBookmarkById).toHaveBeenCalledWith('1')
    })
  })
})
