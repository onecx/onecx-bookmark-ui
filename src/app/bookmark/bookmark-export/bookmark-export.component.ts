import { Component, EventEmitter, Input, Output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'

import { CheckboxModule } from 'primeng/checkbox'
import { TooltipModule } from 'primeng/tooltip'

import {
  AngularAcceleratorModule,
  DialogButtonClicked,
  DialogPrimaryButtonDisabled,
  DialogResult
} from '@onecx/angular-accelerator'

import { ExportBookmarksRequest, EximBookmarkScope } from 'src/app/shared/generated'

@Component({
  selector: 'app-bookmark-export',
  templateUrl: './bookmark-export.component.html',
  styleUrl: './bookmark-export.component.scss',
  standalone: true,
  imports: [AngularAcceleratorModule, CheckboxModule, FormsModule, TooltipModule, TranslateModule]
})
export class BookmarkExportComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<ExportBookmarksRequest | undefined>,
    DialogButtonClicked<BookmarkExportComponent>
{
  @Input() public workspaceName = ''
  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()

  public dialogResult: ExportBookmarksRequest | undefined = undefined
  public private = false
  public public = false

  public onScopeChange() {
    this.primaryButtonEnabled.emit(this.private || this.public)
  }

  /**
   * Dialog Button clicked => return what we have
   */
  public ocxDialogButtonClicked() {
    const scopes: EximBookmarkScope[] = []
    if (this.private) scopes.push(EximBookmarkScope.Private)
    if (this.public) scopes.push(EximBookmarkScope.Public)

    this.dialogResult = {
      workspaceName: this.workspaceName,
      scopes: scopes
    }
  }
}
