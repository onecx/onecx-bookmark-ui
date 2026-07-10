import { ComponentFixture, TestBed, DeferBlockBehavior, DeferBlockState } from '@angular/core/testing'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { ActivatedRoute } from '@angular/router'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'

import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Store, StoreModule } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'

import { TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DialogService } from 'primeng/dynamicdialog'

import { UserService, WorkspaceService, AppStateService } from '@onecx/angular-integration-interface'
import { DataSortDirection, Filter, RowListGridData, Sort } from '@onecx/angular-accelerator'
import { PermissionService } from '@onecx/angular-utils'
import { ensureIntersectionObserverMockExists } from '@onecx/angular-testing'
import { AppStateServiceMock, provideAppStateServiceMock } from '@onecx/angular-integration-interface/mocks'
import { provideHttpClient } from '@angular/common/http'

import { SharedModule } from 'src/app/shared/shared.module'
import { Bookmark, BookmarkScope } from 'src/app/shared/generated'
import { initialState } from './bookmark-configure.reducers'
import { BookmarkConfigureActions } from './bookmark-configure.actions'
import { BookmarkConfigureComponent } from './bookmark-configure.component'
import { BookmarkConfigureHarness } from './bookmark-configure.harness'
import { BookmarkConfigureViewModel } from './bookmark-configure.viewmodel'
import { selectBookmarkConfigureViewModel } from './bookmark-configure.selectors'

ensureIntersectionObserverMockExists()
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

