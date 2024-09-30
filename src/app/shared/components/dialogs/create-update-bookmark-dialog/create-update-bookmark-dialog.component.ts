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

import { CreateUpdateBookmarkDialogViewModel } from './create-update-bookmark-dialog.viewmodel'

@Component({
  selector: 'app-create-update-bookmark-dialog',
  templateUrl: './create-update-bookmark-dialog.component.html'
})
export class CreateUpdateBookmarkDialogComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<Bookmark | undefined>,
    DialogButtonClicked<CreateUpdateBookmarkDialogComponent>,
    OnInit
{
  @Input() public vm: CreateUpdateBookmarkDialogViewModel = {
    initialBookmark: undefined,
    permissions: undefined
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
      ...this.vm.initialBookmark,
      ...this.formGroup.value
    }
  }

  ngOnInit() {
    if (this.vm.initialBookmark) {
      this.formGroup.patchValue({
        ...this.vm.initialBookmark
      })
      if (this.vm.initialBookmark.scope === BookmarkScopeEnum.Public) {
        this.isPublicBookmark = true
      }
    }
    if (!this.hasEditPermission() || this.isPublicBookmark) {
      this.formGroup.disable()
    }
  }

  hasEditPermission(): boolean {
    const key = 'BOOKMARK#EDIT'
    if (this.vm.permissions) {
      return this.vm.permissions.includes(key)
    }
    return this.userService.hasPermission(key)
  }
}
