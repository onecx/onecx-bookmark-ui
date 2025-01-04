import { DataTableColumn, RowListGridData } from '@onecx/portal-integration-angular'

export interface BookmarkSearchViewModel {
  columns: DataTableColumn[]
  results: RowListGridData[]
  bookmarkFilter: string
  scopeQuickFilter: string
}
