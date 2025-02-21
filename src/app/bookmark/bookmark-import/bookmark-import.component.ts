import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { map, Observable } from 'rxjs'
import { FileSelectEvent, FileUpload } from 'primeng/fileupload'
import { SelectItem } from 'primeng/api'

import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/portal-integration-angular'

import { BookmarkSnapshot, ImportBookmarkRequest, EximMode } from 'src/app/shared/generated'

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
    DialogResult<ImportBookmarkRequest | undefined>,
    DialogButtonClicked<BookmarkImportComponent>
{
  @Input() public workspaceName = ''
  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()

  @ViewChild(FileUpload) fileUploader: FileUpload | undefined

  public dialogResult: ImportBookmarkRequest | undefined = undefined
  public importError: ImportError | undefined = undefined
  public snapshot: BookmarkSnapshot | undefined = undefined
  public modeItems$: Observable<SelectItem[]> | undefined
  public mode: EximMode = EximMode.Append

  constructor(private readonly translate: TranslateService) {
    this.modeItems$ = this.translate.get(['BOOKMARK_IMPORT.MODE.APPEND', 'BOOKMARK_IMPORT.MODE.OVERWRITE']).pipe(
      map((data) => {
        return [
          { label: data['BOOKMARK_IMPORT.MODE.APPEND'], value: EximMode.Append },
          { label: data['BOOKMARK_IMPORT.MODE.OVERWRITE'], value: EximMode.Overwrite }
        ]
      })
    )
  }

  public onImportFileSelect(event: FileSelectEvent): void {
    this.importError = undefined
    event.files[0].text().then((text) => {
      try {
        this.snapshot = JSON.parse(text)
        this.primaryButtonEnabled.emit(true)
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
    this.dialogResult = {
      workspace: this.workspaceName,
      snapshot: this.snapshot,
      importMode: this.mode
    }
    console.log('ocxDialogButtonClicked', this.dialogResult)
  }
}
