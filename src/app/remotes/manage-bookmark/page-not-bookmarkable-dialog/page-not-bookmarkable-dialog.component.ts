import { Component, Input } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { MessagesModule } from 'primeng/messages'
import { SharedModule } from 'primeng/api'

@Component({
  standalone: true,
  imports: [TranslateModule, MessagesModule, SharedModule],
  selector: 'app-page-not-bookmarkable-dialog',
  templateUrl: './page-not-bookmarkable-dialog.component.html',
  styleUrls: ['./page-not-bookmarkable-dialog.component.scss']
})
export class PageNotBookmarkableDialogComponent {
  @Input() public mfeBaseUrl: string | undefined
}
