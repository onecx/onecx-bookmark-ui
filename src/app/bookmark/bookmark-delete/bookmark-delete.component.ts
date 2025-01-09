import { Component, Input } from '@angular/core'

import { Bookmark, BookmarkScopeEnum } from 'src/app/shared/generated'

@Component({
  selector: 'app-bookmark-delete',
  templateUrl: './bookmark-delete.component.html',
  styleUrl: './bookmark-delete.component.scss'
})
export class BookmarkDeleteComponent {
  @Input() public bookmark: Bookmark | undefined

  public BookmarkScopeEnum = BookmarkScopeEnum
  public Object = Object
}
