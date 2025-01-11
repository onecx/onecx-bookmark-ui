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
    'Create bookmark': props<{ id: number | string }>(),
    'Create bookmark cancelled': emptyProps(),
    'Create bookmark succeeded': emptyProps(),
    'Create bookmark failed': props<ActionErrorType>(),
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
