import { DataTableColumn } from '@onecx/portal-integration-angular'

import { Bookmark } from 'src/app/shared/generated'

export interface BookmarkSearchState {
  columns: DataTableColumn[]
  results: Bookmark[]
  bookmarkFilter: string
  scopeQuickFilter: string
  loading: boolean
  exceptionKey: string | null
}
