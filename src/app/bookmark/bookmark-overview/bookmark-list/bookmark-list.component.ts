import { Component, inject, Input } from '@angular/core'
import { NgClass, NgTemplateOutlet } from '@angular/common'
import { Router, RouterModule } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { Observable, first, map } from 'rxjs'

import { CardModule } from 'primeng/card'
import { MessageModule } from 'primeng/message'
import { PaginatorModule } from 'primeng/paginator'
import { TooltipModule } from 'primeng/tooltip'

import { AngularAcceleratorModule } from '@onecx/angular-accelerator'
import { WorkspaceService } from '@onecx/angular-integration-interface'

import { Bookmark } from 'src/app/shared/generated'
import { Utils } from 'src/app/shared/utils/utils'

import { Product } from '../bookmark-overview.component'
import { BookmarkImageComponent } from 'src/app/bookmark/bookmark-image/bookmark-image.component'

@Component({
  selector: 'app-bookmark-list',
  standalone: true,
  imports: [
    AngularAcceleratorModule,
    NgClass,
    NgTemplateOutlet,
    CardModule,
    MessageModule,
    PaginatorModule,
    RouterModule,
    TooltipModule,
    TranslateModule,
    // components
    BookmarkImageComponent
  ],
  templateUrl: './bookmark-list.component.html',
  styleUrls: ['./bookmark-list.component.scss']
})
export class BookmarkListComponent {
  private readonly router = inject(Router)
  //
  @Input() public bookmarks: Bookmark[] = []
  @Input() public products: Product[] | undefined
  @Input() public headerKey = ''
  @Input() public isPrivate = false

  public urls: Record<string, Observable<string>> = {}
  private readonly workspaceService = inject(WorkspaceService)

  public limitText = Utils.limitText

  // get the target URL for the Bookmark
  public getUrl(bookmark: Bookmark): Observable<string> | undefined {
    if (bookmark.id && bookmark.productName && bookmark.appId) {
      if (!Object.keys(this.urls).includes(bookmark.id)) {
        this.urls[bookmark.id] = this.workspaceService
          .getUrl(bookmark.productName, bookmark.appId, bookmark.endpointName, bookmark.endpointParameters)
          .pipe(map((path) => path))
      }
      return this.urls[bookmark.id]
    }
    return undefined
  }

  public getProductByName(name?: string): Product | undefined {
    return this.products?.find((p) => p.name === name)
  }

  // UI Events => clicking on bookmarks
  public onBookmarkClick(bookmark: Bookmark): void {
    const urlObservable$ = this.getUrl(bookmark)
    if (!urlObservable$) {
      console.warn('Bookmark without valid source parameter', bookmark)
      return
    }
    urlObservable$?.pipe(first()).subscribe((url: string) => {
      if (bookmark.target === '_blank') {
        const tree = this.router.createUrlTree([url], { queryParams: bookmark.query, fragment: bookmark.fragment })
        const serializedUrl = this.router.serializeUrl(tree)
        window.open(serializedUrl, '_blank')
      } else {
        this.router.navigate([url], { queryParams: bookmark.query, fragment: bookmark.fragment })
      }
    })
  }
}
