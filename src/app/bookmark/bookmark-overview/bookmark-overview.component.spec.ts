/* eslint-disable @typescript-eslint/no-var-requires */
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of } from 'rxjs'

import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { Store, StoreModule } from '@ngrx/store'
import { ofType } from '@ngrx/effects'

import { AppStateService, UserService } from '@onecx/angular-integration-interface'
import { AppStateServiceMock, provideAppStateServiceMock } from '@onecx/angular-integration-interface/mocks'
import { SlotService } from '@onecx/angular-remote-components'
import { PortalCoreModule } from '@onecx/portal-integration-angular'

import { BookmarkOverviewComponent } from './bookmark-overview.component'
import { BookmarkOverviewActions } from './bookmark-overview.actions'
import { BookmarkOverviewViewModel } from './bookmark-overview.viewmodel'
import { selectBookmarkOverviewViewModel } from './bookmark-overview.selectors'
import { initialState as overviewInitialState } from './bookmark-overview.reducers'
import { initialState as configureInitialState } from '../bookmark-configure/bookmark-configure.reducers'
import { Bookmark, BookmarkScope } from 'src/app/shared/generated'

const baseViewModel: BookmarkOverviewViewModel = {
  results: [],
  loading: false,
  exceptionKey: null
}

describe('BookmarkOverviewComponent', () => {
  let component: BookmarkOverviewComponent
  let fixture: ComponentFixture<BookmarkOverviewComponent>
  let store: MockStore<Store>
  let appStateMock: AppStateServiceMock
  let slotServiceMock: jest.Mocked<Pick<SlotService, 'isSomeComponentDefinedForSlot'>>
  let userServiceMock: jest.Mocked<Pick<UserService, 'hasPermission' | 'profile$'>>

  beforeEach(async () => {
    slotServiceMock = {
      isSomeComponentDefinedForSlot: jest.fn().mockReturnValue(of(false))
    }

    await TestBed.configureTestingModule({
      declarations: [BookmarkOverviewComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [
        StoreModule.forRoot({}),
        PortalCoreModule,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AppStateService,
        provideAppStateServiceMock(),
        provideMockStore({
          initialState: {
            bookmarks: {
              overview: overviewInitialState,
              configure: configureInitialState
            }
          }
        }),
        { provide: SlotService, useValue: slotServiceMock }
      ]
    }).compileComponents()

    appStateMock = TestBed.inject(AppStateServiceMock)
    appStateMock.currentMfe$.publish({
      appId: 'app',
      baseHref: '/',
      productName: 'product',
      shellName: 'shell',
      mountPath: '/',
      remoteBaseUrl: 'http://remote.example.com'
    })

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectBookmarkOverviewViewModel, baseViewModel)
    store.refreshState()

    userServiceMock = TestBed.inject(UserService) as unknown as jest.Mocked<Pick<UserService, 'hasPermission' | 'profile$'>>
    userServiceMock.hasPermission = jest.fn().mockReturnValue(true)

    fixture = TestBed.createComponent(BookmarkOverviewComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('constructor', () => {
    it('should expose BookmarkScope for template use', () => {
      expect(component.BookmarkScope).toBe(BookmarkScope)
    })

    it('should set hasEditPermissions based on user permissions', () => {
      expect(component.hasEditPermissions).toBe(true)
    })

    it('should fall back to ADMIN_EDIT permission when EDIT permission returns null', () => {
      userServiceMock.hasPermission = jest.fn().mockReturnValueOnce(null).mockReturnValueOnce(false)
      const newFixture = TestBed.createComponent(BookmarkOverviewComponent)
      expect(newFixture.componentInstance.hasEditPermissions).toBe(false)
    })

    it('should initialize isProductComponentDefined$ via SlotService', (done) => {
      component.isProductComponentDefined$.subscribe((val) => {
        expect(val).toBe(false)
        done()
      })
    })
  })

  describe('ngOnInit', () => {
    it('should dispatch search action on init', (done) => {
      store.scannedActions$.pipe(ofType(BookmarkOverviewActions.search)).subscribe(() => {
        done()
      })
    })

    it('should subscribe productsEmitter to products$', () => {
      const testProducts = [{ name: 'product-a', displayName: 'Product A' }]
      component.productsEmitter.emit(testProducts)
      expect(component.products$.getValue()).toEqual(testProducts)
    })

    it('should set workspace from appStateService currentWorkspace$', () => {
      expect(component.workspace).toBeDefined()
    })
  })

  describe('prepareDockItems', () => {
    it('should emit dock items with configure action', (done) => {
      component.dockItems$.subscribe((items) => {
        expect(items.length).toBe(1)
        expect(items[0].routerLink).toBe('configure')
        done()
      })
    })
  })

  describe('onSearch', () => {
    it('should dispatch search action', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')

      component.onSearch()

      expect(dispatchSpy).toHaveBeenCalledWith(BookmarkOverviewActions.search())
    })
  })

  describe('onFilterBookmarksByScope', () => {
    const bookmarks: Bookmark[] = [
      { id: '1', scope: BookmarkScope.Private, position: 0, workspaceName: 'ws', displayName: 'Private 1' },
      { id: '2', scope: BookmarkScope.Public, position: 1, workspaceName: 'ws', displayName: 'Public 1' },
      { id: '3', scope: BookmarkScope.Private, position: 2, workspaceName: 'ws', displayName: 'Private 2' }
    ]

    it('should return only private bookmarks when filtering by Private scope', () => {
      const result = component.onFilterBookmarksByScope(bookmarks, BookmarkScope.Private)
      expect(result).toHaveLength(2)
      expect(result.every((b) => b.scope === BookmarkScope.Private)).toBe(true)
    })

    it('should return only public bookmarks when filtering by Public scope', () => {
      const result = component.onFilterBookmarksByScope(bookmarks, BookmarkScope.Public)
      expect(result).toHaveLength(1)
      expect(result[0].scope).toBe(BookmarkScope.Public)
    })

    it('should return empty array when no bookmarks match scope', () => {
      const result = component.onFilterBookmarksByScope([], BookmarkScope.Private)
      expect(result).toEqual([])
    })
  })

  describe('onGoToConfigure', () => {
    it('should dispatch navigate action with configure path', (done) => {
      store.scannedActions$.pipe(ofType(BookmarkOverviewActions.navigate)).subscribe((action) => {
        expect(action.path).toEqual(['configure'])
        done()
      })
      component.onGoToConfigure()
    })
  })
})
