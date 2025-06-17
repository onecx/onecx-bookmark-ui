import { DataTableColumn } from '@onecx/angular-accelerator'

import { Bookmark } from 'src/app/shared/generated'

export interface BookmarkConfigureState {
  columns: DataTableColumn[]
  results: Bookmark[]
  bookmarkFilter: string
  scopeQuickFilter: string
  loading: boolean
  exceptionKey: string | null
}
