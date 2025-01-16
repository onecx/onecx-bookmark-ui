import { Bookmark } from 'src/app/shared/generated'

export interface BookmarkDetailViewModel {
  initialBookmark: Bookmark | undefined
  permissions: string[] | undefined
  changeMode: 'CREATE' | 'EDIT' | 'VIEW'
}
