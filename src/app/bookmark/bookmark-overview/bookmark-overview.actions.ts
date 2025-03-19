import { createActionGroup, emptyProps, props } from '@ngrx/store'

import { Bookmark } from 'src/app/shared/generated'

export type ActionErrorType = { status?: string | null; errorText?: string | null; exceptionKey?: string | null }

export const BookmarkOverviewActions = createActionGroup({
  source: 'BookmarkOverview',
  events: {
    // search
    Search: emptyProps(),
    'Bookmark search results received': props<{ results: Bookmark[]; totalNumberOfResults: number }>(),
    'Bookmark search failed': props<ActionErrorType>()
  }
})
