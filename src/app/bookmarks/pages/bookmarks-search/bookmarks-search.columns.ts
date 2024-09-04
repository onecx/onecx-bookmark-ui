import { ColumnType, DataTableColumn } from '@onecx/portal-integration-angular';

export const bookmarksSearchColumns: DataTableColumn[] = [
    {
        id: 'displayName',
        columnType: ColumnType.STRING,
        nameKey: 'BOOKMARKS_SEARCH.SORTING_OPTIONS.DISPLAY_NAME',
        sortable: true
    }
];
