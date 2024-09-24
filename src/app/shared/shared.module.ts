import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputGroupModule } from 'primeng/inputgroup'

@NgModule({
  declarations: [],
  imports: [CommonModule, FloatLabelModule, InputGroupModule],
  exports: [FloatLabelModule, InputGroupModule],
  providers: []
})
export class SharedModule {}
