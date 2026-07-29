import { Component, DestroyRef, inject, LOCALE_ID, OnInit } from '@angular/core'
import { AsyncPipe, NgClass } from '@angular/common'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { Observable } from 'rxjs'
import { Store } from '@ngrx/store'
import { TranslateModule } from '@ngx-translate/core'

import { PrimeIcons, SelectItem } from 'primeng/api'
import { ButtonModule } from 'primeng/button'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputGroupAddonModule } from 'primeng/inputgroupaddon'
import { InputGroupModule } from 'primeng/inputgroup'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { SelectButtonModule } from 'primeng/selectbutton'
import { TooltipModule } from 'primeng/tooltip'

import { AngularAuthModule } from '@onecx/angular-auth'
import { UserService, WorkspaceService } from '@onecx/angular-integration-interface'
import { PortalPageComponent } from '@onecx/angular-utils'
import {
  Action,
  AngularAcceleratorModule,
  ColumnType,
  DataSortDirection,
  DataTableColumn,
  Filter,
  RowListGridData,
  Sort
} from '@onecx/angular-accelerator'

import { Bookmark, BookmarkScope } from 'src/app/shared/generated'
import { Utils } from 'src/app/shared/utils/utils'

import { BookmarkConfigureActions } from './bookmark-configure.actions'
import { bookmarkColumns, ExtendedColumn } from './bookmark-configure.columns'
import { BookmarkConfigureViewModel } from './bookmark-configure.viewmodel'
import { selectBookmarkConfigureViewModel } from './bookmark-configure.selectors'

export type ExtendedSelectItem = SelectItem & { title_key: string }

type BookmarkTableRow = Bookmark & {
  imagePath: string
  canEditAction: boolean
  canDeleteAction: boolean
  showEnabledStateAction: boolean
  showDisabledStateAction: boolean
  [columnId: string]: unknown
}

@Component({
  selector: 'app-bookmark-configure',
  templateUrl: './bookmark-configure.component.html',
  styleUrls: ['./bookmark-configure.component.scss'],
  standalone: true,
  imports: [
    AngularAcceleratorModule,
    AngularAuthModule,
    AsyncPipe,
    NgClass,
    ButtonModule,
    FloatLabelModule,
    FormsModule,
    InputGroupAddonModule,
    InputGroupModule,
    InputTextModule,
    MessageModule,
    PortalPageComponent,
    RouterModule,
    SelectButtonModule,
    TooltipModule,
    TranslateModule
  ]
})
export class BookmarkConfigureComponent implements OnInit {
  public readonly locale = inject(LOCALE_ID)
  public readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly store = inject(Store)
  private readonly user = inject(UserService)
  private readonly workspaceService = inject(WorkspaceService)
  private readonly destroyRef = inject(DestroyRef)

  // data
  public viewModel$: Observable<BookmarkConfigureViewModel> = this.store.select(selectBookmarkConfigureViewModel)
  public interactiveRows: BookmarkTableRow[] = []
  private allInteractiveRows: BookmarkTableRow[] = []
  private latestRows: RowListGridData[] = []
  public urls: Record<string, Observable<string>> = {}
  public pageActions: Action[] = []
  public defaultSortDirection = DataSortDirection.ASCENDING
  public sortField = 'position'
  public tableFilters: Filter[] = []
  public globalFilterValue = ''
  public interactiveColumns: DataTableColumn[] = []
  public displayedColumnKeys: string[] = []
  public filteredColumns: ExtendedColumn[] = []
  public bookmarkColumns = bookmarkColumns
  public limitText = Utils.limitText
  public editable = false
  private permEdit = false
  private permAdminEdit = false
  private permDelete = false
  private permAdminDelete = false
  public quickFilterItems$: Observable<SelectItem[]> | undefined

  public quickFilterOptions: ExtendedSelectItem[] = [
    { label: 'BOOKMARK.SCOPES.PRIVATE', title_key: 'BOOKMARK.SCOPES.TOOLTIPS.PRIVATE', value: BookmarkScope.Private },
    { label: 'BOOKMARK.SCOPES.PUBLIC', title_key: 'BOOKMARK.SCOPES.TOOLTIPS.PUBLIC', value: BookmarkScope.Public }
  ]
  public quickFilterValue: BookmarkScope = BookmarkScope.Private

