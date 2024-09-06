import { AfterViewInit, Component, ElementRef, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core'
import { Store } from '@ngrx/store'
import { Action, BreadcrumbService, RowListGridData } from '@onecx/portal-integration-angular'
import { Observable, debounceTime, distinctUntilChanged, fromEvent, map } from 'rxjs'
import { BookmarksSearchActions } from './bookmarks-search.actions'
import { selectBookmarksSearchViewModel } from './bookmarks-search.selectors'
import { BookmarksSearchViewModel } from './bookmarks-search.viewmodel'
import { PrimeIcons, SelectItem } from 'primeng/api'
import { AppStateService, WorkspaceService } from '@onecx/angular-integration-interface'
import { Bookmark, BookmarkScopeEnum } from 'src/app/shared/generated'
import { Location } from '@angular/common'
import { environment } from 'src/environments/environment'

@Component({
  selector: 'app-bookmarks-search',
  templateUrl: './bookmarks-search.component.html',
  styleUrls: ['./bookmarks-search.component.scss']
})
export class BookmarksSearchComponent implements OnInit, AfterViewInit {
  viewModel$: Observable<BookmarksSearchViewModel> = this.store.select(selectBookmarksSearchViewModel)
  defaultImageUrl$: Observable<string>
  productLogoBaseURL$: Observable<string>
  privateBookmarkScope = BookmarkScopeEnum.Private

  headerActions: Action[] = [
    {
      labelKey: 'BOOKMARKS_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
      icon: PrimeIcons.DOWNLOAD,
      titleKey: 'BOOKMARKS_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
      show: 'always',
      actionCallback: () => this.exportItems(),
      permission: 'BOOKMARK#EXPORT'
    }
  ]

  quickFilterOptions: SelectItem[] = [
    {
      value: 'BOOKMARK_TYPES.ALL'
    },
    {
      value: 'BOOKMARK_TYPES.PRIVATE'
    },
    {
      value: 'BOOKMARK_TYPES.PUBLIC'
    }
  ]

  defaultQuickFilterOption = 'BOOKMARK_TYPES.ALL'

  constructor(
    private readonly breadcrumbService: BreadcrumbService,
    private readonly store: Store,
    @Inject(LOCALE_ID) public readonly locale: string,
    private readonly workspaceService: WorkspaceService,
    private readonly appStateService: AppStateService
  ) {
    this.defaultImageUrl$ = appStateService.currentMfe$.pipe(
      map((mfe) => {
        return this.prepareUrlPath(mfe.remoteBaseUrl, environment.DEFAULT_LOGO_PATH)
      })
    )
    this.productLogoBaseURL$ = appStateService.currentMfe$.pipe(
      map((mfe) => {
        return this.prepareUrlPath(mfe.remoteBaseUrl, 'bff/images/product/')
      })
    )
  }

  urls: Record<string, Observable<string>> = {}

  @ViewChild('bookmarkFilter') bookmarkFilter: ElementRef | undefined

  ngOnInit() {
    this.breadcrumbService.setItems([
      {
        titleKey: 'BOOKMARKS_SEARCH.BREADCRUMB',
        labelKey: 'BOOKMARKS_SEARCH.BREADCRUMB',
        routerLink: '/bookmarks'
      }
    ])
    this.search()
  }

  ngAfterViewInit() {
    fromEvent<KeyboardEvent>(this.bookmarkFilter?.nativeElement, 'keyup')
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((event: KeyboardEvent) => this.filterBookmarks(event))
  }

  resetFilter() {
    if (this.bookmarkFilter) {
      this.bookmarkFilter.nativeElement.value = ''
      this.store.dispatch(BookmarksSearchActions.bookmarkFilterChanged({ bookmarkFilter: '' }))
    }
  }

  prepareUrlPath(url?: string, path?: string): string {
    if (url && path) return Location.joinWithSlash(url, path)
    else if (url) return url
    else return ''
  }

  onImageError(item: Bookmark & { errorImage$: Observable<string> }): void {
    item.errorImage$ = this.defaultImageUrl$
  }

  editBookmark(event: MouseEvent, { id }: RowListGridData) {
    event.preventDefault()
    this.store.dispatch(BookmarksSearchActions.editBookmarksButtonClicked({ id }))
  }

  deleteBookmark(event: MouseEvent, { id }: RowListGridData) {
    event.preventDefault()
    this.store.dispatch(BookmarksSearchActions.deleteBookmarksButtonClicked({ id }))
  }

  search() {
    this.store.dispatch(BookmarksSearchActions.searchTriggered())
  }

  exportItems() {
    this.store.dispatch(BookmarksSearchActions.exportButtonClicked())
  }

  filterBookmarks(event: Event) {
    const bookmarkFilter = (event.target as HTMLInputElement)?.value ?? ''
    this.store.dispatch(BookmarksSearchActions.bookmarkFilterChanged({ bookmarkFilter }))
  }

  handleQuickFilterChange(scopeQuickFilter: string) {
    this.store.dispatch(BookmarksSearchActions.scopeQuickFilterChanged({ scopeQuickFilter: scopeQuickFilter }))
  }

  getUrl(bookmark: Bookmark) {
    if (bookmark.id && bookmark.productName && bookmark.appId) {
      if (!this.urls[bookmark.id]) {
        this.urls[bookmark.id] = this.workspaceService.getUrl(
          bookmark.productName,
          bookmark.appId,
          bookmark.endpointName,
          bookmark.endpointParameters
        )
      }
      return this.urls[bookmark.id]
    }
    return undefined
  }
}
