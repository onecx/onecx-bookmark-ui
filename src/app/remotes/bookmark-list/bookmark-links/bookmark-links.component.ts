import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { WorkspaceService } from '@onecx/angular-integration-interface'
import { Observable } from 'rxjs'
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

  constructor(private workspaceService: WorkspaceService) {}

  getUrl(bookmark: Bookmark) {
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
}