describe('BookmarkConfigureComponent', () => {
  let component: BookmarkConfigureComponent
  let fixture: ComponentFixture<BookmarkConfigureComponent>
  let store: MockStore<Store>
  let appStateMock: AppStateServiceMock
  let bookmarkSearch: BookmarkConfigureHarness

  const mockActivatedRoute = {}
  const baseBookmarkConfigureViewModel: BookmarkConfigureViewModel = {
    columns: [],
    results: [],
    bookmarkFilter: '',
    scopeQuickFilter: 'PUBLIC',
    loading: false,
    exceptionKey: null
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
      imports: [
        BookmarkConfigureComponent,
        SharedModule,
        LetDirective,
        StoreModule.forRoot({}),
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en'),
        NoopAnimationsModule
      ],
      providers: [
        DialogService,
        UserService,
        WorkspaceService,
        { provide: PermissionService, useValue: { hasPermission: () => of(true) } },
        AppStateService,
        provideAppStateServiceMock(),
        provideHttpClientTesting(),
        provideHttpClient(),
        provideMockStore({ initialState: { bookmarks: { search: initialState } } }),
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents()
  })

  beforeEach(async () => {
    appStateMock = TestBed.inject(AppStateServiceMock)
    appStateMock.currentMfe$.publish({
      appId: 'app',
      baseHref: '/',
      productName: 'product',
      shellName: 'shell',
      mountPath: '/',
      remoteBaseUrl: 'http://remote.example.com'
    })

    const userService = TestBed.inject(UserService)
    userService.hasPermission = () => Promise.resolve(true)
    userService.getPermissions = () =>
      of([
        'BOOKMARK#EDIT',
        'BOOKMARK#ADMIN_EDIT',
        'BOOKMARK#DELETE',
        'BOOKMARK#ADMIN_DELETE',
        'BOOKMARK#CREATE',
        'BOOKMARK#EXPORT',
        'BOOKMARK#IMPORT'
      ])
    const workspaceService = TestBed.inject(WorkspaceService)
    workspaceService.getUrl = () => of('someUrl')
    const translateService = TestBed.inject(TranslateService)
    translateService.use('en')

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectBookmarkConfigureViewModel, baseBookmarkConfigureViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(BookmarkConfigureComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    bookmarkSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, BookmarkConfigureHarness)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should dispatch searchButtonClicked action on page init', (done) => {
    store.scannedActions$.pipe(ofType(BookmarkConfigureActions.search)).subscribe((action) => {
      expect(action.type).toBe(BookmarkConfigureActions.search.type)
      done()
    })
  })
  it('should filter results by scope in constructor and set pageActions', () => {
    const mockResults = [
      { id: '1', scope: 'admin', imagePath: '' },
      { id: '2', scope: 'admin', imagePath: '' },
      { id: '3', scope: 'user', imagePath: '' }
    ] as RowListGridData[]

    const mockViewModel: BookmarkConfigureViewModel = {
      columns: [],
      results: mockResults,
      bookmarkFilter: '',
      scopeQuickFilter: 'PRIVATE',
      loading: false,
      exceptionKey: null
    }

    const prepareSpy = jest.spyOn(component as any, 'preparePageActions').mockReturnValue(['mockAction'])

    store.overrideSelector(selectBookmarkConfigureViewModel, mockViewModel)
    store.refreshState()

    component.quickFilterValue = BookmarkScope.Private
    expect(prepareSpy).toHaveBeenCalledWith(false, 'PRIVATE')
    expect(component.pageActions).toEqual(['mockAction'])
  })

  it('should export csv data on export action click', async () => {
    jest.spyOn(store, 'dispatch')
    jest.spyOn(component, 'onExport')
    const mockResults = [
      { id: '1', scope: 'PRIVATE', imagePath: '' },
      { id: '2', scope: 'PRIVATE', imagePath: '' },
      { id: '3', scope: 'PRIVATE', imagePath: '' },
      { id: '1', scope: 'PUBLIC', imagePath: '' },
      { id: '2', scope: 'PUBLIC', imagePath: '' },
      { id: '3', scope: 'PUBLIC', imagePath: '' }
    ] as RowListGridData[]

    const mockViewModel: BookmarkConfigureViewModel = {
      columns: [],
      results: mockResults,
      bookmarkFilter: '',
      scopeQuickFilter: 'PUBLIC',
      loading: false,
      exceptionKey: null
    }

    const prepareSpy = jest.spyOn(component as any, 'preparePageActions')
    component.quickFilterValue = BookmarkScope.Public

    store.overrideSelector(selectBookmarkConfigureViewModel, mockViewModel)
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(prepareSpy).toHaveBeenCalledWith(true, 'PUBLIC')

    const pageHeader = await bookmarkSearch.getHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    expect(overflowActionButton).toBeDefined()
    await overflowActionButton?.click()
    const exportItem = await pageHeader.getOverFlowMenuItem('Export')

    await exportItem?.selectItem()

    expect(component.onExport).toHaveBeenCalled()

    expect(store.dispatch).toHaveBeenCalledWith(BookmarkConfigureActions.exportBookmarks())
  })

  it('should open import dialog on import action click', async () => {
    jest.spyOn(store, 'dispatch')
    jest.spyOn(component, 'onImport')
    const mockResults = [
      { id: '1', scope: 'PRIVATE', imagePath: '' },
      { id: '2', scope: 'PRIVATE', imagePath: '' },
      { id: '3', scope: 'PRIVATE', imagePath: '' },
      { id: '1', scope: 'PUBLIC', imagePath: '' },
      { id: '2', scope: 'PUBLIC', imagePath: '' },
      { id: '3', scope: 'PUBLIC', imagePath: '' }
    ] as RowListGridData[]

    const mockViewModel: BookmarkConfigureViewModel = {
      columns: [],
      results: mockResults,
      bookmarkFilter: '',
      scopeQuickFilter: 'PRIVATE',
      loading: false,
      exceptionKey: null
    }

    const prepareSpy = jest.spyOn(component as any, 'preparePageActions')
    component.quickFilterValue = BookmarkScope.Private

    store.overrideSelector(selectBookmarkConfigureViewModel, mockViewModel)
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(prepareSpy).toHaveBeenCalledWith(true, 'PRIVATE')

    const pageHeader = await bookmarkSearch.getHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    expect(overflowActionButton).toBeDefined()
    await overflowActionButton?.click()
    const exportItem = await pageHeader.getOverFlowMenuItem('Import')

    await exportItem?.selectItem()

    expect(component.onImport).toHaveBeenCalled()

    expect(store.dispatch).toHaveBeenCalledWith(BookmarkConfigureActions.importBookmarks())
  })

  it('should call create action on click', async () => {
    jest.spyOn(store, 'dispatch')
    jest.spyOn(component, 'onCreate')

    const mockResults = [
      { id: '1', scope: 'PRIVATE', imagePath: '' },
      { id: '2', scope: 'PRIVATE', imagePath: '' },
      { id: '3', scope: 'PRIVATE', imagePath: '' },
      { id: '1', scope: 'PUBLIC', imagePath: '' },
      { id: '2', scope: 'PUBLIC', imagePath: '' },
      { id: '3', scope: 'PUBLIC', imagePath: '' }
    ] as RowListGridData[]

    const mockViewModel: BookmarkConfigureViewModel = {
      columns: [],
      results: mockResults,
      bookmarkFilter: '',
      scopeQuickFilter: 'PRIVATE',
      loading: false,
      exceptionKey: null
    }

    const prepareSpy = jest.spyOn(component as any, 'preparePageActions')
    component.quickFilterValue = BookmarkScope.Private

    store.overrideSelector(selectBookmarkConfigureViewModel, mockViewModel)
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(prepareSpy).toHaveBeenCalledWith(true, 'PRIVATE')

    const pageHeader = await bookmarkSearch.getHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    expect(overflowActionButton).toBeDefined()
    await overflowActionButton?.click()
    const exportItem = await pageHeader.getOverFlowMenuItem('Create')

    await exportItem?.selectItem()

    expect(component.onCreate).toHaveBeenCalled()

    expect(store.dispatch).toHaveBeenCalledWith(BookmarkConfigureActions.createBookmark())
  })

  it('should call back and sort action on click', async () => {
    jest.spyOn(store, 'dispatch')
    jest.spyOn(component, 'onBack')
    jest.spyOn(component, 'onSortDialog')

    const mockResults = [
      { id: '1', scope: 'PRIVATE', imagePath: '' },
      { id: '2', scope: 'PRIVATE', imagePath: '' },
      { id: '3', scope: 'PRIVATE', imagePath: '' },
      { id: '1', scope: 'PUBLIC', imagePath: '' },
      { id: '2', scope: 'PUBLIC', imagePath: '' },
      { id: '3', scope: 'PUBLIC', imagePath: '' }
    ] as RowListGridData[]

    const mockViewModel: BookmarkConfigureViewModel = {
      columns: [],
      results: mockResults,
      bookmarkFilter: '',
      scopeQuickFilter: 'PRIVATE',
      loading: false,
      exceptionKey: null
    }

    const prepareSpy = jest.spyOn(component as any, 'preparePageActions')
    component.quickFilterValue = BookmarkScope.Private

    store.overrideSelector(selectBookmarkConfigureViewModel, mockViewModel)
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(prepareSpy).toHaveBeenCalledWith(true, 'PRIVATE')

    const pageHeader = await bookmarkSearch.getHeader()
    const menuButton = await pageHeader.getInlineActionButtons()
    await menuButton[0].click()

    expect(component.onBack).toHaveBeenCalled()
    await menuButton[1].click()
    expect(component.onSortDialog).toHaveBeenCalled()

    expect(store.dispatch).toHaveBeenCalledWith(BookmarkConfigureActions.openSortingDialog())
  })

  it('should trigger item actions on click', async () => {
    jest.spyOn(store, 'dispatch')
    jest.spyOn(component, 'onDetail')
    jest.spyOn(component, 'onCopy')
    jest.spyOn(component, 'onDelete')
    jest.spyOn(component, 'onToggleDisable')

    const bookmarks = [
      { id: '1', scope: 'PRIVATE', imagePath: '', disabled: false },
      { id: '2', scope: 'PRIVATE', imagePath: '', disabled: false },
      { id: '3', scope: 'PRIVATE', imagePath: '', disabled: false },
      { id: '4', scope: 'PUBLIC', imagePath: '', disabled: false },
      { id: '5', scope: 'PUBLIC', imagePath: '', disabled: false },
      { id: '6', scope: 'PUBLIC', imagePath: '', disabled: false }
    ] as RowListGridData[]

    const mockViewModel: BookmarkConfigureViewModel = {
      columns: [],
      results: bookmarks,
      bookmarkFilter: '',
      scopeQuickFilter: 'PRIVATE',
      loading: false,
      exceptionKey: null
    }
    component.quickFilterValue = BookmarkScope.Private

    store.overrideSelector(selectBookmarkConfigureViewModel, mockViewModel)
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()

    // Render all @defer blocks to make row cell content visible
    const deferBlocks = await fixture.getDeferBlocks()
    await Promise.all(deferBlocks.map((b) => b.render(DeferBlockState.Complete)))
    fixture.detectChanges()
    await fixture.whenStable()

    // Important: the action buttons are native <button pButton> elements — the id is on the button itself
    const copyButton: HTMLButtonElement = fixture.nativeElement.querySelector('#bm_configure_table_row_1_action_copy')
    const deleteButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '#bm_configure_table_row_1_action_delete'
    )
    const editButton: HTMLButtonElement = fixture.nativeElement.querySelector('#bm_configure_table_row_1_action_edit')

    const toggleButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '#bm_configure_table_row_1_action_toggle'
    )

    expect(copyButton).toBeTruthy()
    expect(deleteButton).toBeTruthy()
    expect(editButton).toBeTruthy()
    expect(toggleButton).toBeTruthy()

    toggleButton.click()
    fixture.detectChanges()
    expect(component.onToggleDisable).toHaveBeenCalled()
    expect(store.dispatch).toHaveBeenCalledWith(BookmarkConfigureActions.toggleBookmark({ id: '1' }))

    editButton.click()
    fixture.detectChanges()
    expect(component.onDetail).toHaveBeenCalled()
    expect(store.dispatch).toHaveBeenCalledWith(BookmarkConfigureActions.viewOrEditBookmark({ id: '1' }))

    copyButton.click()
    fixture.detectChanges()
    expect(component.onCopy).toHaveBeenCalled()
    expect(store.dispatch).toHaveBeenCalledWith(BookmarkConfigureActions.copyBookmark({ id: '1' }))

    deleteButton.click()
    fixture.detectChanges()
    expect(component.onDelete).toHaveBeenCalled()
    expect(store.dispatch).toHaveBeenCalledWith(BookmarkConfigureActions.openDeleteDialog({ id: '1' }))
  })

  it('should trigger table actions on click', async () => {
    jest.spyOn(store, 'dispatch')
    jest.spyOn(component, 'onQuickFilterChange')
    jest.spyOn(component, 'onFilterChange')

    const mockResults = [
      {
        id: '1',
        scope: 'PRIVATE',
        imagePath: '',
        appId: 'abc',
        productName: 'p1',
        query: { abc: 'abc' },
        fragment: 'abc',
        endpointName: 'abc',
        endpointParameters: ''
      },
      {
        id: '2',
        scope: 'PRIVATE',
        imagePath: '',
        query: { abc: 'abc' },
        fragment: 'abc'
      },
      {
        id: '3',
        scope: 'PRIVATE',
        imagePath: '',
        appId: 'abc',
        productName: 'p1',
        endpointName: 'abc',
        endpointParameters: ''
      },
      { id: '4', scope: 'PUBLIC', imagePath: '' },
      { id: '5', scope: 'PUBLIC', imagePath: '' },
      { id: '6', scope: 'PUBLIC', imagePath: '' }
    ] as RowListGridData[]

    const mockViewModel: BookmarkConfigureViewModel = {
      columns: [],
      results: mockResults,
      bookmarkFilter: '',
      scopeQuickFilter: 'PRIVATE',
      loading: false,
      exceptionKey: null
    }

    const prepareSpy = jest.spyOn(component as any, 'preparePageActions')
    component.quickFilterValue = BookmarkScope.Private

    store.overrideSelector(selectBookmarkConfigureViewModel, mockViewModel)
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(prepareSpy).toHaveBeenCalledWith(true, 'PRIVATE')

    await fixture.whenStable()

    const quickFilterButton: HTMLSpanElement = fixture.nativeElement.querySelector(
      '#bm_configure_table_quick_filter_PUBLIC'
    )

    expect(quickFilterButton).toBeTruthy()

    quickFilterButton.click()
    fixture.detectChanges()

    expect(component.onQuickFilterChange).toHaveBeenCalled()

    expect(store.dispatch).toHaveBeenCalledWith(
      BookmarkConfigureActions.scopeQuickFilterChanged({ scopeQuickFilter: 'PUBLIC' })
    )
  })

  it('should filter columns based on activeIds', () => {
    const activeIds = ['displayName', 'url']

    component.onColumnsChange(activeIds)

    expect(component.filteredColumns).toEqual([
      {
        field: 'displayName',
        header: 'DISPLAY_NAME',
        active: true,
        translationPrefix: 'BOOKMARK',
        limit: true,
        sort: true
      },
      {
        field: 'url',
        header: 'URL_SEARCH',
        active: true,
        translationPrefix: 'BOOKMARK',
        limit: false,
        sort: true
      }
    ])
  })

  describe('onFilterChange', () => {
    it('should update tableFilters with the provided filters', () => {
      const filters: Filter[] = [{ columnId: 'displayName', value: 'test' }]
      component.onFilterChange(filters)
      expect(component.tableFilters).toEqual(filters)
    })
  })

  describe('onGlobalFilter', () => {
    it('should set filterText and apply name filter', () => {
      const applySpy = jest.spyOn(component as any, 'applyNameFilter')
      component.onGlobalFilter('hello')
      expect(component.filterText).toBe('hello')
      expect(applySpy).toHaveBeenCalled()
    })
  })

  describe('onClearGlobalFilter', () => {
    it('should reset filterText to empty string and apply name filter', () => {
      component.filterText = 'something'
      const applySpy = jest.spyOn(component as any, 'applyNameFilter')
      component.onClearGlobalFilter()
      expect(component.filterText).toBe('')
      expect(applySpy).toHaveBeenCalled()
    })
  })

  describe('onSortChange', () => {
    it('should update sortField and defaultSortDirection', () => {
      const sort: Sort = { sortColumn: 'position', sortDirection: DataSortDirection.DESCENDING }
      component.onSortChange(sort)
      expect(component.sortField).toBe('position')
      expect(component.defaultSortDirection).toBe(DataSortDirection.DESCENDING)
    })
  })

  describe('onDataViewChange', () => {
    it('should be a no-op when layout is table', () => {
      expect(() => component.onDataViewChange('table')).not.toThrow()
    })

    it('should return early (no-op) when layout is list', () => {
      expect(() => component.onDataViewChange('list')).not.toThrow()
    })

    it('should return early (no-op) when layout is grid', () => {
      expect(() => component.onDataViewChange('grid')).not.toThrow()
    })
  })

  describe('getUrl', () => {
    it('should return undefined when bookmark has no id', () => {
      const bm = { scope: BookmarkScope.Private, position: 0, workspaceName: 'ws', displayName: 'B' } as Bookmark
      expect(component.getUrl(bm)).toBeUndefined()
    })

    it('should return undefined when bookmark has no productName', () => {
      const bm = {
        id: '1',
        scope: BookmarkScope.Private,
        position: 0,
        workspaceName: 'ws',
        displayName: 'B'
      } as Bookmark
      expect(component.getUrl(bm)).toBeUndefined()
    })

    it('should return undefined when bookmark has no appId', () => {
      const bm = {
        id: '1',
        productName: 'p',
        scope: BookmarkScope.Private,
        position: 0,
        workspaceName: 'ws',
        displayName: 'B'
      } as Bookmark
      expect(component.getUrl(bm)).toBeUndefined()
    })

    it('should call workspaceService.getUrl and cache the result', () => {
      const workspaceService = TestBed.inject(WorkspaceService)
      workspaceService.getUrl = jest.fn().mockReturnValue(of('/url'))
      const bm: Bookmark = {
        id: 'b1',
        productName: 'product',
        appId: 'app',
        scope: BookmarkScope.Private,
        position: 0,
        workspaceName: 'ws',
        displayName: 'B'
      }

      const result1 = component.getUrl(bm)
      const result2 = component.getUrl(bm)

      expect(result1).toBeDefined()
      expect(result1).toBe(result2)
      expect(workspaceService.getUrl as jest.Mock).toHaveBeenCalledTimes(1)
    })
  })

  describe('prepareUrlBookmarkLink', () => {
    const base: Bookmark = {
      id: '1',
      productName: 'p',
      scope: BookmarkScope.Private,
      position: 0,
      workspaceName: 'ws',
      displayName: 'B'
    }

    it('should return empty string for null url', () => {
      expect(component.prepareUrlBookmarkLink(null, base)).toBe('')
    })

    it('should return plain url when no query or fragment', () => {
      expect(component.prepareUrlBookmarkLink('/path', base)).toBe('/path')
    })

    it('should append query string when query is present', () => {
      const bm = { ...base, query: { foo: 'bar' } } as Bookmark
      expect(component.prepareUrlBookmarkLink('/path', bm)).toBe('/path?foo=bar')
    })

    it('should append fragment when fragment is present', () => {
      const bm = { ...base, fragment: 'section' } as Bookmark
      expect(component.prepareUrlBookmarkLink('/path', bm)).toBe('/path#section')
    })

    it('should append both query and fragment', () => {
      const bm = { ...base, query: { a: '1' }, fragment: 'top' } as Bookmark
      expect(component.prepareUrlBookmarkLink('/path', bm)).toBe('/path?a=1#top')
    })
  })

  describe('applyNameFilter', () => {
    beforeEach(() => {
      store.overrideSelector(selectBookmarkConfigureViewModel, {
        ...baseBookmarkConfigureViewModel,
        results: [
          { id: '1', displayName: 'Alpha', scope: 'PRIVATE', imagePath: '' },
          { id: '2', displayName: 'Beta', scope: 'PRIVATE', imagePath: '' },
          { id: '3', displayName: undefined, scope: 'PRIVATE', imagePath: '' }
        ] as any
      })
      store.refreshState()
      fixture.detectChanges()
    })

    it('should show all rows when filter is empty', () => {
      component.onClearGlobalFilter()
      expect(component.interactiveRows).toBe((component as any).allInteractiveRows)
    })

    it('should filter rows by name case-insensitively', () => {
      component.onGlobalFilter('alpha')
      expect(component.interactiveRows).toHaveLength(1)
      expect(component.interactiveRows[0]['id']).toBe('1')
    })

    it('should return empty array when no rows match the filter', () => {
      component.onGlobalFilter('zzz')
      expect(component.interactiveRows).toHaveLength(0)
    })

    it('should treat row with undefined displayName as non-matching', () => {
      component.onGlobalFilter('alpha')
      const ids = component.interactiveRows.map((r: any) => r.id)
      expect(ids).not.toContain('3')
    })

    it('should handle rows without displayNameLower property using ?? fallback', () => {
      ;(component as any).allInteractiveRows = [
        { id: '1', displayNameLower: 'alpha', imagePath: '' },
        { id: '2', imagePath: '' }
      ]
      component.filterText = 'alpha'
      ;(component as any).applyNameFilter()
      expect(component.interactiveRows).toHaveLength(1)
      expect(component.interactiveRows[0]['id']).toBe('1')
    })
  })
})

