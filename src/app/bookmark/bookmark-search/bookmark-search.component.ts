import { Component, ElementRef, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Observable, debounceTime, distinctUntilChanged, fromEvent } from 'rxjs'
import { Store } from '@ngrx/store'
import { PrimeIcons, SelectItem } from 'primeng/api'

import { UserService, WorkspaceService } from '@onecx/angular-integration-interface'
import { Action, DataAction, DataSortDirection } from '@onecx/portal-integration-angular'

import { Bookmark, BookmarkScopeEnum } from 'src/app/shared/generated'

import { BookmarkSearchActions } from './bookmark-search.actions'
import { BookmarkSearchViewModel } from './bookmark-search.viewmodel'
import { selectBookmarkSearchViewModel } from './bookmark-search.selectors'

@Component({
  selector: 'app-bookmark-search',
  templateUrl: './bookmark-search.component.html',
  styleUrls: ['./bookmark-search.component.scss']
})
export class BookmarkSearchComponent implements OnInit {
  @ViewChild('bookmarkFilter') bookmarkFilter: ElementRef | undefined
  public viewModel$: Observable<BookmarkSearchViewModel> = this.store.select(selectBookmarkSearchViewModel)
  public urls: Record<string, Observable<string>> = {}
  public urls2: Record<string, string> = {}
  public actions: Action[] = []
  public tableActions: Action[] = []
  public rowActions: DataAction[] = []
  private filterInit = false
  public quickFilterOptions: SelectItem[] = [{ value: 'BOOKMARK.SCOPES.PRIVATE' }, { value: 'BOOKMARK.SCOPES.PUBLIC' }]
  public quickFilterValue = this.quickFilterOptions[0].value
  public defaultSortDirection = DataSortDirection.ASCENDING
  public privateBookmarkScope = BookmarkScopeEnum.Private
  private myPermissions = new Array<string>() // permissions of the user

  constructor(
    @Inject(LOCALE_ID) public readonly locale: string,
    public readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly store: Store,
    private readonly user: UserService,
    private readonly workspaceService: WorkspaceService
  ) {
    // simplify permission checks
    if (this.user.hasPermission('BOOKMARK#EDIT')) this.myPermissions.push('BOOKMARK#EDIT')
    if (this.user.hasPermission('BOOKMARK#ADMIN_EDIT')) this.myPermissions.push('BOOKMARK#ADMIN_EDIT')
    if (this.user.hasPermission('BOOKMARK#ADMIN_DELETE')) this.myPermissions.push('BOOKMARK#ADMIN_DELETE')

    this.tableActions = [
      {
        labelKey: 'ACTIONS.EXPORT',
        titleKey: 'ACTIONS.EXPORT.TOOLTIP',
        icon: PrimeIcons.DOWNLOAD,
        show: 'always',
        permission: 'BOOKMARK#EXPORT',
        actionCallback: () => this.onExportItems()
      }
    ]
    this.prepareActionButtons(this.quickFilterValue)
    this.actions = this.preparePageActions()
  }

  public preparePageActions(): Action[] {
    return [
      {
        labelKey: 'ACTIONS.SORT.LABEL',
        titleKey: 'ACTIONS.SORT.TOOLTIP',
        icon: PrimeIcons.SORT,
        show: 'always',
        permission: 'BOOKMARK#EDIT',
        //conditional: true,
        //showCondition: vm.results?.length > 0,
        actionCallback: () => this.onSortDialog()
      }
    ]
  }
  /**
   * Table row actions
   * prepare row action buttons according to selected scope: PRIVATE, PUBLIC
   * filter value: BOOKMARK.SCOPES.[ PUBLIC | PUBLIC ]
   */
  private prepareActionButtons(filter: string): void {
    const prefix = filter.includes('PUBLIC') ? 'ADMIN_' : ''
    const editPermission = this.user.hasPermission('BOOKMARK#' + prefix + 'EDIT')
    this.rowActions = [
      /*      {
        id: 'action_link',
        labelKey: 'ACTIONS.NAVIGATION.GOTO',
        icon: PrimeIcons.LINK,
        permission: 'BOOKMARK#VIEW',
        callback: (event) => this.router.navigate([this.getUrl(event)])
      },*/
      {
        id: 'action_detail',
        labelKey: editPermission ? 'ACTIONS.EDIT.LABEL' : 'ACTIONS.VIEW.LABEL',
        icon: editPermission ? PrimeIcons.PENCIL : PrimeIcons.EYE,
        permission: editPermission ? 'BOOKMARK#' + prefix + 'EDIT' : 'BOOKMARK#VIEW',
        callback: (data) => this.onDetail(editPermission ? 'EDIT' : 'VIEW', data)
      },
      {
        id: 'action_delete',
        labelKey: 'ACTIONS.DELETE.LABEL',
        icon: PrimeIcons.TRASH,
        classes: ['danger-action-text'],
        permission: 'BOOKMARK#' + prefix + 'DELETE',
        callback: (data) => this.onDelete(data)
      }
    ]
  }

  public ngOnInit() {
    this.onSearch()
  }

  public hasPermissions(scope: BookmarkScopeEnum, perm: string) {
    let hasPerm = false
    if (scope === BookmarkScopeEnum.Private) {
      hasPerm = this.user.hasPermission(perm)
    }
    if (scope === BookmarkScopeEnum.Public) {
      hasPerm = this.user.hasPermission('ADMIN_' + perm)
    }
    return hasPerm
  }

  /**
   * UI Events
   */
  public onSearch() {
    this.store.dispatch(BookmarkSearchActions.search())
  }
  public onSortDialog() {
    this.store.dispatch(BookmarkSearchActions.openSortingDialog())
  }
  public onExportItems() {
    this.store.dispatch(BookmarkSearchActions.exportButtonClicked())
  }

  public onFocusFilter() {
    if (!this.filterInit) {
      this.filterInit = true
      fromEvent<KeyboardEvent>(this.bookmarkFilter?.nativeElement, 'keyup')
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe((event: KeyboardEvent) => this.onFilterBookmarks(event))
    }
  }
  public onFilterBookmarks(event: Event): void {
    const bookmarkFilter = (event.target as HTMLInputElement)?.value ?? ''
    this.store.dispatch(BookmarkSearchActions.bookmarkFilterChanged({ bookmarkFilter }))
  }
  public onResetFilter(ev: MouseEvent): void {
    ev.stopPropagation()
    if (this.bookmarkFilter) {
      this.bookmarkFilter.nativeElement.value = ''
      this.store.dispatch(BookmarkSearchActions.bookmarkFilterChanged({ bookmarkFilter: '' }))
    }
  }
  public onQuickFilterChange(scopeQuickFilter: string): void {
    this.prepareActionButtons(scopeQuickFilter)
    this.store.dispatch(BookmarkSearchActions.scopeQuickFilterChanged({ scopeQuickFilter: scopeQuickFilter }))
  }

  public onNavigate(data: Bookmark): void {
    console.log('onNavigate', data)
    this.router.navigate([''])
    // [routerLink]="getUrl(item) | async"
    // this.router.navigate(['./', data., 'menu'], { relativeTo: this.route })
  }

  public onDetail(mode: string, data: Bookmark): void {
    this.store.dispatch(BookmarkSearchActions.openDetailDialog({ id: data.id }))
  }
  public onCopy(data: Bookmark): void {
    console.log('onCopy', data)
  }
  public onDelete(data: Bookmark): void {
    this.store.dispatch(BookmarkSearchActions.openDeleteDialog({ id: data.id }))
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
