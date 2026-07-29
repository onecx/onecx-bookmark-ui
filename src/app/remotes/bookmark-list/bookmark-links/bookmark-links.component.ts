import { Component, inject, Input } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import { RouterModule } from '@angular/router'
import { Observable, map } from 'rxjs'

import { WorkspaceService } from '@onecx/angular-integration-interface'

import { Bookmark } from 'src/app/shared/generated'

@Component({
  selector: 'app-bookmark-links',
  templateUrl: './bookmark-links.component.html',
  styleUrls: ['./bookmark-links.component.scss'],
  imports: [AsyncPipe, RouterModule]
})
export class BookmarkLinksComponent {
  private readonly workspaceService = inject(WorkspaceService)

  urls: Record<string, Observable<string>> = {}
  @Input() public bookmarks: Bookmark[] | undefined

  // get the URL basically used by Bookmark
  public getUrl(bookmark: Bookmark): Observable<string> | undefined {
    if (bookmark.id && bookmark.productName && bookmark.appId) {
      if (!this.urls[bookmark.id]) {
        this.urls[bookmark.id] = this.workspaceService
          .getUrl(bookmark.productName, bookmark.appId, bookmark.endpointName, bookmark.endpointParameters)
          .pipe(
            map((path) => {
              return path
            })
          )
      }
      return this.urls[bookmark.id]
    }
    return undefined
  }
}
