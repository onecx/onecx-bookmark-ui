import {
  DataTableColumn,
  RowListGridData,
} from '@onecx/portal-integration-angular';

export interface BookmarksSearchViewModel {
  columns: DataTableColumn[];
  results: RowListGridData[];
  bookmarkFilter: string;
  scopeQuickFilter: string;
}
