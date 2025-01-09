import { Component, EventEmitter, Input, Output } from '@angular/core'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Bookmark } from 'src/app/shared/generated'

@Component({
  selector: 'app-bookmark-sort',
  templateUrl: './bookmark-sort.component.html',
  styleUrls: ['./bookmark-sort.component.scss']
})
export class BookmarkSortComponent {
  @Input() bookmarks: Bookmark[] = []
  @Input() displaySortDialog = false
  @Output() displaySortDialogChange = new EventEmitter<boolean>()

  constructor(private readonly msgService: PortalMessageService) {}

  public onSortConfirmation() {
    console.log('onSortConfirmation')
  }
  public onCloseSortDialog(): void {
    this.displaySortDialogChange.emit(false)
  }
}
