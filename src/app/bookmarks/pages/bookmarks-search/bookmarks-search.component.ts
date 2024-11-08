import { AfterViewInit, Component, ElementRef, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core'
import { Location } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { Observable, debounceTime, distinctUntilChanged, fromEvent } from 'rxjs'
import { Store } from '@ngrx/store'
import { PrimeIcons } from 'primeng/api'

import { UserService, WorkspaceService } from '@onecx/angular-integration-interface'
import { Action, DataAction, DataSortDirection } from '@onecx/portal-integration-angular'

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
  @ViewChild('bookmarkFilter') bookmarkFilter: ElementRef | undefined
  public viewModel$: Observable<BookmarksSearchViewModel> = this.store.select(selectBookmarksSearchViewModel)
  public urls: Record<string, Observable<string>> = {}
  public urls2: Record<string, string> = {}
  public editPermission = false
  public tableActions: Action[] = []
  public rowActions: DataAction[] = []
  public defaultSortDirection = DataSortDirection.ASCENDING
  public privateBookmarkScope = BookmarkScopeEnum.Private

  constructor(
    @Inject(LOCALE_ID) public readonly locale: string,
    public readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly store: Store,
    private readonly user: UserService,
    private readonly workspaceService: WorkspaceService
  ) {
    if (this.user.hasPermission('BOOKMARK#EDIT')) this.editPermission = true
    this.tableActions = [
      {
        labelKey: 'ACTIONS.EXPORT',
        titleKey: 'ACTIONS.EXPORT.TOOLTIP',
        icon: PrimeIcons.DOWNLOAD,
        show: 'always',
        permission: 'BOOKMARK#EXPORT',
        actionCallback: () => this.exportItems()
      }
    ]
    /**
     * Table row actions
     */
    this.rowActions = [
      /*      {
        id: 'action_link',
        labelKey: 'ACTIONS.NAVIGATION.GOTO',
        icon: PrimeIcons.LINK,
        permission: 'BOOKMARK#VIEW',
        callback: (event) => this.router.navigate([this.getUrl(event)])
      },*/
      {
        id: 'action_view',
        labelKey: this.editPermission ? 'ACTIONS.EDIT.TOOLTIP' : 'ACTIONS.VIEW.TOOLTIP',
        icon: this.editPermission ? PrimeIcons.PENCIL : PrimeIcons.EYE,
        permission: this.editPermission ? 'BOOKMARK#EDIT' : 'BOOKMARK#VIEW',
        callback: (event) => this.onDetail(event)
      },
      /*      {
        id: 'action_copy',
        labelKey: 'ACTIONS.COPY.TOOLTIP',
        icon: PrimeIcons.COPY,
        permission: 'BOOKMARK#CREATE',
        callback: (event) => this.onCopy(event)
      },*/
      /*      {
        id: 'action_up',
        labelKey: 'ACTIONS.EDIT.UP',
        icon: PrimeIcons.ARROW_UP,
        permission: 'BOOKMARK#EDIT',
        callback: (event) => this.onUp(event)
      },
      {
        id: 'action_down',
        labelKey: 'ACTIONS.EDIT.DOWN',
        icon: PrimeIcons.ARROW_DOWN,
        permission: 'BOOKMARK#EDIT',
        callback: (event) => this.onDown(event)
      },*/
      {
        id: 'action_delete',
        labelKey: 'ACTIONS.DELETE.TOOLTIP',
        icon: PrimeIcons.TRASH,
        classes: ['danger-action-text'],
        permission: 'BOOKMARK#DELETE',
        callback: (event) => this.onDelete(event)
      }
    ]
  }

  ngOnInit() {
    this.search()
  }

  ngAfterViewInit() {
    fromEvent<KeyboardEvent>(this.bookmarkFilter?.nativeElement, 'keyup')
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((event: KeyboardEvent) => this.onFilterBookmarks(event))
  }

  /**
   * UI Events
   */
  public onResetFilter(ev: MouseEvent): void {
    ev.stopPropagation()
    if (this.bookmarkFilter) {
      this.bookmarkFilter.nativeElement.value = ''
      this.store.dispatch(BookmarksSearchActions.bookmarkFilterChanged({ bookmarkFilter: '' }))
    }
  }

  public onUp(data: Bookmark): void {
    console.log('onUp', data)
  }
  public onDown(data: Bookmark): void {
    console.log('onUp', data)
  }
  public onNavigate(data: Bookmark): void {
    console.log('onNavigate', data)
    this.router.navigate([''])

    // [routerLink]="getUrl(item) | async"
    // this.router.navigate(['./', data., 'menu'], { relativeTo: this.route })
  }
  public onDetail(data: Bookmark): void {
    this.store.dispatch(BookmarksSearchActions.editBookmarksButtonClicked({ id: data.id }))
  }
  public onCopy(data: Bookmark): void {
    console.log('onCopy', data)
  }
  public onDelete(data: Bookmark): void {
    this.store.dispatch(BookmarksSearchActions.deleteBookmarksButtonClicked({ id: data.id }))
  }

  public prepareUrlPath(url?: string, path?: string): string {
    if (url && path) return Location.joinWithSlash(url, path)
    else if (url) return url
    else return ''
  }

  search() {
    this.store.dispatch(BookmarksSearchActions.searchTriggered())
  }

  exportItems() {
    this.store.dispatch(BookmarksSearchActions.exportButtonClicked())
  }

  public onFilterBookmarks(event: Event): void {
    const bookmarkFilter = (event.target as HTMLInputElement)?.value ?? ''
    this.store.dispatch(BookmarksSearchActions.bookmarkFilterChanged({ bookmarkFilter }))
  }

  public getUrl(bookmark: Bookmark) {
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
