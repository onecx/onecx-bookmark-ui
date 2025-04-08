import { createReducer, on } from '@ngrx/store'

import { ActionErrorType, BookmarkConfigureActions } from './bookmark-configure.actions'
import { BookmarkConfigureState } from './bookmark-configure.state'

export const initialState: BookmarkConfigureState = {
  columns: [],
  results: [],
  bookmarkFilter: '',
  scopeQuickFilter: 'PRIVATE',
  loading: true,
  exceptionKey: null
}

export const bookmarkConfigureReducer = createReducer(
  initialState,
  on(
    BookmarkConfigureActions.bookmarkSearchResultsReceived,
    (state: BookmarkConfigureState, { results }): BookmarkConfigureState => ({ ...state, results, loading: false })
  ),
  on(
    BookmarkConfigureActions.bookmarkSearchFailed,
    (state: BookmarkConfigureState, error: ActionErrorType): BookmarkConfigureState => ({
      ...state,
      results: [],
      loading: false,
      exceptionKey: error.exceptionKey ?? null
    })
  ),
  on(
    BookmarkConfigureActions.bookmarkFilterChanged,
    (state: BookmarkConfigureState, { bookmarkFilter }): BookmarkConfigureState => ({ ...state, bookmarkFilter })
  ),
  on(
    BookmarkConfigureActions.scopeQuickFilterChanged,
    (state: BookmarkConfigureState, { scopeQuickFilter }): BookmarkConfigureState => ({ ...state, scopeQuickFilter })
  )
)
