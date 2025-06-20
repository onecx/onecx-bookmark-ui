import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { Location } from '@angular/common'
import { AbstractControl, DefaultValueAccessor, FormControl, FormGroup, Validators, ValidatorFn } from '@angular/forms'
import { BehaviorSubject, filter, map, Observable } from 'rxjs'

import { SlotService } from '@onecx/angular-remote-components'
import { AppStateService, PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/portal-integration-angular'

import { Bookmark, BookmarkScope, ImagesInternalAPIService, CreateBookmark } from 'src/app/shared/generated'
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

  public defaultProduct: Product | undefined
  public formGroup: FormGroup
  public dialogResult: CombinedBookmark | undefined = undefined
  public bookmarkImageBaseURL$: Observable<string> | undefined
  public fetchingLogoUrl: string | undefined = undefined
  public externUrlPattern = 'http(s)://path-to-image'
  public onProductImageLoadError = false
  public onBookmarkImageLoadError = false

  // slot configuration: get product data
  public slotName = 'onecx-product-data'
  public isProductComponentDefined$: Observable<boolean> // check if a component was assigned
  public product$ = new BehaviorSubject<Product | undefined>(undefined) // theme data
  public productEmitter = new EventEmitter<Product>()

  constructor(
    private readonly user: UserService,
    private readonly appStateService: AppStateService,
    private readonly slotService: SlotService,
    private readonly msgService: PortalMessageService,
    private readonly imageApi: ImagesInternalAPIService
  ) {
    // bookmark image URL via bookmark BFF
    this.bookmarkImageBaseURL$ = appStateService.currentMfe$.pipe(
      map((mfe) => {
        return this.prepareUrlPath(mfe.remoteBaseUrl, 'bff/images/') + this.vm.initialBookmark?.id
      })
    )
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
      url: new FormControl(null, [Validators.minLength(2), Validators.maxLength(255)]),
      imageUrl: new FormControl(null, [Validators.maxLength(255)])
    })
  }

  public ngOnInit() {
    // on open dialog => manage parameter field depends on endpointName content
    if (this.vm.initialBookmark) {
      this.defaultProduct = {
        name: this.vm.initialBookmark?.productName ?? '',
        displayName: this.vm.initialBookmark?.productName ?? '',
        undeployed: false,
        applications: []
      }
      this.productEmitter.subscribe(this.product$)
      this.formGroup.patchValue({
        ...this.vm.initialBookmark,
        is_public: this.vm.initialBookmark.scope === BookmarkScope.Public,
        // use a temporary key field for displaying JSON format
        endpointParams: JSON.stringify(this.vm.initialBookmark?.endpointParameters, undefined, 2),
        query: JSON.stringify(this.vm.initialBookmark?.query, undefined, 2)
      })
      if (this.vm.initialBookmark?.imageUrl) this.fetchingLogoUrl = this.vm.initialBookmark?.imageUrl
      else this.prepareImageUrl(this.vm.initialBookmark?.id)
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
        imageUrl: result.imageUrl === '' ? undefined : result.imageUrl,
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
    if (!product || product.applications?.length === 0) return appId
    return product.applications?.find((app) => app.appId === appId)?.appName
  }

  /**
   * IMAGE
   */
  public onRemoveLogo(bookmark?: CombinedBookmark) {
    if (bookmark?.id)
      if (this.formGroup.get('imageUrl')?.value) {
        this.formGroup.get('imageUrl')?.setValue(null)
        this.prepareImageUrl(this.vm.initialBookmark?.id)
      } else
        this.imageApi.deleteImage({ refId: bookmark.id }).subscribe({
          next: () => {
            this.fetchingLogoUrl = undefined // reset - important to trigger the change in UI
            this.onBookmarkImageLoadError = true // disable remove button
            this.msgService.info({ summaryKey: 'IMAGE.REMOVE_SUCCESS' })
          },
          error: (err) => {
            console.error('deleteImage', err)
          }
        })
  }

  public onFileUpload(ev: Event, bookmark?: CombinedBookmark): void {
    if (ev.target && (ev.target as HTMLInputElement).files) {
      const files = (ev.target as HTMLInputElement).files
      if (files) {
        if (files[0].size > 1000000) {
          this.msgService.error({ summaryKey: 'IMAGE.CONSTRAINT_FAILED', detailKey: 'IMAGE.CONSTRAINT_SIZE' })
        } else if (!/^.*.(jpg|jpeg|png)$/.exec(files[0].name)) {
          this.msgService.error({ summaryKey: 'IMAGE.CONSTRAINT_FAILED', detailKey: 'IMAGE.CONSTRAINT_FILE_TYPE' })
        } else if (bookmark?.id) {
          this.saveImage(bookmark.id, files) // store image
        }
      }
    } else {
      this.msgService.error({ summaryKey: 'IMAGE.CONSTRAINT_FAILED', detailKey: 'IMAGE.CONSTRAINT_FILE_MISSING' })
    }
  }

  private saveImage(id: string, files: FileList) {
    const blob = new Blob([files[0]], { type: files[0].type })
    this.prepareImageUrl() // reset - important to trigger the change in UI
    this.onBookmarkImageLoadError = false
    this.imageApi.uploadImage({ refId: id, body: blob }).subscribe(() => {
      this.prepareImageUrl(id)
      this.msgService.info({ summaryKey: 'IMAGE.UPLOAD_SUCCESS' })
    })
  }
  private prepareImageUrl(id?: string): void {
    this.fetchingLogoUrl = id ? this.imageApi.configuration.basePath + '/images/' + id : undefined
  }

  // changes on external log URL field: user enters text (change) or paste something
  public onInputChange(event: Event, bookmark?: CombinedBookmark): void {
    if (bookmark?.id && (event.target as HTMLInputElement).value) {
      this.onBookmarkImageLoadError = false
      this.fetchingLogoUrl = (event.target as HTMLInputElement).value
      if (this.fetchingLogoUrl === '') this.fetchingLogoUrl = undefined
    }
  }

  private prepareUrlPath(url?: string, path?: string): string {
    if (url && path) return Location.joinWithSlash(url, path)
    else if (url) return url
    else return ''
  }
}
