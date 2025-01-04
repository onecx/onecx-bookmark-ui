import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'

import { FloatLabelModule } from 'primeng/floatlabel'
import { InputGroupModule } from 'primeng/inputgroup'
import { InputTextModule } from 'primeng/inputtext'
import { TooltipModule } from 'primeng/tooltip'

import { BookmarkCreateUpdateComponent } from './components/dialogs/bookmark-create-update/bookmark-create-update.component'

@NgModule({
  declarations: [BookmarkCreateUpdateComponent],
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
  exports: [BookmarkCreateUpdateComponent, FloatLabelModule, InputGroupModule],
  providers: []
})
export class SharedModule {}
