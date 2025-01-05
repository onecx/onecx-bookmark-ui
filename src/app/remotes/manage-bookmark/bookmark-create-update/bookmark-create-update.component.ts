import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { FormsModule, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { MessagesModule } from 'primeng/messages'
import { SharedModule } from 'primeng/api'
import { TooltipModule } from 'primeng/tooltip'
import { map } from 'rxjs'
import { provideErrorTailorConfig, errorTailorImports } from '@ngneat/error-tailor'

import {
  DialogButtonClicked,
  DialogPrimaryButtonDisabled,
  DialogResult,
  UserService
} from '@onecx/portal-integration-angular'

import { Bookmark, BookmarkScopeEnum } from 'src/app/shared/generated'

import { BookmarkCreateUpdateViewModel } from './bookmark-create-update.viewmodel'

@Component({
  standalone: true,
  imports: [
    errorTailorImports,
    FormsModule,
    MessagesModule,
    ReactiveFormsModule,
    SharedModule,
    TooltipModule,
    TranslateModule
  ],
  selector: 'app-bookmark-create-update',
  templateUrl: './bookmark-create-update.component.html',
  providers: [
    provideErrorTailorConfig({
      controlErrorsOn: { async: true, blur: true, change: true },
      errors: {
        useFactory: (i18n: TranslateService) => {
          return {
            required: () => i18n.instant('VALIDATION.ERRORS.EMPTY_REQUIRED_FIELD'),
            maxlength: ({ requiredLength }) =>
              i18n.instant('VALIDATION.ERRORS.MAXIMUM_LENGTH').replace('{{chars}}', requiredLength),
            minlength: ({ requiredLength }) =>
              i18n.instant('VALIDATION.ERRORS.MINIMUM_LENGTH').replace('{{chars}}', requiredLength),
            pattern: () => i18n.instant('VALIDATION.ERRORS.PATTERN_ERROR')
          }
        },
        deps: [TranslateService]
      },
      //this is required because primeng calendar wraps things in an ugly way
      blurPredicate: (element: Element) => {
        return ['INPUT', 'TEXTAREA', 'SELECT', 'CUSTOM-DATE', 'P-CALENDAR', 'P-DROPDOWN'].some(
          (selector) => element.tagName === selector
        )
      }
    })
  ]
})
export class BookmarkCreateUpdateComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<Bookmark | undefined>,
    DialogButtonClicked<BookmarkCreateUpdateComponent>,
    OnInit
{
  @Input() public vm: BookmarkCreateUpdateViewModel = {
    initialBookmark: undefined,
    permissions: undefined
  }
  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()

  public formGroup: FormGroup
  public dialogResult: Bookmark | undefined = undefined
  public isPublicBookmark = false

  constructor(
    private readonly userService: UserService,
    private readonly translate: TranslateService
  ) {
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
