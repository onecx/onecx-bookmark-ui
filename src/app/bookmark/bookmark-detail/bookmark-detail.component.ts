import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { AbstractControl, DefaultValueAccessor, FormControl, FormGroup, Validators, ValidatorFn } from '@angular/forms'
import { BehaviorSubject, filter, Observable } from 'rxjs'

import { UserService } from '@onecx/angular-integration-interface'
import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/portal-integration-angular'
import { SlotService } from '@onecx/angular-remote-components'

import { Bookmark, BookmarkScope, CreateBookmark } from 'src/app/shared/generated'
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

export type Application = {
  appName: string
  appId: string
  undeployed: boolean
  deprecated: boolean
}
export type Product = {
  name: string
  displayName: string
  imageUrl?: string
  undeployed: boolean
  applications?: Application[]
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
  @Input() public dateFormat = 'medium'
  @Input() public editable = false
  @Input() public userId: string | undefined = undefined
  @Input() public vm: BookmarkDetailViewModel = {
    initialBookmark: undefined,
    permissions: undefined,
    changeMode: 'VIEW'
  }
  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()

  public formGroup: FormGroup
  public dialogResult: CombinedBookmark | undefined = undefined
  // slot configuration: get product data
  public slotName = 'onecx-product-data'
  public isProductComponentDefined$: Observable<boolean> // check if a component was assigned
  public product$ = new BehaviorSubject<Product | undefined>(undefined) // theme data
  public productEmitter = new EventEmitter<Product>()

  constructor(
    private readonly user: UserService,
    private readonly slotService: SlotService
  ) {
    this.isProductComponentDefined$ = this.slotService.isSomeComponentDefinedForSlot(this.slotName)
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
      this.productEmitter.subscribe(this.product$)
      this.formGroup.patchValue({
        ...this.vm.initialBookmark,
        is_public: this.vm.initialBookmark.scope === BookmarkScope.Public,
        // use a temporary key field for displaying JSON format
        endpointParams: JSON.stringify(this.vm.initialBookmark?.endpointParameters, undefined, 2),
        query: JSON.stringify(this.vm.initialBookmark?.query, undefined, 2)
      })
    }
    if (!this.editable || this.vm.changeMode === 'VIEW') {
      this.formGroup.disable()
    } else {
      this.formGroup.enable()
      // do something if form is valid
      this.formGroup.statusChanges.pipe(filter(() => this.formGroup.valid)).subscribe((val) => {
        this.primaryButtonEnabled.emit(this.editable)
      })
    }
    if (this.vm.changeMode === 'CREATE' || this.vm.initialBookmark?.url) {
      this.formGroup.controls['url'].setValidators(Validators.required)
    }
    if (this.vm.changeMode === 'COPY' || this.vm.changeMode === 'VIEW') {
      // avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.primaryButtonEnabled.emit(true)
      }, 500)
    }
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

  // Helper for loading product image/data
  public convertToBookmark(cb?: CombinedBookmark): Bookmark | undefined {
    return cb ? { ...cb, id: cb?.id ?? '' } : undefined
  }
  public getProductAppDisplayName(appId?: string, product?: Product): string | undefined {
    if (!appId) return undefined
    if (!product) return appId
    return product.applications?.find((app) => app.appId === appId)?.appName
  }
}
