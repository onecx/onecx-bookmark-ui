import { createActionGroup, emptyProps, props } from '@ngrx/store'

import { Bookmark } from 'src/app/shared/generated'

export type ActionErrorType = { status?: string | null; errorText?: string | null; exceptionKey?: string | null }

export const BookmarkSearchActions = createActionGroup({
  source: 'BookmarkSearch',
  events: {
    // search
    Search: emptyProps(),
    'Bookmark filter changed': props<{ bookmarkFilter: string }>(),
    'Scope quick filter changed': props<{ scopeQuickFilter: string }>(),
    'Bookmark search results received': props<{ results: Bookmark[]; totalNumberOfResults: number }>(),
    'Bookmark search failed': props<ActionErrorType>(),
    // sorting
    'Open sorting dialog': emptyProps(),
    'Sort bookmarks cancelled': emptyProps(),
    'Sort bookmarks succeeded': emptyProps(),
    'Sort bookmarks failed': props<ActionErrorType>(),
    // extras
    'Export button clicked': emptyProps(),
    // detail: create, edit, view
    'Open detail dialog': props<{ id: number | string }>(),
    'Update bookmarks cancelled': emptyProps(),
    'Update bookmarks succeeded': emptyProps(),
    'Update bookmarks failed': props<ActionErrorType>(),
    // delete
    'Open delete dialog': props<{ id: number | string }>(),
    'Delete bookmarks cancelled': emptyProps(),
    'Delete bookmarks succeeded': emptyProps(),
    'Delete bookmarks failed': props<ActionErrorType>()
  }
})
