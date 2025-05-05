import { DataTableColumn, RowListGridData } from '@onecx/portal-integration-angular'

export interface BookmarkConfigureViewModel {
  columns: DataTableColumn[]
  results: RowListGridData[]
  bookmarkFilter: string
  scopeQuickFilter: string
  loading: boolean
  exceptionKey: string | null
}
