import { Component, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Observable, map } from 'rxjs'
import { Store } from '@ngrx/store'
import { PrimeIcons, SelectItem } from 'primeng/api'
import { Table } from 'primeng/table'

import { UserService, WorkspaceService } from '@onecx/angular-integration-interface'
import { Action, DataAction } from '@onecx/angular-accelerator'
import { Column, DataSortDirection, DataViewControlTranslations } from '@onecx/portal-integration-angular'

import { Bookmark, BookmarkScope } from 'src/app/shared/generated'
import { limitText } from 'src/app/shared/utils/utils'

import { BookmarkConfigureActions } from './bookmark-configure.actions'
import { BookmarkConfigureViewModel } from './bookmark-configure.viewmodel'
import { selectBookmarkConfigureViewModel } from './bookmark-configure.selectors'
import { bookmarkColumns } from './bookmark-configure.columns'

export type ExtendedSelectItem = SelectItem & { title_key: string }

@Component({
  selector: 'app-bookmark-configure',
  templateUrl: './bookmark-configure.component.html',
  styleUrls: ['./bookmark-configure.component.scss']
})
export class BookmarkConfigureComponent implements OnInit {
  // data
  public viewModel$: Observable<BookmarkConfigureViewModel> = this.store.select(selectBookmarkConfigureViewModel)
  public urls: Record<string, Observable<string>> = {}
  public pageActions: Action[] = []
  public rowActions: DataAction[] = []
  public defaultSortDirection = DataSortDirection.ASCENDING
  public filteredColumns: Column[] = []
  public bookmarkColumns = bookmarkColumns
  public limitText = limitText
  public editable = false
  public quickFilterItems$: Observable<SelectItem[]> | undefined

  @ViewChild('dataTable', { static: false }) dataTable: Table | undefined
  public dataViewControlsTranslations$: Observable<DataViewControlTranslations> | undefined
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
    this.editable = this.user.hasPermission('BOOKMARK#EDIT') || this.user.hasPermission('BOOKMARK#ADMIN_EDIT')
    this.filteredColumns = bookmarkColumns.filter((a) => a.active === true)
    this.viewModel$.subscribe({
      next: (vm) => {
        const a = vm.results.filter((b) => b['scope'] === this.quickFilterValue)
        this.pageActions = this.preparePageActions(a.length > 1, this.quickFilterValue)
      }
    })
  }

  public ngOnInit() {
    this.prepareDialogTranslations()
    this.onSearch()
  }

  /**
   * DIALOG preparation
   */
  public canEdit(scope: BookmarkScope): boolean {
    return (
      (scope === BookmarkScope.Public && this.user.hasPermission('BOOKMARK#ADMIN_EDIT')) ||
      (scope === BookmarkScope.Private && this.user.hasPermission('BOOKMARK#EDIT'))
    )
  }
  public canDelete(scope: BookmarkScope): boolean {
    return (
      (scope === BookmarkScope.Public && this.user.hasPermission('BOOKMARK#ADMIN_DELETE')) ||
      (scope === BookmarkScope.Private && this.user.hasPermission('BOOKMARK#DELETE'))
    )
  }

  private prepareDialogTranslations(): void {
    this.dataViewControlsTranslations$ = this.translate
      .get(['DIALOG.DATAVIEW.FILTER', 'DIALOG.DATAVIEW.FILTER_BY', 'BOOKMARK.DISPLAY_NAME'])
      .pipe(
        map((data) => {
          return {
            filterInputPlaceholder: data['DIALOG.DATAVIEW.FILTER'],
            filterInputTooltip: data['DIALOG.DATAVIEW.FILTER_BY'] + data['BOOKMARK.DISPLAY_NAME']
          } as DataViewControlTranslations
        })
      )
  }
  private preparePageActions(dataExists: boolean, scope: BookmarkScope): Action[] {
    if (!dataExists) return []
    const perm = 'BOOKMARK#' + (scope === BookmarkScope.Public ? 'ADMIN_' : '') + 'EDIT'
    return [
      {
        labelKey: 'ACTIONS.NAVIGATION.BACK',
        titleKey: 'ACTIONS.NAVIGATION.BACK.TOOLTIP',
        icon: PrimeIcons.ARROW_LEFT,
        show: 'always',
        actionCallback: () => this.onBack()
      },
      {
        labelKey: 'ACTIONS.SORT.LABEL',
        titleKey: 'ACTIONS.SORT.TOOLTIP',
        icon: PrimeIcons.SORT,
        show: 'always',
        permission: perm,
        actionCallback: () => this.onSortDialog()
      },
      {
        labelKey: 'ACTIONS.EXPORT.LABEL',
        titleKey: 'ACTIONS.EXPORT.TOOLTIP',
        icon: PrimeIcons.DOWNLOAD,
        show: 'asOverflow',
        permission: 'BOOKMARK#EXPORT',
        actionCallback: () => this.onExport()
      },
      {
        labelKey: 'ACTIONS.IMPORT.LABEL',
        titleKey: 'ACTIONS.IMPORT.TOOLTIP',
        icon: PrimeIcons.UPLOAD,
        show: 'asOverflow',
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

  /**
   * UI Events
   */
  public onBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route })
  }
  public onSearch(): void {
    this.store.dispatch(BookmarkConfigureActions.search())
  }
  public onExport(): void {
    this.store.dispatch(BookmarkConfigureActions.exportBookmarks())
  }
  public onImport(): void {
    this.store.dispatch(BookmarkConfigureActions.importBookmarks())
  }
  public onSortDialog(): void {
    this.store.dispatch(BookmarkConfigureActions.openSortingDialog())
  }

  public onColumnsChange(activeIds: string[]): void {
    this.filteredColumns = activeIds.map((id) => bookmarkColumns.find((col) => col.field === id)) as Column[]
  }
  public onQuickFilterChange(scopeQuickFilter: string): void {
    this.store.dispatch(BookmarkConfigureActions.scopeQuickFilterChanged({ scopeQuickFilter: scopeQuickFilter }))
  }
  public onFilterChange(event: string): void {
    this.dataTable?.filterGlobal(event, 'contains')
  }

  public onDetail(data: Bookmark): void {
    this.store.dispatch(BookmarkConfigureActions.viewOrEditBookmark({ id: data.id }))
  }
  public onCreate() {
    this.store.dispatch(BookmarkConfigureActions.createBookmark())
  }
  public onCopy(data: Bookmark): void {
    this.store.dispatch(BookmarkConfigureActions.copyBookmark({ id: data.id }))
  }
  public onDelete(data: Bookmark): void {
    this.store.dispatch(BookmarkConfigureActions.openDeleteDialog({ id: data.id }))
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
}