describe('BookmarkConfigureComponent - no permission testcase', () => {
  let component: BookmarkConfigureComponent
  let fixture: ComponentFixture<BookmarkConfigureComponent>
  let store: MockStore<Store>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let bookmarkSearch: BookmarkConfigureHarness
  const mockActivatedRoute = {}
  const baseBookmarkConfigureViewModel: BookmarkConfigureViewModel = {
    columns: [],
    results: [],
    bookmarkFilter: '',
    scopeQuickFilter: 'SCOPE',
    loading: false,
    exceptionKey: null
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BookmarkConfigureComponent,
        SharedModule,
        LetDirective,
        StoreModule.forRoot({}),
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en'),
        NoopAnimationsModule
      ],
      providers: [
        DialogService,
        UserService,
        WorkspaceService,
        { provide: PermissionService, useValue: { hasPermission: () => of(true) } },
        AppStateService,
        provideAppStateServiceMock(),
        provideHttpClientTesting(),
        provideHttpClient(),
        provideMockStore({ initialState: { bookmarks: { search: initialState } } }),
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents()
  })

  beforeEach(async () => {
    const userService = TestBed.inject(UserService)
    userService.hasPermission = () => Promise.resolve(false)

    const translateService = TestBed.inject(TranslateService)
    translateService.use('en')

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectBookmarkConfigureViewModel, baseBookmarkConfigureViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(BookmarkConfigureComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    bookmarkSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, BookmarkConfigureHarness)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })
})
