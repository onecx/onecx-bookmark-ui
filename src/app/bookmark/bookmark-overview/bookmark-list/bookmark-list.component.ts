import { Component, Input } from '@angular/core'
import { Observable, map } from 'rxjs'

import { WorkspaceService } from '@onecx/angular-integration-interface'

import { Bookmark } from 'src/app/shared/generated'
import { limitText } from 'src/app/shared/utils/utils'

@Component({
  selector: 'app-bookmark-list',
  templateUrl: './bookmark-list.component.html',
  styleUrl: './bookmark-list.component.scss'
})
export class BookmarkListComponent {
  @Input() public bookmarks: Bookmark[] = []
  @Input() public headerKey = ''
  @Input() public isPrivate = false

  public urls: Record<string, Observable<string>> = {}

  public limitText = limitText

  constructor(private readonly workspaceService: WorkspaceService) {}

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
