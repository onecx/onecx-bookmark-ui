import { createActionGroup, emptyProps, props } from '@ngrx/store'

import { Bookmark } from 'src/app/shared/generated'

export const BookmarkSearchActions = createActionGroup({
  source: 'BookmarkSearch',
  events: {
    // search
    Search: emptyProps(),
    'Bookmark filter changed': props<{ bookmarkFilter: string }>(),
    'Scope quick filter changed': props<{ scopeQuickFilter: string }>(),
    'bookmark search results received': props<{ results: Bookmark[]; totalNumberOfResults: number }>(),
    'bookmark search results loading failed': props<{ error: string | null }>(),
    'Export button clicked': emptyProps(),
    // detail
    'open detail dialog': props<{ id: number | string }>(),
    'Update bookmarks cancelled': emptyProps(),
    'Update bookmarks succeeded': emptyProps(),
    'Update bookmarks failed': props<{ error: string | null }>(),
    'Delete bookmarks button clicked': props<{ id: number | string }>(),
    'Delete bookmarks cancelled': emptyProps(),
    'Delete bookmarks succeeded': emptyProps(),
    'Delete bookmarks failed': props<{ error: string | null }>()
  }
})
