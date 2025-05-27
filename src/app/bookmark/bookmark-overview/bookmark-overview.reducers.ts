import { createReducer, on } from '@ngrx/store'

import { ActionErrorType, BookmarkOverviewActions } from './bookmark-overview.actions'
import { BookmarkOverviewState } from './bookmark-overview.state'

export const initialState: BookmarkOverviewState = {
  results: [],
  loading: true,
  exceptionKey: null
}

export const bookmarkOverviewReducer = createReducer(
  initialState,
  on(
    BookmarkOverviewActions.bookmarkSearchResultsReceived,
    (state: BookmarkOverviewState, { results }): BookmarkOverviewState => ({
      ...state,
      results,
      loading: false
    })
  ),
  on(
    BookmarkOverviewActions.bookmarkSearchFailed,
    (state: BookmarkOverviewState, error: ActionErrorType): BookmarkOverviewState => ({
      ...state,
      results: [],
      loading: false,
      exceptionKey: error.exceptionKey ?? null
    })
  )
)
