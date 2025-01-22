import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core'
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

  @ViewChild('endpointParameter') endpointParameter!: ElementRef
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
      is_public: new FormControl(false),
      displayName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      endpointName: new FormControl(null, [Validators.minLength(2), Validators.maxLength(255)]),
      endpointParams: new FormControl(null, [Validators.maxLength(255)]),
      query: new FormControl(null, [Validators.maxLength(255)]),
      hash: new FormControl(null, [Validators.maxLength(255)])
    })
  }

  /**
   * Dialog Button clicked => return what we have
   */
  ocxDialogButtonClicked() {
    // due to using a temporary key for displaying formatted JSON we have to create a clean result object
    const reducedEndpoint = (({ endpointParams, ...o }) => o)(this.formGroup.value) // omit temporary used key
    const result = {
      ...reducedEndpoint,
      endpointParameters: JSON.parse(this.formGroup.controls['endpointParams'].value) // add the current value
    }
    this.dialogResult = {
      ...this.vm.initialBookmark,
      ...result,
      userId: this.userId,
      scope: this.formGroup.controls['is_public'].value ? BookmarkScope.Public : BookmarkScope.Private
    }
  }

  ngOnInit() {
    // on open dialog => manage parameter field depends on endpointName content
    if (this.vm.initialBookmark) {
      this.formGroup.patchValue({
        ...this.vm.initialBookmark,
        is_public: this.vm.initialBookmark.scope === BookmarkScope.Public,
        // use a temporary key field for displaying JSON format
        endpointParams: JSON.stringify(this.vm.initialBookmark?.endpointParameters, undefined, 2)
      })
      if (this.vm.initialBookmark.scope === BookmarkScope.Public) {
        this.permissionKey = 'BOOKMARK#ADMIN_EDIT'
        this.isPublicBookmark = true
      }
    }
    this.hasPermission = this.hasEditPermission()
    if (!this.hasPermission || this.vm.changeMode === 'VIEW') {
      this.formGroup.disable()
    } else {
      this.formGroup.enable()
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
    }
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
