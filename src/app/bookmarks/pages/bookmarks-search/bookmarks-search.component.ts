import { AfterViewInit, Component, ElementRef, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core'
import { Location } from '@angular/common'
import { Observable, debounceTime, distinctUntilChanged, fromEvent } from 'rxjs'
import { Store } from '@ngrx/store'
import { PrimeIcons } from 'primeng/api'

import { WorkspaceService } from '@onecx/angular-integration-interface'
import { Action, BreadcrumbService, DataSortDirection, RowListGridData } from '@onecx/portal-integration-angular'

import { Bookmark, BookmarkScopeEnum } from 'src/app/shared/generated'

import { BookmarksSearchActions } from './bookmarks-search.actions'
import { BookmarksSearchViewModel } from './bookmarks-search.viewmodel'
import { selectBookmarksSearchViewModel } from './bookmarks-search.selectors'

@Component({
  selector: 'app-bookmarks-search',
  templateUrl: './bookmarks-search.component.html',
  styleUrls: ['./bookmarks-search.component.scss']
})
export class BookmarksSearchComponent implements OnInit, AfterViewInit {
  public viewModel$: Observable<BookmarksSearchViewModel> = this.store.select(selectBookmarksSearchViewModel)
  public privateBookmarkScope = BookmarkScopeEnum.Private
  public urls: Record<string, Observable<string>> = {}

  @ViewChild('bookmarkFilter') bookmarkFilter: ElementRef | undefined

  public headerActions: Action[] = [
    {
      labelKey: 'BOOKMARK_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
      icon: PrimeIcons.DOWNLOAD,
      titleKey: 'BOOKMARK_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
      show: 'always',
      actionCallback: () => this.exportItems(),
      permission: 'BOOKMARK#EXPORT'
    }
  ]
  defaultSortDirection = DataSortDirection.ASCENDING

  constructor(
    @Inject(LOCALE_ID) public readonly locale: string,
    private readonly store: Store,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly workspaceService: WorkspaceService
  ) {}

  ngOnInit() {
    this.breadcrumbService.setItems([
      {
        titleKey: 'BOOKMARK_SEARCH.BREADCRUMB',
        labelKey: 'BOOKMARK_SEARCH.BREADCRUMB',
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

  public onResetFilter(): void {
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

  editBookmark({ id }: RowListGridData) {
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
  public onEditAction() {
    console.log('onEditAction')
  }
}
