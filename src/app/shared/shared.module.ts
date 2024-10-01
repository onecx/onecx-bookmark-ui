import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputGroupModule } from 'primeng/inputgroup'
import { CreateUpdateBookmarkDialogComponent } from './components/dialogs/create-update-bookmark-dialog/create-update-bookmark-dialog.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { InputTextModule } from 'primeng/inputtext'

@NgModule({
  declarations: [CreateUpdateBookmarkDialogComponent],
  imports: [
    CommonModule,
    FloatLabelModule,
    InputGroupModule,
    InputTextModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule
  ],
  exports: [FloatLabelModule, InputGroupModule, CreateUpdateBookmarkDialogComponent],
  providers: []
})
export class SharedModule {}
