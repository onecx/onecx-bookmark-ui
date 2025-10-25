import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

import { DialogButtonClicked, DialogResult } from '@onecx/portal-integration-angular'

import { Bookmark, UpdateBookmark } from 'src/app/shared/generated'
import { limitText } from 'src/app/shared/utils/utils'

import { BookmarkSortViewModel } from './bookmark-sort.viewmodel'

@Component({
  selector: 'app-bookmark-sort',
  templateUrl: './bookmark-sort.component.html',
  styleUrls: ['./bookmark-sort.component.scss']
})
export class BookmarkSortComponent
  implements DialogResult<UpdateBookmark[] | undefined>, DialogButtonClicked<BookmarkSortComponent>, OnInit
{
  @Input() public vm: BookmarkSortViewModel = { initialBookmarks: undefined }
  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()

  public dialogResult: UpdateBookmark[] = []
  public limitText = limitText

  ocxDialogButtonClicked() {
    // sonar does not like forEach
    for (const { b, i } of this.dialogResult.map((b, i) => ({ b, i }))) b.position = i + 1
  }

  ngOnInit() {
    this.dialogResult = this.cast2UpdateBookmark(this.vm.initialBookmarks)
    this.dialogResult?.sort(this.sortByPosition)
    // wait a moment for initialization to activate the primary button
    setTimeout(() => {
      this.primaryButtonEnabled.emit(true)
    }, 200)
  }

  private sortByPosition(a: UpdateBookmark, b: UpdateBookmark): number {
    return a.position - b.position
  }

  private cast2UpdateBookmark(bookmarks: Bookmark[] | undefined): UpdateBookmark[] {
    if (!bookmarks) return []
    return bookmarks.map((b) => ({
      id: b.id,
      modificationCount: b.modificationCount ?? 0,
      scope: b.scope,
      position: b.position,
      displayName: b.displayName,
      endpointName: b.endpointName,
      endpointParameters: b.endpointParameters,
      query: b.query,
      fragment: b.fragment,
      url: b.url,
      userId: b.userId
    }))
  }
}
