import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/portal-integration-angular'

import { Bookmark, UpdateBookmark } from 'src/app/shared/generated'

import { BookmarkSortViewModel } from './bookmark-sort.viewmodel'

@Component({
  selector: 'app-bookmark-sort',
  templateUrl: './bookmark-sort.component.html',
  styleUrls: ['./bookmark-sort.component.scss']
})
export class BookmarkSortComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<UpdateBookmark[] | undefined>,
    DialogButtonClicked<BookmarkSortComponent>,
    OnInit
{
  @Input() public vm: BookmarkSortViewModel = { initialBookmarks: undefined }
  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()

  public dialogResult: UpdateBookmark[] = []

  constructor() {
    console.log('sort dialog: constructor')
  }

  ocxDialogButtonClicked() {
    this.dialogResult?.forEach((b, i) => (this.dialogResult[i] = { ...b, position: i + 1 }))
    console.log('ocxDialogButtonClicked', this.dialogResult)
  }

  ngOnInit() {
    console.log('sort dialog: ngOnInit', this.vm)
    this.dialogResult = this.cast2UpdateBookmark(this.vm.initialBookmarks)
    this.dialogResult?.sort(this.sortByPosition)
    // wait a moment for initialization to activate the primary button
    setTimeout(() => {
      this.primaryButtonEnabled.emit(true)
    }, 500)
  }

  private sortByPosition(a: UpdateBookmark, b: UpdateBookmark): number {
    return a.position - b.position
  }

  private cast2UpdateBookmark(bookmarks: Bookmark[] | undefined): UpdateBookmark[] {
    if (!bookmarks) return []
    return bookmarks.map((b) => ({
      id: b.id,
      modificationCount: b.modificationCount ?? 0,
      displayName: b.displayName,
      position: b.position
    }))
  }
}
