import { ColumnType, DataTableColumn } from '@onecx/portal-integration-angular'

export const bookmarksSearchColumns: DataTableColumn[] = [
  //{ id: 'actions', columnType: ColumnType.STRING, nameKey: 'ACTIONS.LABEL', sortable: false },
  //{ id: 'scope', columnType: ColumnType.TRANSLATION_KEY, nameKey: 'BOOKMARK.SCOPE', sortable: true },
  { id: 'position', columnType: ColumnType.NUMBER, nameKey: 'BOOKMARK.POSITION', sortable: true },
  { id: 'displayName', columnType: ColumnType.STRING, nameKey: 'BOOKMARK.DISPLAY_NAME', sortable: true },
  { id: 'workspaceName', columnType: ColumnType.STRING, nameKey: 'BOOKMARK.WORKSPACE', sortable: true },
  { id: 'productName', columnType: ColumnType.STRING, nameKey: 'BOOKMARK.PRODUCT_NAME', sortable: true }
  //{ id: 'modificationDate', columnType: ColumnType.DATE, nameKey: 'INTERNAL.MODIFICATION_DATE', sortable: true }
  //{ id: 'appId', columnType: ColumnType.STRING, nameKey: 'BOOKMARK.APP_ID', sortable: true }
]
