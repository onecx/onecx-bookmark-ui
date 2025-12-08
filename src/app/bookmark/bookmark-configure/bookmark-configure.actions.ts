import { createActionGroup, emptyProps, props } from '@ngrx/store'

import { Bookmark } from 'src/app/shared/generated'

export type ActionErrorType = { status?: string | null; errorText?: string | null; exceptionKey?: string | null }

export const BookmarkConfigureActions = createActionGroup({
  source: 'BookmarkConfigure',
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
    // export
    'Export bookmarks': emptyProps(),
    'Export bookmarks cancelled': emptyProps(),
    'Export bookmarks succeeded': emptyProps(),
    'Export bookmarks failed': props<ActionErrorType>(),
    // import
    'Import bookmarks': emptyProps(),
    'Import bookmarks cancelled': emptyProps(),
    'Import bookmarks succeeded': emptyProps(),
    'Import bookmarks failed': props<ActionErrorType>(),
    // detail: create URL bookmark
    'Create bookmark': emptyProps(),
    'Create bookmark cancelled': emptyProps(),
    'Create bookmark succeeded': emptyProps(),
    'Create bookmark failed': props<ActionErrorType>(),
    // detail: copy
    'Copy bookmark': props<{ id: number | string }>(),
    // detail: edit, view
    'Toggle Bookmark': props<{ id: number | string }>(),
    'View or edit Bookmark': props<{ id: number | string }>(),
    'Edit bookmark cancelled': emptyProps(),
    'Edit bookmark succeeded': emptyProps(),
    'Edit bookmark failed': props<ActionErrorType>(),
    // delete
    'Open delete dialog': props<{ id: number | string }>(),
    'Delete bookmark cancelled': emptyProps(),
    'Delete bookmark succeeded': emptyProps(),
    'Delete bookmark failed': props<ActionErrorType>()
  }
})
