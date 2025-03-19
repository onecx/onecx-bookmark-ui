import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Observable, map, of } from 'rxjs'
import { Store } from '@ngrx/store'
import { MenuItem, PrimeIcons } from 'primeng/api'

import { UserService, WorkspaceService } from '@onecx/angular-integration-interface'
import { Action } from '@onecx/portal-integration-angular'

import { Bookmark, BookmarkScope } from 'src/app/shared/generated'
import { limitText } from 'src/app/shared/utils/utils'

import { BookmarkOverviewActions } from './bookmark-overview.actions'
import { BookmarkOverviewViewModel } from './bookmark-overview.viewmodel'
import { selectBookmarkOverviewViewModel } from './bookmark-overview.selectors'

@Component({
  selector: 'app-bookmark-overview',
  templateUrl: './bookmark-overview.component.html',
  styleUrls: ['./bookmark-overview.component.scss']
})
export class BookmarkOverviewComponent implements OnInit {
  // data
  public viewModel$: Observable<BookmarkOverviewViewModel> = this.store.select(selectBookmarkOverviewViewModel)
  public urls: Record<string, Observable<string>> = {}
  public pageActions: Action[] = []
  public limitText = limitText
  public BookmarkScope = BookmarkScope
  public editable = false
  public dockItems$: Observable<MenuItem[]> = of([])

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
  }

  public ngOnInit() {
    this.preparePageActions()
    this.prepareDockItems()
    this.onSearch()
  }

  /**
   * DIALOG preparation
   */
  private preparePageActions(): void {
    this.pageActions = [
      {
        labelKey: 'ACTIONS.CONFIGURATION.LABEL',
        titleKey: 'ACTIONS.CONFIGURATION.TOOLTIP',
        icon: PrimeIcons.COG,
        show: 'always',
        permission: 'BOOKMARK#CONFIGURE',
        actionCallback: () => this.router.navigate(['./configure'], { relativeTo: this.route })
      }
    ]
  }
  private prepareDockItems(): void {
    this.dockItems$ = this.translate.get(['ACTIONS.CONFIGURE.TOOLTIP']).pipe(
      map((data) => {
        return [
          {
            id: 'bm_overview_action_configure',
            iconClass: 'pi pi-cog',
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
    //return []
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
