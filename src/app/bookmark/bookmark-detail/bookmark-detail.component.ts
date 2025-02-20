import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core'
import { AbstractControl, DefaultValueAccessor, FormControl, FormGroup, Validators, ValidatorFn } from '@angular/forms'
import { filter } from 'rxjs'

import { UserService } from '@onecx/angular-integration-interface'
import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/portal-integration-angular'

import { BookmarkScope, CreateBookmark } from 'src/app/shared/generated'
import { BookmarkDetailViewModel } from './bookmark-detail.viewmodel'

// trim the value (string!) of a form control before passes to the control
const original = DefaultValueAccessor.prototype.registerOnChange
DefaultValueAccessor.prototype.registerOnChange = function (fn) {
  return original.call(this, (value) => {
    const trimmed = value.trim()
    return fn(trimmed)
  })
}

export function JsonValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    let isValid = false
    const value = control.value as string
    if (!value || value === '' || value === '{}') isValid = true
    else {
      const pattern = /:\s*(["{].*["}])\s*[,}]/
      isValid = pattern.test(value)
    }
    if (isValid) {
      return null // Validation passes
    } else {
      return { pattern: true } // Validation fails
    }
  }
}

// dialog is used for creation and editing
export type CombinedBookmark = CreateBookmark & {
  id?: string
  modificationCount?: number
  creationDate?: string
  creationUser?: string
  modificationDate?: string
  modificationUser?: string
}

@Component({
  selector: 'app-bookmark-detail',
  templateUrl: './bookmark-detail.component.html',
  styleUrls: ['./bookmark-detail.component.scss']
})
export class BookmarkDetailComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<CombinedBookmark | undefined>,
    DialogButtonClicked<BookmarkDetailComponent>,
    OnInit
{
  @Input() public workspaceName = ''
  @Input() public vm: BookmarkDetailViewModel = {
    initialBookmark: undefined,
    permissions: undefined,
    changeMode: 'VIEW'
  }
  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()

  @ViewChild('endpointParameter') endpointParameter!: ElementRef
  public formGroup: FormGroup
  public dialogResult: CombinedBookmark | undefined = undefined
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
    // this is the universal form: used for specific URL bookmarks and other bookmarks
    this.formGroup = new FormGroup({
      is_public: new FormControl(false),
      displayName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      endpointName: new FormControl(null, [Validators.minLength(2), Validators.maxLength(255)]),
      endpointParams: new FormControl(null, {
        validators: Validators.compose([JsonValidator(), Validators.maxLength(255)]),
        updateOn: 'change'
      }),
      query: new FormControl(null, {
        validators: Validators.compose([JsonValidator(), Validators.maxLength(255)]),
        updateOn: 'change'
      }),
      fragment: new FormControl(null, [Validators.maxLength(255)]),
      url: new FormControl(null, [Validators.minLength(2), Validators.maxLength(255)])
    })
  }

  public ngOnInit() {
    // on open dialog => manage parameter field depends on endpointName content
    if (this.vm.initialBookmark) {
      this.formGroup.patchValue({
        ...this.vm.initialBookmark,
        is_public: this.vm.initialBookmark.scope === BookmarkScope.Public,
        // use a temporary key field for displaying JSON format
        endpointParams: JSON.stringify(this.vm.initialBookmark?.endpointParameters, undefined, 2),
        query: JSON.stringify(this.vm.initialBookmark?.query, undefined, 2)
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
      // do something if form is valid
      this.formGroup.statusChanges.pipe(filter(() => this.formGroup.valid)).subscribe((val) => {
        if (this.hasPermission) {
          this.primaryButtonEnabled.emit(true)
        } else {
          this.primaryButtonEnabled.emit(false)
        }
      })
    }
    if (this.vm.changeMode === 'CREATE' || this.vm.initialBookmark?.url) {
      this.formGroup.controls['url'].setValidators(Validators.required)
    }
  }

  public hasEditPermission(): boolean {
    if (this.vm.permissions) {
      return this.vm.permissions.includes(this.permissionKey)
    }
    return this.user.hasPermission(this.permissionKey)
  }

  /**
   * Dialog Button clicked => return what we have
   */
  public ocxDialogButtonClicked() {
    try {
      // exclude all temporary or special (JSON) fields from object
      const reducedBookmark = (({ endpointParams, query, is_public, ...o }) => o)(this.formGroup.value)
      // default result
      let result = {
        ...reducedBookmark,
        endpointParameters: undefined,
        query: undefined
      }
      if (this.vm.changeMode !== 'CREATE') {
        const ep = this.formGroup.controls['endpointParams'].value
          ? JSON.parse(this.formGroup.controls['endpointParams'].value)
          : undefined
        const q = this.formGroup.controls['query'].value
          ? JSON.parse(this.formGroup.controls['query'].value)
          : undefined
        // default result
        result = {
          ...reducedBookmark,
          endpointParameters: ep,
          query: q
        }
      }
      const bookmark = (({ creationDate, creationUser, modificationDate, modificationUser, ...o }) => o)(
        this.vm.initialBookmark as CombinedBookmark
      )
      this.dialogResult = {
        ...bookmark,
        ...result,
        userId: this.userId,
        position: bookmark.position ?? 0,
        scope: this.formGroup.controls['is_public'].value ? BookmarkScope.Public : BookmarkScope.Private,
        url: this.formGroup.controls['url'].value,
        workspaceName: this.workspaceName
      }
    } catch (err) {
      console.error('Parse error', err)
      this.dialogResult = this.vm.initialBookmark
    }
  }
}
