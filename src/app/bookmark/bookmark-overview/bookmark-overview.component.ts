import { Component, DestroyRef, EventEmitter, inject, LOCALE_ID, OnInit } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AsyncPipe } from '@angular/common'
import { TranslateService, TranslateModule } from '@ngx-translate/core'
import { BehaviorSubject, Observable, map, of, take } from 'rxjs'
import { Store } from '@ngrx/store'
import { LetDirective } from '@ngrx/component'
import { MenuItem, PrimeIcons } from 'primeng/api'
import { DockModule } from 'primeng/dock'
import { MessageModule } from 'primeng/message'
import { TooltipModule } from 'primeng/tooltip'

import { UserProfile, Workspace } from '@onecx/integration-interface'
import { Action, AngularAcceleratorModule } from '@onecx/angular-accelerator'
import { AngularAuthModule } from '@onecx/angular-auth'
import { AppStateService, UserService } from '@onecx/angular-integration-interface'
import { SlotService } from '@onecx/angular-remote-components'
import { PortalPageComponent } from '@onecx/angular-utils'

import { Bookmark, BookmarkScope } from 'src/app/shared/generated'

import { BookmarkOverviewActions } from './bookmark-overview.actions'
import { BookmarkOverviewViewModel } from './bookmark-overview.viewmodel'
import { selectBookmarkOverviewViewModel } from './bookmark-overview.selectors'
import { BookmarkListComponent } from './bookmark-list/bookmark-list.component'

export type Product = {
  name: string
  displayName: string
  imageUrl?: string
}

@Component({
  selector: 'app-bookmark-overview',
  standalone: true,
  imports: [
    AngularAcceleratorModule,
    AngularAuthModule,
    AsyncPipe,
    BookmarkListComponent,
    DockModule,
    LetDirective,
    MessageModule,
    PortalPageComponent,
    TooltipModule,
    TranslateModule
  ],
  templateUrl: './bookmark-overview.component.html',
  styleUrl: './bookmark-overview.component.scss'
})
export class BookmarkOverviewComponent implements OnInit {
  public readonly locale = inject(LOCALE_ID)
  private readonly store = inject(Store)
  private readonly user = inject(UserService)
  private readonly slotService = inject(SlotService)
  private readonly translate = inject(TranslateService)
  private readonly appStateService = inject(AppStateService)
  private readonly destroyRef = inject(DestroyRef)

  // data
  public viewModel$: Observable<BookmarkOverviewViewModel> = this.store.select(selectBookmarkOverviewViewModel)
  public pageActions: Action[] = []
  public BookmarkScope = BookmarkScope
  public hasEditPermissions$: Observable<boolean>
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

  constructor() {
    this.user$ = this.user.profile$.asObservable()
    this.isProductComponentDefined$ = this.slotService.isSomeComponentDefinedForSlot(this.slotName)
    this.hasEditPermissions$ = this.user
      .getPermissions()
      .pipe(map((permissions) => permissions.includes('BOOKMARK#EDIT') || permissions.includes('BOOKMARK#ADMIN_EDIT')))
  }

  public ngOnInit() {
    this.appStateService.currentWorkspace$.pipe(take(1)).subscribe((workspace) => {
      this.workspace = workspace
    })
    this.productsEmitter.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(this.products$)
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
          }
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
