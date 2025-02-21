import { Component, ElementRef, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Observable, debounceTime, distinctUntilChanged, fromEvent, map } from 'rxjs'
import { Store } from '@ngrx/store'
import { PrimeIcons, SelectItem } from 'primeng/api'
import { Table } from 'primeng/table'

import { UserService, WorkspaceService } from '@onecx/angular-integration-interface'
import {
  Action,
  Column,
  DataAction,
  DataSortDirection,
  DataViewControlTranslations
} from '@onecx/portal-integration-angular'

import { Bookmark } from 'src/app/shared/generated'
import { limitText } from 'src/app/shared/utils/utils'

import { BookmarkSearchActions } from './bookmark-search.actions'
import { BookmarkSearchViewModel } from './bookmark-search.viewmodel'
import { selectBookmarkSearchViewModel } from './bookmark-search.selectors'
import { bookmarkColumns } from './bookmark-search.columns'

export type ExtendedSelectItem = SelectItem & { title_key: string }

@Component({
  selector: 'app-bookmark-search',
  templateUrl: './bookmark-search.component.html',
  styleUrls: ['./bookmark-search.component.scss']
})
export class BookmarkSearchComponent implements OnInit {
  // data
  public viewModel$: Observable<BookmarkSearchViewModel> = this.store.select(selectBookmarkSearchViewModel)
  public urls: Record<string, Observable<string>> = {}
  private readonly myPermissions: string[] = [] // permissions of the user
  public pageActions: Action[] = []
  public tableActions: Action[] = []
  public rowActions: DataAction[] = []
  public defaultSortDirection = DataSortDirection.ASCENDING
  public filteredColumns: Column[] = []
  public bookmarkColumns = bookmarkColumns
  public limitText = limitText
  public quickFilterItems$: Observable<SelectItem[]> | undefined

  @ViewChild('dataTable', { static: false }) dataTable: Table | undefined
  public dataViewControlsTranslations: DataViewControlTranslations = {}

  @ViewChild('bookmarkFilter') bookmarkFilter: ElementRef | undefined
  private filterInit = false
  public quickFilterOptions: ExtendedSelectItem[] = [
    { label: 'BOOKMARK.SCOPES.PRIVATE', title_key: 'BOOKMARK.SCOPES.TOOLTIPS.PRIVATE', value: 'PRIVATE' },
    { label: 'BOOKMARK.SCOPES.PUBLIC', title_key: 'BOOKMARK.SCOPES.TOOLTIPS.PUBLIC', value: 'PUBLIC' }
  ]
  public quickFilterValue = this.quickFilterOptions[0].value

  constructor(
    @Inject(LOCALE_ID) public readonly locale: string,
    public readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly store: Store,
    private readonly user: UserService,
    private readonly translate: TranslateService,
    private readonly workspaceService: WorkspaceService
  ) {
    // simplify permission checks
    if (this.user.hasPermission('BOOKMARK#EDIT')) this.myPermissions.push('BOOKMARK#EDIT')
    if (this.user.hasPermission('BOOKMARK#ADMIN_EDIT')) this.myPermissions.push('BOOKMARK#ADMIN_EDIT')
    if (this.user.hasPermission('BOOKMARK#ADMIN_DELETE')) this.myPermissions.push('BOOKMARK#ADMIN_DELETE')

    this.filteredColumns = bookmarkColumns.filter((a) => a.active === true)
    this.tableActions = [
      {
        labelKey: 'ACTIONS.EXPORT',
        titleKey: 'ACTIONS.EXPORT.TOOLTIP',
        icon: PrimeIcons.DOWNLOAD,
        show: 'always',
        permission: 'BOOKMARK#EXPORT',
        actionCallback: () => this.onExport()
      }
    ]
    this.viewModel$.subscribe({
      next: (vm) => {
        const a = vm?.results?.filter((b) => b['scope'] === this.quickFilterValue)
        this.pageActions = this.preparePageActions(a.length > 1)
      }
    })
  }

  public ngOnInit() {
    this.prepareDialogTranslations()
    this.prepareRowActionButtons(this.quickFilterValue)
    this.onSearch()
  }

