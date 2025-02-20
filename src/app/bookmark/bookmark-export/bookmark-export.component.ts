import { Component, EventEmitter, Input, Output } from '@angular/core'

import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/portal-integration-angular'

import { ExportBookmarksRequest, EximBookmarkScope } from 'src/app/shared/generated'

@Component({
  selector: 'app-bookmark-export',
  templateUrl: './bookmark-export.component.html',
  styleUrl: './bookmark-export.component.scss'
})
export class BookmarkExportComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<ExportBookmarksRequest>,
    DialogButtonClicked<BookmarkExportComponent>
{
  @Input() public workspaceName = ''
  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()

  public dialogResult!: ExportBookmarksRequest
  public BookmarkScope = EximBookmarkScope

  /**
   * Dialog Button clicked => return what we have
   */
  public ocxDialogButtonClicked() {
    this.dialogResult = {
      workspaceName: this.workspaceName,
      scopes: [EximBookmarkScope.Private]
    }
  }
}
