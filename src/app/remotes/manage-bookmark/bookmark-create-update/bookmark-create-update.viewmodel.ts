import { Bookmark } from 'src/app/shared/generated'

export interface BookmarkCreateUpdateViewModel {
  initialBookmark: Bookmark | undefined
  permissions: string[] | undefined
  mode: 'CREATE' | 'EDIT'
}
