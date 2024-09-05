import { createActionGroup, emptyProps, props } from '@ngrx/store'
import { Bookmark } from 'src/app/shared/generated'

export const BookmarksSearchActions = createActionGroup({
  source: 'BookmarksSearch',
  events: {
    'Edit bookmarks button clicked': props<{
      id: number | string
    }>(),
    'Update bookmarks cancelled': emptyProps(),
    'Update bookmarks succeeded': emptyProps(),
    'Update bookmarks failed': props<{
      error: string | null
    }>(),
    'Delete bookmarks button clicked': props<{
      id: number | string
    }>(),
    'Delete bookmarks cancelled': emptyProps(),
    'Delete bookmarks succeeded': emptyProps(),
    'Delete bookmarks failed': props<{
      error: string | null
    }>(),
    'Search triggered': emptyProps(),
    'bookmarks search results received': props<{
      results: Bookmark[]
      totalNumberOfResults: number
    }>(),
    'bookmarks search results loading failed': props<{
      error: string | null
    }>(),
    'Export button clicked': emptyProps(),
    'Bookmark filter changed': props<{
      bookmarkFilter: string
    }>(),
    'Scope quick filter changed': props<{
      scopeQuickFilter: string
    }>()
  }
})
