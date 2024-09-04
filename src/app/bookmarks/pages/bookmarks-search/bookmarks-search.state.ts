import { DataTableColumn } from '@onecx/portal-integration-angular';
import { Bookmark } from 'src/app/shared/generated';

export interface BookmarksSearchState {
  columns: DataTableColumn[];
  results: Bookmark[];
  bookmarkFilter: string;
  scopeQuickFilter: string;
}
