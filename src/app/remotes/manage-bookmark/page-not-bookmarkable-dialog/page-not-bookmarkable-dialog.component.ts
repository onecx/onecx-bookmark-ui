import { Component, Input } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'

import { MessagesModule } from 'primeng/messages'

@Component({
  selector: 'app-page-not-bookmarkable-dialog',
  standalone: true,
  imports: [TranslateModule, MessagesModule],
  templateUrl: './page-not-bookmarkable-dialog.component.html',
  styleUrl: './page-not-bookmarkable-dialog.component.scss'
})
export class PageNotBookmarkableDialogComponent {
  @Input() public mfeBaseUrl: string | undefined
}
