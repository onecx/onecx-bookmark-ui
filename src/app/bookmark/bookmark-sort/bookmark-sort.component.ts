import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/portal-integration-angular'

import { Bookmark } from 'src/app/shared/generated'

import { BookmarkSortViewModel } from './bookmark-sort.viewmodel'

@Component({
  selector: 'app-bookmark-sort',
  templateUrl: './bookmark-sort.component.html'
})
export class BookmarkSortComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<Bookmark[] | undefined>,
    DialogButtonClicked<BookmarkSortComponent>,
    OnInit
{
  @Input() public vm: BookmarkSortViewModel = { initialBookmarks: undefined }
  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()

  public dialogResult: Bookmark[] | undefined = undefined

  constructor() {
    console.log('sort dialog: constructor')
  }

  ocxDialogButtonClicked() {
    this.dialogResult = [] // this.vm.initialBookmarks
  }

  ngOnInit() {
    console.log('sort dialog: ngOnInit')
  }
}