  constructor() {
    this.filteredColumns = bookmarkColumns.filter((a) => a.active === true)
    this.syncInteractiveColumns()
    this.viewModel$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (vm) => {
        this.latestRows = vm.results
        this.refreshInteractiveRows()
        const a = vm.results.filter((b) => b['scope'] === this.quickFilterValue)
        this.pageActions = this.preparePageActions(a.length > 1, this.quickFilterValue)
      }
    })
  }

  public ngOnInit() {
    this.resolvePermissions()
    this.onSearch()
  }

  private resolvePermissions(): void {
    Promise.all([
      this.user.hasPermission('BOOKMARK#EDIT'),
      this.user.hasPermission('BOOKMARK#ADMIN_EDIT'),
      this.user.hasPermission('BOOKMARK#DELETE'),
      this.user.hasPermission('BOOKMARK#ADMIN_DELETE')
    ]).then(([permEdit, permAdminEdit, permDelete, permAdminDelete]) => {
      this.permEdit = permEdit
      this.permAdminEdit = permAdminEdit
      this.permDelete = permDelete
      this.permAdminDelete = permAdminDelete
      this.editable = permEdit || permAdminEdit
      this.refreshInteractiveRows()
    })
  }

  /**
   * DIALOG preparation
   */
  public canEdit(scope: BookmarkScope): boolean {
    return (scope === BookmarkScope.Public && this.permAdminEdit) || (scope === BookmarkScope.Private && this.permEdit)
  }
  public canDelete(scope: BookmarkScope): boolean {
    return (
      (scope === BookmarkScope.Public && this.permAdminDelete) || (scope === BookmarkScope.Private && this.permDelete)
    )
  }

  private preparePageActions(dataExists: boolean, scope: BookmarkScope): Action[] {
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
        conditional: true,
        showCondition: dataExists,
        actionCallback: () => this.onSortDialog()
      },
      {
        labelKey: 'ACTIONS.EXPORT.LABEL',
        titleKey: 'ACTIONS.EXPORT.TOOLTIP',
        icon: PrimeIcons.DOWNLOAD,
        show: 'asOverflow',
        permission: 'BOOKMARK#EXPORT',
        conditional: true,
        showCondition: dataExists,
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
    this.filteredColumns = activeIds
      .map((id) => bookmarkColumns.find((col) => col.field === id))
      .filter((col): col is ExtendedColumn => !!col)
    this.syncInteractiveColumns()
  }
  public onQuickFilterChange(scopeQuickFilter: string): void {
    this.store.dispatch(BookmarkConfigureActions.scopeQuickFilterChanged({ scopeQuickFilter: scopeQuickFilter }))
  }
  public onFilterChange(event: Filter[]): void {
    this.tableFilters = event
  }

  public onGlobalFilter(value: string): void {
    this.globalFilterValue = value
    this.applyNameFilter()
  }

  public onClearGlobalFilter(): void {
    this.globalFilterValue = ''
    this.applyNameFilter()
  }
  public onSortChange(event: Sort): void {
    this.sortField = event.sortColumn
    this.defaultSortDirection = event.sortDirection
  }
  public onDataViewChange(layout: 'list' | 'grid' | 'table'): void {
    if (layout !== 'table') {
      return
    }
  }

  public onToggleDisable(data: Bookmark): void {
    this.store.dispatch(BookmarkConfigureActions.toggleBookmark({ id: data.id }))
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

  private syncInteractiveColumns(): void {
    const bookmarkDataColumns = this.filteredColumns.map((column) => ({
      id: column.field,
      nameKey: `${column.translationPrefix}.${column.header}`,
      tooltipKey: this.getColumnTooltipKey(column.field, column),
      columnType: this.getColumnType(column.field),
      sortable: !!column.sort,
      filterable: !!column.hasFilter
    }))

    this.interactiveColumns = [
      {
        id: 'actions',
        nameKey: 'ACTIONS.LABEL',
        tooltipKey: 'ACTIONS.TOOLTIP',
        columnType: ColumnType.STRING,
        sortable: false,
        filterable: false
      },
      ...bookmarkDataColumns
    ]
    this.displayedColumnKeys = this.interactiveColumns.map((column) => column.id)
  }

  private getColumnType(field: string): ColumnType {
    if (field === 'position') {
      return ColumnType.NUMBER
    }

    return ColumnType.STRING
  }

  private getColumnTooltipKey(field: string, column: ExtendedColumn): string {
    if (field === 'external') {
      return 'BOOKMARK.TOOLTIPS.EXTERNAL.CONFIG'
    }

    if (field === 'target') {
      return 'BOOKMARK.TOOLTIPS.TARGET.CONFIG'
    }

    return `${column.translationPrefix}.TOOLTIPS.${column.header}`
  }

  private mapInteractiveRow(bookmarkRow: RowListGridData): BookmarkTableRow {
    const bookmark = this.toBookmark(bookmarkRow)
    const canEditAction = this.canEdit(bookmark.scope)
    const displayNameLower = (bookmark.displayName ?? '').toLocaleLowerCase(this.locale)

    return {
      ...bookmark,
      imagePath: '',
      displayNameLower,
      canEditAction,
      canDeleteAction: this.canDelete(bookmark.scope),
      showEnabledStateAction: canEditAction && !bookmark.disabled,
      showDisabledStateAction: canEditAction && !!bookmark.disabled
    }
  }

  private refreshInteractiveRows(): void {
    this.allInteractiveRows = this.latestRows.map((bookmarkRow) => this.mapInteractiveRow(bookmarkRow))
    this.applyNameFilter()
  }

  private toBookmark(data: unknown): Bookmark {
    return data as Bookmark
  }

  private applyNameFilter(): void {
    const normalizedQuery = this.globalFilterValue.trim().toLocaleLowerCase(this.locale)
    if (!normalizedQuery) {
      this.interactiveRows = this.allInteractiveRows
      return
    }

    // Keep original row object references; only the containing array is rebuilt.
    this.interactiveRows = this.allInteractiveRows.filter((row) => {
      const rowName = (row['displayNameLower'] as string | undefined) ?? ''
      return rowName.includes(normalizedQuery)
    })
  }
}