  /**
   * DIALOG preparation
   */
  private prepareDialogTranslations(): void {
    this.translate
      .get(['DIALOG.DATAVIEW.FILTER', 'DIALOG.DATAVIEW.FILTER_BY', 'BOOKMARK.DISPLAY_NAME'])
      .pipe(
        map((data) => {
          this.dataViewControlsTranslations = {
            filterInputPlaceholder: data['DIALOG.DATAVIEW.FILTER'],
            filterInputTooltip: data['DIALOG.DATAVIEW.FILTER_BY'] + data['BOOKMARK.DISPLAY_NAME']
          }
        })
      )
      .subscribe()
  }
  private preparePageActions(dataExists: boolean): Action[] {
    if (!dataExists) return []
    return [
      {
        labelKey: 'ACTIONS.SORT.LABEL',
        titleKey: 'ACTIONS.SORT.TOOLTIP',
        icon: PrimeIcons.SORT,
        show: 'always',
        permission: 'BOOKMARK#EDIT',
        actionCallback: () => this.onSortDialog()
      },
      {
        labelKey: 'ACTIONS.EXPORT.LABEL',
        titleKey: 'ACTIONS.EXPORT.TOOLTIP',
        icon: PrimeIcons.DOWNLOAD,
        show: 'always',
        permission: 'BOOKMARK#EXPORT',
        actionCallback: () => this.onExport()
      },
      {
        labelKey: 'ACTIONS.IMPORT.LABEL',
        titleKey: 'ACTIONS.IMPORT.TOOLTIP',
        icon: PrimeIcons.UPLOAD,
        show: 'always',
        permission: 'BOOKMARK#IMPORT',
        actionCallback: () => this.onImport()
      },
      {
        labelKey: 'ACTIONS.CREATE.LABEL',
        titleKey: 'ACTIONS.CREATE.TOOLTIP',
        icon: PrimeIcons.PLUS,
        show: 'asOverflow',
        permission: 'BOOKMARK#CREATE',
        actionCallback: () => this.onCreate()
      }
    ]
  }

  /*
  public hasPermissions(scope: BookmarkScope, perm: string) {
    let hasPerm = false
    if (scope === BookmarkScope.Private) {
      hasPerm = this.user.hasPermission(perm)
    }
    if (scope === BookmarkScope.Public) {
      hasPerm = this.user.hasPermission('ADMIN_' + perm)
    }
    return hasPerm
  }
    */

  /**
   * UI Events
   */
  public onSearch() {
    this.store.dispatch(BookmarkSearchActions.search())
  }
  public onExport() {
    this.store.dispatch(BookmarkSearchActions.exportBookmarks())
  }
  public onImport() {
    this.store.dispatch(BookmarkSearchActions.importBookmarks())
  }
  public onSortDialog() {
    this.store.dispatch(BookmarkSearchActions.openSortingDialog())
  }

  public onQuickFilterChange(scopeQuickFilter: string): void {
    this.prepareRowActionButtons(scopeQuickFilter)
    this.store.dispatch(BookmarkSearchActions.scopeQuickFilterChanged({ scopeQuickFilter: scopeQuickFilter }))
  }
  public onColumnsChange(activeIds: string[]) {
    this.filteredColumns = activeIds.map((id) => bookmarkColumns.find((col) => col.field === id)) as Column[]
  }
  public onFilterChange(event: string): void {
    this.dataTable?.filterGlobal(event, 'contains')
  }

  /* TODO: remove extra filter? */
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

  public onNavigate(data: Bookmark): void {
    console.log('onNavigate', data)
    this.router.navigate([''])
    // [routerLink]="getUrl(item) | async"
    // this.router.navigate(['./', data., 'menu'], { relativeTo: this.route })
  }

  public onDetail(data: Bookmark): void {
    this.store.dispatch(BookmarkSearchActions.viewOrEditBookmark({ id: data.id }))
  }
  public onCreate() {
    this.store.dispatch(BookmarkSearchActions.createBookmark())
  }
  public onCopy(data: Bookmark): void {
    this.store.dispatch(BookmarkSearchActions.copyBookmark({ id: data.id }))
  }
  public onDelete(data: Bookmark): void {
    this.store.dispatch(BookmarkSearchActions.openDeleteDialog({ id: data.id }))
  }

  /**
   * URL preparation
   */
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
  public prepareUrlBookmarkLink(url: string | null, b: Bookmark): string {
    if (!url) return ''
    const q = new URLSearchParams(b.query).toString()
    return url + (q ? '?' + q : '') + (b.fragment ? '#' + b.fragment : '')
  }

  /**
   * Table row actions
   * prepare row action buttons according to selected scope: PRIVATE, PUBLIC
   * filter value: BOOKMARK.SCOPES.[ PUBLIC | PUBLIC ]
   */
  private prepareRowActionButtons(filter: string): void {
    const prefix = filter.includes('PUBLIC') ? 'ADMIN_' : ''
    const editPermission = this.user.hasPermission('BOOKMARK#' + prefix + 'EDIT')
    this.rowActions = [
      {
        id: 'action_detail',
        labelKey: editPermission ? 'ACTIONS.EDIT.LABEL' : 'ACTIONS.VIEW.LABEL',
        icon: editPermission ? PrimeIcons.PENCIL : PrimeIcons.EYE,
        permission: editPermission ? 'BOOKMARK#' + prefix + 'EDIT' : 'BOOKMARK#VIEW',
        callback: (data) => this.onDetail(data)
      },
      {
        id: 'action_copy',
        labelKey: 'ACTIONS.COPY.LABEL',
        icon: PrimeIcons.COPY,
        permission: 'BOOKMARK#CREATE',
        callback: (data) => this.onCopy(data)
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
}
