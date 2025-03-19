import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { ActivatedRoute } from '@angular/router'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'

import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Store, StoreModule } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'

import { TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DialogService } from 'primeng/dynamicdialog'

import { PortalCoreModule, UserService } from '@onecx/portal-integration-angular'
import { SharedModule } from 'src/app/shared/shared.module'

import { initialState } from './bookmark-configure.reducers'
import { BookmarkConfigureActions } from './bookmark-configure.actions'
import { BookmarkConfigureComponent } from './bookmark-configure.component'
import { BookmarkConfigureHarness } from './bookmark-configure.harness'
import { BookmarkConfigureViewModel } from './bookmark-configure.viewmodel'
import { selectBookmarkConfigureViewModel } from './bookmark-configure.selectors'

describe('BookmarkConfigureComponent', () => {
  HTMLCanvasElement.prototype.getContext = jest.fn()
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
    scopeQuickFilter: 'BOOKMARK.SCOPES.PRIVATE',
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
        provideMockStore({ initialState: { bookmarks: { search: initialState } } }),
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents()
  })

  beforeEach(async () => {
    const userService = TestBed.inject(UserService)
    userService.hasPermission = () => true
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

  /*
  it('should export csv data on export action click', async () => {
    jest.spyOn(store, 'dispatch')

    const results = [
      {
        id: '1',
        imagePath: '',
        column_1: 'val_1'
      }
    ]
    const columns = [
      {
        columnType: ColumnType.STRING,
        nameKey: 'COLUMN_KEY',
        id: 'column_1'
      }
    ]
    store.overrideSelector(selectBookmarkConfigureViewModel, {
      ...baseBookmarkConfigureViewModel,
      results: results,
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const pageHeader = await bookmarkSearch.getHeader()
    const exportButton = await pageHeader.getInlineActionButtonByLabel('Export')
    await exportButton?.click()

    expect(store.dispatch).toHaveBeenCalledWith(BookmarkConfigureActions.exportButtonClicked())
  })
    */
})
