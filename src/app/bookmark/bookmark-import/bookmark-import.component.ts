import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { FileSelectEvent, FileUpload } from 'primeng/fileupload'

import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/portal-integration-angular'

import { BookmarkSnapshot, EximBookmarkScope, EximMode, ImportBookmarksRequest } from 'src/app/shared/generated'

export type ImportError = {
  name: string
  message: string
  error: any
  ok: boolean
  status: number
  statusText: string
  exceptionKey: string
}

@Component({
  selector: 'app-bookmark-import',
  templateUrl: './bookmark-import.component.html',
  styleUrl: './bookmark-import.component.scss'
})
export class BookmarkImportComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<ImportBookmarksRequest | undefined>,
    DialogButtonClicked<BookmarkImportComponent>
{
  @Input() public workspaceName = ''
  @Input() public dateFormat = 'medium'
  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()

  @ViewChild(FileUpload) fileUploader: FileUpload | undefined

  public dialogResult: ImportBookmarksRequest | undefined = undefined
  public importError: ImportError | undefined = undefined
  public snapshot: BookmarkSnapshot | undefined = undefined
  public mode: EximMode = EximMode.Append
  public EximMode = EximMode
  public private = true
  public public = false

  constructor(private readonly translate: TranslateService) {}

  private checkImportReady() {
    this.primaryButtonEnabled.emit((this.private || this.public) && this.snapshot !== undefined)
  }

  /**
   * UI Actions
   */
  public onScopeChange() {
    this.checkImportReady()
  }

  public onImportFileSelect(event: FileSelectEvent): void {
    this.importError = undefined
    event.files[0].text().then((text) => {
      try {
        this.snapshot = JSON.parse(text)
        this.checkImportReady()
      } catch (err) {
        console.error('Import parse error', err)
        this.importError = {
          name: 'Parse error',
          ok: false,
          status: 400,
          statusText: 'Parser error',
          message: '',
          error: { errorCode: 'PARSER', detail: err },
          exceptionKey: 'ACTIONS.IMPORT.ERROR.PARSER'
        }
      }
    })
  }
  public onImportClear(): void {
    this.importError = undefined
    this.fileUploader?.clear()
    this.primaryButtonEnabled.emit(false)
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
      snapshot: this.snapshot,
      importMode: this.mode,
      scopes: scopes
    }
  }
}
