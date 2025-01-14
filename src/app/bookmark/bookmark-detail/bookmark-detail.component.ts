import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { map } from 'rxjs'

import { UserService } from '@onecx/angular-integration-interface'
import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/portal-integration-angular'

import { Bookmark, BookmarkScope } from 'src/app/shared/generated'

import { BookmarkDetailViewModel } from './bookmark-detail.viewmodel'

@Component({
  selector: 'app-bookmark-detail',
  templateUrl: './bookmark-detail.component.html',
  styleUrls: ['./bookmark-detail.component.scss']
})
export class BookmarkDetailComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<Bookmark | undefined>,
    DialogButtonClicked<BookmarkDetailComponent>,
    OnInit
{
  @Input() public vm: BookmarkDetailViewModel = {
    initialBookmark: undefined,
    permissions: undefined,
    changeMode: 'VIEW'
  }
  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()

  public formGroup: FormGroup
  public dialogResult: Bookmark | undefined = undefined
  public isPublicBookmark = false
  private permissionKey = 'BOOKMARK#EDIT'
  private hasPermission = false
  public datetimeFormat: string
  public userId: string | undefined

  constructor(private readonly user: UserService) {
    this.datetimeFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'M/d/yy, hh:mm:ss a'
    // to be used if switching scope back to PRIVATE
    this.user.profile$.subscribe({
      next: (data) => {
        this.userId = data.userId
      }
    })
    this.formGroup = new FormGroup({
      displayName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      is_public: new FormControl(false)
    })
  }

  ocxDialogButtonClicked() {
    console.log('ocxDialogButtonClicked', this.formGroup.value)
    console.log('ocxDialogButtonClicked', this.formGroup.controls['is_public'].value)
    this.dialogResult = {
      ...this.vm.initialBookmark,
      ...this.formGroup.value,
      userId: this.userId,
      scope: this.formGroup.controls['is_public'].value ? BookmarkScope.Public : BookmarkScope.Private
    }
  }

  ngOnInit() {
    console.log('ngOnInit', this.vm.initialBookmark)
    if (this.vm.initialBookmark) {
      this.formGroup.patchValue({
        ...this.vm.initialBookmark,
        is_public: this.vm.initialBookmark.scope === BookmarkScope.Public
      })
      if (this.vm.initialBookmark.scope === BookmarkScope.Public) {
        this.permissionKey = 'BOOKMARK#ADMIN_EDIT'
        this.isPublicBookmark = true
      }
    }
    console.log('ngOnInit', this.formGroup.value)
    this.hasPermission = this.hasEditPermission()
    if (!this.hasPermission) {
      this.formGroup.disable()
    }
    this.formGroup.statusChanges
      .pipe(
        map((status) => {
          return status === 'VALID'
        })
      )
      .subscribe((val) => {
        if (this.hasPermission) {
          this.primaryButtonEnabled.emit(val)
        } else {
          this.primaryButtonEnabled.emit(false)
        }
      })
    // wait a moment for initialization to activate the primary button
    setTimeout(() => {
      this.primaryButtonEnabled.emit(true)
    }, 500)
  }

  private hasEditPermission(): boolean {
    if (this.vm.permissions) {
      return this.vm.permissions.includes(this.permissionKey)
    }
    return this.user.hasPermission(this.permissionKey)
  }
}
