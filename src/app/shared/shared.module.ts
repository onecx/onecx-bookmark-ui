import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'

import { FloatLabelModule } from 'primeng/floatlabel'
import { InputGroupModule } from 'primeng/inputgroup'
import { InputTextModule } from 'primeng/inputtext'
import { TooltipModule } from 'primeng/tooltip'

import { CreateUpdateBookmarkDialogComponent } from './components/dialogs/create-update-bookmark-dialog/create-update-bookmark-dialog.component'

@NgModule({
  declarations: [CreateUpdateBookmarkDialogComponent],
  imports: [
    CommonModule,
    FloatLabelModule,
    FormsModule,
    InputGroupModule,
    InputTextModule,
    ReactiveFormsModule,
    TooltipModule,
    TranslateModule
  ],
  exports: [CreateUpdateBookmarkDialogComponent, FloatLabelModule, InputGroupModule],
  providers: []
})
export class SharedModule {}
