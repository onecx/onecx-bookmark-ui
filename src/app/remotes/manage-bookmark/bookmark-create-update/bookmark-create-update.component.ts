import { Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { provideErrorTailorConfig, errorTailorImports } from '@ngneat/error-tailor'
import { map } from 'rxjs'

import { MessagesModule } from 'primeng/messages'
import { InputTextModule } from 'primeng/inputtext'
import { FloatLabelModule } from 'primeng/floatlabel'
import { TooltipModule } from 'primeng/tooltip'

import { UserService } from '@onecx/angular-integration-interface'
import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/angular-accelerator'

import { Bookmark, BookmarkScope } from 'src/app/shared/generated'

import { BookmarkCreateUpdateViewModel } from './bookmark-create-update.viewmodel'

@Component({
  selector: 'app-bookmark-create-update',
  imports: [
    errorTailorImports,
    FloatLabelModule,
    InputTextModule,
    MessagesModule,
    ReactiveFormsModule,
    TooltipModule,
    TranslateModule
  ],
  templateUrl: './bookmark-create-update.component.html',
  styleUrl: './bookmark-create-update.component.scss',
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
        return ['INPUT', 'TEXTAREA', 'SELECT', 'CUSTOM-DATE', 'P-CALENDAR', 'P-DROPDOWN'].includes(element.tagName)
      }
    })
  ]
})
export class BookmarkCreateUpdateComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<Bookmark | undefined>,
    DialogButtonClicked<BookmarkCreateUpdateComponent>,
    OnChanges
{
  private readonly userService = inject(UserService)
  private readonly translate = inject(TranslateService)

  @Input() public vm: BookmarkCreateUpdateViewModel = {
    initialBookmark: undefined,
    permissions: undefined,
    mode: 'CREATE'
  }
  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter()

  public formGroup: FormGroup
  public dialogResult: Bookmark | undefined = undefined
  public isPublicBookmark = false
  private permissionKey = ''
  private hasPermission = false

  constructor() {
    this.formGroup = new FormGroup<{ displayName: FormControl<string | null> }>({
      displayName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)])
    })
  }

  ocxDialogButtonClicked() {
    this.dialogResult = {
      ...this.vm.initialBookmark,
      ...this.formGroup.value
    }
  }

  public ngOnChanges() {
    if (this.vm.initialBookmark) {
      this.formGroup.patchValue({
        ...this.vm.initialBookmark
      })
      if (this.vm.initialBookmark.scope === BookmarkScope.Public) {
        this.isPublicBookmark = true
      }
    }
    this.permissionKey = 'BOOKMARK#' + this.vm.mode
    this.hasEditPermission().then((hasPermission) => {
      this.hasPermission = hasPermission
      if (!this.hasPermission || this.isPublicBookmark) {
        this.formGroup.disable()
      }
    })

    // align button status according to form validation
    this.formGroup.statusChanges
      .pipe(
        map((status) => {
          return status === 'VALID'
        })
      )
      .subscribe((val) => {
        if (!this.hasPermission || this.isPublicBookmark) {
          this.primaryButtonEnabled.emit(false)
        } else {
          this.primaryButtonEnabled.emit(val)
        }
      })
    // wait a moment for initialization to activate the primary button
    setTimeout(() => {
      this.primaryButtonEnabled.emit(true)
    }, 500)
  }

  private async hasEditPermission(): Promise<boolean> {
    if (this.vm.permissions) {
      return this.vm.permissions.includes(this.permissionKey)
    }
    return this.userService.hasPermission(this.permissionKey)
  }
}
