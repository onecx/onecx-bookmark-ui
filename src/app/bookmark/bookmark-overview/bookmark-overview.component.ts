import { Component, EventEmitter, Inject, LOCALE_ID, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, Observable, map, of } from 'rxjs'
import { Store } from '@ngrx/store'
import { MenuItem, PrimeIcons } from 'primeng/api'

import { Workspace } from '@onecx/integration-interface'
import { Action, UserProfile } from '@onecx/portal-integration-angular'
import { AppStateService, UserService, WorkspaceService } from '@onecx/angular-integration-interface'
import { SlotService } from '@onecx/angular-remote-components'

import { Bookmark, BookmarkScope } from 'src/app/shared/generated'

import { BookmarkOverviewActions } from './bookmark-overview.actions'
import { BookmarkOverviewViewModel } from './bookmark-overview.viewmodel'
import { selectBookmarkOverviewViewModel } from './bookmark-overview.selectors'

export type Product = {
  name: string
  displayName: string
  imageUrl?: string
}

@Component({
  selector: 'app-bookmark-overview',
  templateUrl: './bookmark-overview.component.html',
  styleUrls: ['./bookmark-overview.component.scss']
})
export class BookmarkOverviewComponent implements OnInit {
  // data
  public viewModel$: Observable<BookmarkOverviewViewModel> = this.store.select(selectBookmarkOverviewViewModel)
  public pageActions: Action[] = []
  public BookmarkScope = BookmarkScope
  public hasEditPermissions = false
  public dockItems$: Observable<MenuItem[]> = of([])

  // data
  public user$: Observable<UserProfile>
  public workspace: Workspace | undefined
  // slot configuration: get product data
  public slotName = 'onecx-product-data'
  public isProductComponentDefined$: Observable<boolean> // check if a component was assigned
  public products_empty: Product[] = []
  public products$ = new BehaviorSubject<Product[] | undefined>(undefined) // theme data
  public productsEmitter = new EventEmitter<Product[]>()

  constructor(
    @Inject(LOCALE_ID) public readonly locale: string,
    public readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly store: Store,
    private readonly user: UserService,
    private readonly slotService: SlotService,
    private readonly translate: TranslateService,
    private readonly appStateService: AppStateService,
    private readonly workspaceService: WorkspaceService
  ) {
    this.user$ = this.user.profile$.asObservable()
    this.isProductComponentDefined$ = this.slotService.isSomeComponentDefinedForSlot(this.slotName)
    this.hasEditPermissions = this.user.hasPermission('BOOKMARK#EDIT') ?? this.user.hasPermission('BOOKMARK#ADMIN_EDIT')
  }

  public ngOnInit() {
    this.workspace = this.appStateService.currentWorkspace$.getValue()
    this.productsEmitter.subscribe(this.products$)
    this.prepareDockItems()
    this.onSearch()
  }

  /**
   * DIALOG preparation
   */
  private prepareDockItems(): void {
    this.dockItems$ = this.translate.get(['ACTIONS.CONFIGURE.TOOLTIP']).pipe(
      map((data) => {
        return [
          {
            id: 'bm_overview_action_configure',
            iconClass: PrimeIcons.COG,
            tabindex: '0',
            tooltipOptions: {
              tooltipLabel: data['ACTIONS.CONFIGURE.TOOLTIP'],
              tooltipPosition: 'left',
              tooltipEvent: 'hover'
            },
            routerLink: 'configure'
          } as MenuItem
        ]
      })
    )
  }

  /**
   * UI Events
   */
  public onSearch() {
    this.store.dispatch(BookmarkOverviewActions.search())
  }
  public onFilterBookmarksByScope(bs: Bookmark[], sc: BookmarkScope): Bookmark[] {
    return bs.filter((b) => b.scope === sc)
  }
  public onGoToConfigure() {
    this.store.dispatch(BookmarkOverviewActions.navigate({ path: ['configure'] }))
  }
}
