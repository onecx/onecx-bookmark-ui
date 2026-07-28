import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core'
import { DatePipe } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

import { ButtonModule } from 'primeng/button'
import { CheckboxModule } from 'primeng/checkbox'
import { FileSelectEvent, FileUpload, FileUploadModule } from 'primeng/fileupload'
import { FloatLabelModule } from 'primeng/floatlabel'
import { MessageModule } from 'primeng/message'
import { SelectButtonModule } from 'primeng/selectbutton'
import { TabViewModule } from 'primeng/tabview'
import { TooltipModule } from 'primeng/tooltip'

import {
  AngularAcceleratorModule,
  DialogButtonClicked,
  DialogPrimaryButtonDisabled,
  DialogResult
} from '@onecx/angular-accelerator'

import { BookmarkSnapshot, EximBookmarkScope, EximMode, ExportBookmarksRequest } from 'src/app/shared/generated'
import { ImportBookmarkData } from '../bookmark-configure/bookmark-configure.effects'

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
  standalone: true,
  imports: [
    AngularAcceleratorModule,
    DatePipe,
    ButtonModule,
    CheckboxModule,
    FileUploadModule,
    FloatLabelModule,
    FormsModule,
    MessageModule,
    SelectButtonModule,
    TabViewModule,
    TooltipModule,
    TranslateModule
  ],
  templateUrl: './bookmark-import.component.html',
  styleUrl: './bookmark-import.component.scss'
})
export class BookmarkImportComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<ExportBookmarksRequest | undefined>,
    DialogButtonClicked<BookmarkImportComponent>
{
  @Input() public workspaceName = ''
  @Input() public dateFormat = 'medium'
  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()

  @ViewChild(FileUpload) fileUploader: FileUpload | undefined

  public readonly modeOptions: { label: string; value: EximMode }[] = [
    { label: 'BOOKMARK_IMPORT.MODE.APPEND', value: EximMode.Append },
    { label: 'BOOKMARK_IMPORT.MODE.OVERWRITE', value: EximMode.Overwrite }
  ]

  public dialogResult: ImportBookmarkData | undefined = undefined
  public importError: ImportError | undefined = undefined
  public snapshot: BookmarkSnapshot | undefined = undefined
  public mode: EximMode = EximMode.Append
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
