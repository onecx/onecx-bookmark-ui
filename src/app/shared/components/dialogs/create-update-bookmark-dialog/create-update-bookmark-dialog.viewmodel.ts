import { Bookmark } from 'src/app/shared/generated'

export interface CreateUpdateBookmarkDialogViewModel {
  initialBookmark: Bookmark | undefined
  permissions: string[] | undefined
}
