import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { BehaviorSubject, ReplaySubject, of } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { PortalCoreModule } from '@onecx/portal-integration-angular'
import { BASE_URL, RemoteComponentConfig, SLOT_SERVICE } from '@onecx/angular-remote-components'
import { AppConfigService, UserService } from '@onecx/angular-integration-interface'

import { Bookmark, BookmarkScope } from 'src/app/shared/generated'
import { BookmarkAPIUtilsService } from 'src/app/shared/utils/bookmarkApiUtils.service'
import { OneCXBookmarkListComponent } from './bookmark-list.component'

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

describe('OneCXBookmarkListComponent', () => {
  let component: OneCXBookmarkListComponent
  let fixture: ComponentFixture<OneCXBookmarkListComponent>

  let baseUrlSubject: ReplaySubject<string>
  let bookmarkApiUtilsMock: jest.Mocked<Pick<BookmarkAPIUtilsService, 'overwriteBaseURL' | 'loadBookmarks'>>
  let appConfigServiceMock: jest.Mocked<Pick<AppConfigService, 'init'>>
  let userServiceMock: { lang$: BehaviorSubject<string> }

  const mockBookmarks: Bookmark[] = [
    { id: '1', displayName: 'Private B2', workspaceName: 'ws', scope: BookmarkScope.Private, position: 2 },
    { id: '2', displayName: 'Private B1', workspaceName: 'ws', scope: BookmarkScope.Private, position: 1 },
    { id: '3', displayName: 'Public B1', workspaceName: 'ws', scope: BookmarkScope.Public, position: 0 }
  ]

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
      loadBookmarks: jest.fn().mockReturnValue(of(mockBookmarks))
    }
    appConfigServiceMock = { init: jest.fn().mockReturnValue(of(undefined)) }
    userServiceMock = { lang$: new BehaviorSubject<string>('en') }

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
        { provide: UserService, useValue: userServiceMock }
      ]
    })
      .overrideComponent(OneCXBookmarkListComponent, {
        set: {
          providers: [
            { provide: BASE_URL, useValue: baseUrlSubject },
            { provide: BookmarkAPIUtilsService, useValue: bookmarkApiUtilsMock },
            { provide: AppConfigService, useValue: appConfigServiceMock },
            { provide: SLOT_SERVICE, useValue: { init: jest.fn().mockReturnValue(Promise.resolve()) } }
          ]
        }
      })
      .compileComponents()
  })

  function initializeComponent() {
    fixture = TestBed.createComponent(OneCXBookmarkListComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  it('should create', () => {
    initializeComponent()

    expect(component).toBeTruthy()
  })

  it('should initialize with loading true and no error', () => {
    initializeComponent()

    expect(component.loading).toBe(true)
    expect(component.bookmarkLoadingError).toBe(false)
    expect(component.permissions).toEqual([])
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

    it('should filter private bookmarks and sort them by position', () => {
      initializeComponent()

      component.ocxInitRemoteComponent(remoteComponentConfig)

      const privateBookmarks = component.privateBookmarks$.getValue()
      expect(privateBookmarks.length).toBe(2)
      expect(privateBookmarks[0].displayName).toBe('Private B1')
      expect(privateBookmarks[1].displayName).toBe('Private B2')
    })

    it('should filter public bookmarks and sort them by position', () => {
      initializeComponent()

      component.ocxInitRemoteComponent(remoteComponentConfig)

      const publicBookmarks = component.publicBookmarks$.getValue()
      expect(publicBookmarks.length).toBe(1)
      expect(publicBookmarks[0].displayName).toBe('Public B1')
    })

    it('should set loading to false after bookmarks are loaded', () => {
      initializeComponent()

      component.ocxInitRemoteComponent(remoteComponentConfig)

      expect(component.loading).toBe(false)
    })

    it('should treat undefined result from loadBookmarks as empty array', () => {
      bookmarkApiUtilsMock.loadBookmarks.mockReturnValue(of(undefined))
      initializeComponent()

      component.ocxInitRemoteComponent(remoteComponentConfig)

      expect(component.privateBookmarks$.getValue()).toEqual([])
      expect(component.publicBookmarks$.getValue()).toEqual([])
      expect(component.loading).toBe(false)
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

  describe('handleBookmarkLoadError', () => {
    it('should set bookmarkLoadingError to true and loading to false', () => {
      initializeComponent()

      component['handleBookmarkLoadError']()

      expect(component.bookmarkLoadingError).toBe(true)
      expect(component.loading).toBe(false)
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
})
