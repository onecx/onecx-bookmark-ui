import { DataTableColumn, RowListGridData } from '@onecx/angular-accelerator'

export interface BookmarkConfigureViewModel {
  columns: DataTableColumn[]
  results: RowListGridData[]
  bookmarkFilter: string
  scopeQuickFilter: string
  loading: boolean
  exceptionKey: string | null
}
