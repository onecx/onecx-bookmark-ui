import { ComponentFixture, TestBed } from '@angular/core/testing'
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

import { UserService, WorkspaceService } from '@onecx/angular-integration-interface'
import { PortalCoreModule, RowListGridData } from '@onecx/portal-integration-angular'
import { provideHttpClient } from '@angular/common/http'

import { SharedModule } from 'src/app/shared/shared.module'
import { initialState } from './bookmark-configure.reducers'
import { BookmarkConfigureActions } from './bookmark-configure.actions'
import { BookmarkConfigureComponent } from './bookmark-configure.component'
import { BookmarkConfigureHarness } from './bookmark-configure.harness'
import { BookmarkConfigureViewModel } from './bookmark-configure.viewmodel'
import { selectBookmarkConfigureViewModel } from './bookmark-configure.selectors'

describe('BookmarkConfigureComponent', () => {
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
    scopeQuickFilter: 'PUBLIC',
    loading: false,
    exceptionKey: null
  }

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }))
    })
  })

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BookmarkConfigureComponent],
      imports: [
        SharedModule,
        PortalCoreModule,
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
        provideHttpClientTesting(),
        provideHttpClient(),
        provideMockStore({ initialState: { bookmarks: { search: initialState } } }),
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents()
  })

  beforeEach(async () => {
    const userService = TestBed.inject(UserService)
    userService.hasPermission = () => true
    userService.hasPermission = (permissionKey: 'BOOKMARK#EDIT') => true
    userService.hasPermission = (permissionKey: 'BOOKMARK#CONFIGURE') => true
    userService.hasPermission = (permissionKey: 'BOOKMARK#EXPORT') => true
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
    bookmarkSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, BookmarkConfigureHarness)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should dispatch searchButtonClicked action on page init', (done) => {
    store.scannedActions$.pipe(ofType(BookmarkConfigureActions.search)).subscribe(() => {
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

    component.quickFilterValue = 'PRIVATE'
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
    component.quickFilterValue = 'PUBLIC'

    store.overrideSelector(selectBookmarkConfigureViewModel, mockViewModel)
    store.refreshState()
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
    component.quickFilterValue = 'PRIVATE'

    store.overrideSelector(selectBookmarkConfigureViewModel, mockViewModel)
    store.refreshState()
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
    component.quickFilterValue = 'PRIVATE'

    store.overrideSelector(selectBookmarkConfigureViewModel, mockViewModel)
    store.refreshState()
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
    component.quickFilterValue = 'PRIVATE'

    store.overrideSelector(selectBookmarkConfigureViewModel, mockViewModel)
    store.refreshState()
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
    component.quickFilterValue = 'PRIVATE'

    store.overrideSelector(selectBookmarkConfigureViewModel, mockViewModel)
    store.refreshState()
    fixture.detectChanges()

    await fixture.whenStable()

    // Important: get the real rendered button element inside the p-button wrapper!
    const copyButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '#bm_configure_table_row_0_action_copy button'
    )
    const deleteButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '#bm_configure_table_row_0_action_delete button'
    )
    const editButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '#bm_configure_table_row_0_action_edit button'
    )

    const toggleButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '#bm_configure_table_row_0_action_toggle button'
    )

    expect(copyButton).toBeTruthy()
    expect(deleteButton).toBeTruthy()
    expect(editButton).toBeTruthy()
    expect(toggleButton).toBeTruthy()

    console.log(toggleButton)
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
    component.quickFilterValue = 'PRIVATE'

    store.overrideSelector(selectBookmarkConfigureViewModel, mockViewModel)
    store.refreshState()
    fixture.detectChanges()
    expect(prepareSpy).toHaveBeenCalledWith(true, 'PRIVATE')

    await fixture.whenStable()

    const quickFilterButton: HTMLSpanElement = fixture.nativeElement.querySelector(
      '#bm_configure_table_quick_filter_PUBLIC'
    )
    const filterInput: HTMLInputElement = fixture.nativeElement.querySelector('#data-view-control-filter')

    expect(quickFilterButton).toBeTruthy()
    expect(filterInput).toBeTruthy()

    quickFilterButton.click()
    fixture.detectChanges()

    expect(component.onQuickFilterChange).toHaveBeenCalled()

    expect(store.dispatch).toHaveBeenCalledWith(
      BookmarkConfigureActions.scopeQuickFilterChanged({ scopeQuickFilter: 'PUBLIC' })
    )

    filterInput.value = 'Testwert'
    filterInput.dispatchEvent(new Event('input'))
    fixture.detectChanges()

    expect(component.onFilterChange).toHaveBeenCalled()
  })

  it('filter change if no table exists', () => {
    component.dataTable = undefined
    const mockViewModel: BookmarkConfigureViewModel = {
      columns: [],
      results: [],
      bookmarkFilter: '',
      scopeQuickFilter: 'PRIVATE',
      loading: false,
      exceptionKey: null
    }

    store.overrideSelector(selectBookmarkConfigureViewModel, mockViewModel)
    jest.spyOn(component, 'onFilterChange')

    const filterInput: HTMLInputElement = fixture.nativeElement.querySelector('#data-view-control-filter')

    filterInput.value = 'Testwert'
    filterInput.dispatchEvent(new Event('input'))
    fixture.detectChanges()

    expect(component.onFilterChange).toHaveBeenCalled()
    expect(component).toBeTruthy()
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
      declarations: [BookmarkConfigureComponent],
      imports: [
        SharedModule,
        PortalCoreModule,
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
        provideHttpClientTesting(),
        provideHttpClient(),
        provideMockStore({ initialState: { bookmarks: { search: initialState } } }),
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents()
  })

  beforeEach(async () => {
    const userService = TestBed.inject(UserService)
    userService.hasPermission = () => false

    const translateService = TestBed.inject(TranslateService)
    translateService.use('en')

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectBookmarkConfigureViewModel, baseBookmarkConfigureViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(BookmarkConfigureComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    bookmarkSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, BookmarkConfigureHarness)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })
})
