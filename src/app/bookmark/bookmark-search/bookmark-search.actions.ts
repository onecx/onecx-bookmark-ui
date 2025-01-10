import { createActionGroup, emptyProps, props } from '@ngrx/store'

import { Bookmark } from 'src/app/shared/generated'

export const BookmarkSearchActions = createActionGroup({
  source: 'BookmarkSearch',
  events: {
    // search
    Search: emptyProps(),
    'Bookmark filter changed': props<{ bookmarkFilter: string }>(),
    'Scope quick filter changed': props<{ scopeQuickFilter: string }>(),
    'Bookmark search results received': props<{ results: Bookmark[]; totalNumberOfResults: number }>(),
    'Bookmark search results loading failed': props<{ error: string | null }>(),
    // sorting
    'Open sorting dialog': emptyProps(),
    'Sort bookmarks cancelled': emptyProps(),
    'Sort bookmarks succeeded': emptyProps(),
    'Sort bookmarks failed': props<{ error: string | null }>(),
    // extras
    'Export button clicked': emptyProps(),
    // detail
    'Open detail dialog': props<{ id: number | string }>(),
    'Update bookmarks cancelled': emptyProps(),
    'Update bookmarks succeeded': emptyProps(),
    'Update bookmarks failed': props<{ error: string | null }>(),
    // delete
    'Open delete dialog': props<{ id: number | string }>(),
    'Delete bookmarks cancelled': emptyProps(),
    'Delete bookmarks succeeded': emptyProps(),
    'Delete bookmarks failed': props<{ error: string | null }>()
  }
})
