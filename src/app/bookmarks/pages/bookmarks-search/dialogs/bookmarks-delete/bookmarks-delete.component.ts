import { Component, Input } from '@angular/core'

import { Bookmark } from 'src/app/shared/generated'

@Component({
  selector: 'app-bookmarks-delete',
  templateUrl: './bookmarks-delete.component.html',
  styleUrl: './bookmarks-delete.component.scss'
})
export class BookmarksDeleteComponent {
  @Input() public bookmark: Bookmark | undefined
}
