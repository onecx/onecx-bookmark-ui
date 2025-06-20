import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { provideErrorTailorConfig, errorTailorImports } from '@ngneat/error-tailor'

import { DockModule } from 'primeng/dock'
import { FileUploadModule } from 'primeng/fileupload'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputGroupModule } from 'primeng/inputgroup'
import { InputTextModule } from 'primeng/inputtext'
import { InputTextareaModule } from 'primeng/inputtextarea'
import { OrderListModule } from 'primeng/orderlist'
import { RadioButtonModule } from 'primeng/radiobutton'
import { RippleModule } from 'primeng/ripple'
import { SkeletonModule } from 'primeng/skeleton'
import { TabViewModule } from 'primeng/tabview'
import { TooltipModule } from 'primeng/tooltip'

import { LabelResolver } from 'src/app/shared/utils/label.resolver'

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DockModule,
    FileUploadModule,
    FloatLabelModule,
    FormsModule,
    InputGroupModule,
    InputTextModule,
    InputTextareaModule,
    OrderListModule,
    RadioButtonModule,
    ReactiveFormsModule,
    RippleModule,
    SkeletonModule,
    TabViewModule,
    TooltipModule,
    TranslateModule,
    errorTailorImports
  ],
  exports: [
    DockModule,
    FileUploadModule,
    FloatLabelModule,
    FormsModule,
    InputGroupModule,
    InputTextModule,
    InputTextareaModule,
    OrderListModule,
    RadioButtonModule,
    ReactiveFormsModule,
    RippleModule,
    SkeletonModule,
    TabViewModule,
    TooltipModule,
    TranslateModule,
    errorTailorImports
  ],
  providers: [
    LabelResolver,
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
export class SharedModule {}
