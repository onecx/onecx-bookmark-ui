import { Component, Input } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'

import { ButtonModule } from 'primeng/button'
import { TooltipModule } from 'primeng/tooltip'

import { AngularAcceleratorModule } from '@onecx/angular-accelerator'
import { AngularAuthModule } from '@onecx/angular-auth'

import { Bookmark, BookmarkScope } from 'src/app/shared/generated'
import { Utils } from 'src/app/shared/utils/utils'

@Component({
  selector: 'app-bookmark-delete',
  templateUrl: './bookmark-delete.component.html',
  styleUrl: './bookmark-delete.component.scss',
  standalone: true,
  imports: [AngularAcceleratorModule, AngularAuthModule, ButtonModule, TooltipModule, TranslateModule]
})
export class BookmarkDeleteComponent {
  @Input() public bookmark: Bookmark | undefined

  public BookmarkScope = BookmarkScope
  public Object = Object
  public limitText = Utils.limitText
}
