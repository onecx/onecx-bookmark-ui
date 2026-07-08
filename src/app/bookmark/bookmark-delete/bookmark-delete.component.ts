import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { ButtonModule } from 'primeng/button'
import { TooltipModule } from 'primeng/tooltip'

import { AngularAcceleratorModule } from '@onecx/angular-accelerator'
import { AngularAuthModule } from '@onecx/angular-auth'
import { Bookmark, BookmarkScope } from 'src/app/shared/generated'

@Component({
  selector: 'app-bookmark-delete',
  templateUrl: './bookmark-delete.component.html',
  styleUrl: './bookmark-delete.component.scss',
  standalone: true,
  imports: [AngularAcceleratorModule, AngularAuthModule, ButtonModule, CommonModule, TooltipModule, TranslateModule]
})
export class BookmarkDeleteComponent {
  @Input() public bookmark: Bookmark | undefined

  public BookmarkScope = BookmarkScope
  public Object = Object

  public limitText(text: string | null | undefined, limit: number): string {
    if (text) {
      return text.length < limit ? text : text.substring(0, limit) + '...'
    } else {
      return ''
    }
  }
}
