import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import {
  DialogButtonClicked,
  DialogPrimaryButtonDisabled,
  DialogResult,
  UserService
} from '@onecx/portal-integration-angular'

import { FormControl, FormGroup, Validators } from '@angular/forms'
import { map } from 'rxjs'
import { Bookmark, BookmarkScopeEnum } from 'src/app/shared/generated'

import { BookmarksCreateUpdateViewModel } from './bookmarks-create-update.viewmodel'

@Component({
  selector: 'app-bookmarks-create-update',
  templateUrl: './bookmarks-create-update.component.html',
  styleUrls: ['./bookmarks-create-update.component.scss']
})
export class BookmarksCreateUpdateComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<Bookmark | undefined>,
    DialogButtonClicked<BookmarksCreateUpdateComponent>,
    OnInit
{
  @Input() public vm: BookmarksCreateUpdateViewModel = {
    itemToEdit: undefined
  }

  public formGroup: FormGroup

  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()
  dialogResult: Bookmark | undefined = undefined
  isPublicBookmark = false

  constructor(private userService: UserService) {
    this.formGroup = new FormGroup({
      displayName: new FormControl(null, [Validators.maxLength(255), Validators.required])
    })
    this.formGroup.statusChanges
      .pipe(
        map((status) => {
          return status === 'VALID'
        })
      )
      .subscribe((val) => {
        if (!this.hasEditPermission() || this.isPublicBookmark) {
          this.primaryButtonEnabled.emit(true)
        } else {
          this.primaryButtonEnabled.emit(val)
        }
      })
  }

  ocxDialogButtonClicked() {
    this.dialogResult = {
      ...this.vm.itemToEdit,
      ...this.formGroup.value
    }
  }

  ngOnInit() {
    if (this.vm.itemToEdit) {
      this.formGroup.patchValue({
        ...this.vm.itemToEdit
      })
      if (this.vm.itemToEdit.scope === BookmarkScopeEnum.Public) {
        this.isPublicBookmark = true
      }
    }
    if (!this.hasEditPermission() || this.isPublicBookmark) {
      this.formGroup.disable()
    }
  }

  hasEditPermission(): boolean {
    return this.userService.hasPermission('BOOKMARK#EDIT')
  }
}
