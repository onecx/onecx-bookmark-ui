export type ExtendedColumn = {
  field: string
  header: string
  active?: boolean
  translationPrefix?: string
  hasFilter?: boolean
  isDate?: boolean
  isDropdown?: boolean
  limit?: boolean
  css?: string
  sort?: boolean
}

export const bookmarkColumns: ExtendedColumn[] = [
  {
    field: 'position',
    header: 'POSITION',
    active: true,
    translationPrefix: 'BOOKMARK',
    sort: true,
    css: 'text-center'
  },
  {
    field: 'displayName',
    header: 'DISPLAY_NAME',
    active: true,
    translationPrefix: 'BOOKMARK',
    limit: true,
    sort: true
  },
  {
    field: 'external',
    header: 'EXTERNAL.CONFIG',
    active: true,
    translationPrefix: 'BOOKMARK',
    css: 'text-center'
  },
  {
    field: 'target',
    header: 'TARGET.CONFIG',
    active: true,
    translationPrefix: 'BOOKMARK',
    css: 'text-center'
  },
  {
    field: 'url',
    header: 'URL_SEARCH',
    active: true,
    translationPrefix: 'BOOKMARK',
    limit: false,
    sort: true
  }
]
