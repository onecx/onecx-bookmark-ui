import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ActivatedRoute } from '@angular/router'
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
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

import { initialState } from './bookmarks-search.reducers'
import { BookmarkImageComponent } from './product-image/bookmark-image.component'
import { BookmarksSearchActions } from './bookmarks-search.actions'
import { bookmarksSearchColumns } from './bookmarks-search.columns'
import { BookmarksSearchComponent } from './bookmarks-search.component'
import { BookmarksSearchHarness } from './bookmarks-search.harness'
import { BookmarksSearchViewModel } from './bookmarks-search.viewmodel'
import { selectBookmarksSearchViewModel } from './bookmarks-search.selectors'

describe('BookmarksSearchComponent', () => {
  HTMLCanvasElement.prototype.getContext = jest.fn()
  let component: BookmarksSearchComponent
  let fixture: ComponentFixture<BookmarksSearchComponent>
  let store: MockStore<Store>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let bookmarksSearch: BookmarksSearchHarness

  const mockActivatedRoute = {}
  const baseBookmarksSearchViewModel: BookmarksSearchViewModel = {
    columns: bookmarksSearchColumns,
    results: [],
    bookmarkFilter: '',
    scopeQuickFilter: 'BOOKMARK.SCOPES.ALL'
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
      declarations: [BookmarksSearchComponent, BookmarkImageComponent],
      imports: [
        SharedModule,
        PortalCoreModule,
        LetDirective,
        ReactiveFormsModule,
        FormsModule,
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
    store.overrideSelector(selectBookmarksSearchViewModel, baseBookmarksSearchViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(BookmarksSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    bookmarksSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, BookmarksSearchHarness)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should dispatch searchButtonClicked action on page init', (done) => {
    store.scannedActions$.pipe(ofType(BookmarksSearchActions.searchTriggered)).subscribe(() => {
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
    store.overrideSelector(selectBookmarksSearchViewModel, {
      ...baseBookmarksSearchViewModel,
      results: results,
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const pageHeader = await bookmarksSearch.getHeader()
    const exportButton = await pageHeader.getInlineActionButtonByLabel('Export')
    await exportButton?.click()

    expect(store.dispatch).toHaveBeenCalledWith(BookmarksSearchActions.exportButtonClicked())
  })
    */
})
