import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { map } from 'rxjs'

import { UserService } from '@onecx/angular-integration-interface'
import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/portal-integration-angular'

import { Bookmark, BookmarkScopeEnum } from 'src/app/shared/generated'

import { BookmarkDetailViewModel } from './bookmark-detail.viewmodel'

@Component({
  selector: 'app-bookmark-detail',
  templateUrl: './bookmark-detail.component.html'
})
export class BookmarkDetailComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<Bookmark | undefined>,
    DialogButtonClicked<BookmarkDetailComponent>,
    OnInit
{
  @Input() public vm: BookmarkDetailViewModel = { initialBookmark: undefined, permissions: undefined }
  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()

  public formGroup: FormGroup
  public dialogResult: Bookmark | undefined = undefined
  public isPublicBookmark = false
  private permissionKey = 'BOOKMARK#EDIT'

  constructor(private readonly userService: UserService) {
    this.formGroup = new FormGroup({
      displayName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)])
    })
    this.formGroup.statusChanges
      .pipe(
        map((status) => {
          return status === 'VALID'
        })
      )
      .subscribe((val) => {
        if (this.hasEditPermission()) {
          this.primaryButtonEnabled.emit(val)
        } else {
          this.primaryButtonEnabled.emit(false)
        }
      })
  }

  ocxDialogButtonClicked() {
    this.dialogResult = { ...this.vm.initialBookmark, ...this.formGroup.value }
  }

  ngOnInit() {
    if (this.vm.initialBookmark) {
      this.formGroup.patchValue({ ...this.vm.initialBookmark })
      if (this.vm.initialBookmark.scope === BookmarkScopeEnum.Public) {
        this.permissionKey = 'BOOKMARK#ADMIN_EDIT'
        this.isPublicBookmark = true
      }
    }
    if (!this.hasEditPermission()) {
      this.formGroup.disable()
    }
  }

  private hasEditPermission(): boolean {
    if (this.vm.permissions) {
      return this.vm.permissions.includes(this.permissionKey)
    }
    return this.userService.hasPermission(this.permissionKey)
  }
}
