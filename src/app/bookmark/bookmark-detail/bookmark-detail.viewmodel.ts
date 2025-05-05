import { CombinedBookmark } from './bookmark-detail.component'

export interface BookmarkDetailViewModel {
  initialBookmark: CombinedBookmark | undefined
  permissions: string[] | undefined
  changeMode: 'COPY' | 'CREATE' | 'EDIT' | 'VIEW'
}
