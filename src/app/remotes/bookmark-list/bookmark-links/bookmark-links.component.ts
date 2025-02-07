import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Params } from '@angular/router'
import { Observable, map } from 'rxjs'

import { WorkspaceService } from '@onecx/angular-integration-interface'

import { Bookmark } from 'src/app/shared/generated'
import { SharedModule } from 'src/app/shared/shared.module'

@Component({
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule],
  selector: 'app-bookmark-links',
  templateUrl: './bookmark-links.component.html',
  styleUrl: './bookmark-links.component.scss'
})
export class BookmarkLinksComponent {
  urls: Record<string, Observable<string>> = {}
  @Input() public bookmarks: Bookmark[] | undefined

  public query: Record<string, Params> = {}

  constructor(private readonly workspaceService: WorkspaceService) {}

  // get the URL basically used by Bookmark
  public getUrl(bookmark: Bookmark): Observable<string> | undefined {
    if (bookmark.id && bookmark.productName && bookmark.appId) {
      if (!this.urls[bookmark.id]) {
        this.urls[bookmark.id] = this.workspaceService
          .getUrl(bookmark.productName, bookmark.appId, bookmark.endpointName, bookmark.endpointParameters)
          .pipe(
            map((path) => {
              if (bookmark.query) this.query[bookmark.id] = bookmark.query
              return path
            })
          )
      }
      return this.urls[bookmark.id]
    }
    return undefined
  }
}
