import { Component, Input } from '@angular/core'

import { Bookmark, BookmarkScope } from 'src/app/shared/generated'

@Component({
  selector: 'app-bookmark-delete',
  templateUrl: './bookmark-delete.component.html',
  styleUrl: './bookmark-delete.component.scss'
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
