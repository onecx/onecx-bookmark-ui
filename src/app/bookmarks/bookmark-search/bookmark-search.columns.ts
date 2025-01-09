import { ColumnType, DataTableColumn } from '@onecx/portal-integration-angular'

export const bookmarkSearchColumns: DataTableColumn[] = [
  //{ id: 'actions', columnType: ColumnType.STRING, nameKey: 'ACTIONS.LABEL', sortable: false },
  //{ id: 'scope_key', columnType: ColumnType.TRANSLATION_KEY, nameKey: 'BOOKMARK.SCOPE', sortable: true },
  { id: 'position', columnType: ColumnType.NUMBER, nameKey: 'BOOKMARK.POSITION', sortable: true },
  { id: 'displayName', columnType: ColumnType.STRING, nameKey: 'BOOKMARK.DISPLAY_NAME', sortable: true },
  { id: 'productName', columnType: ColumnType.STRING, nameKey: 'BOOKMARK.PRODUCT', sortable: true },
  { id: 'endpointName', columnType: ColumnType.STRING, nameKey: 'BOOKMARK.ENDPOINT', sortable: true }
  //{ id: 'modificationDate', columnType: ColumnType.DATE, nameKey: 'INTERNAL.MODIFICATION_DATE', sortable: true }
]
