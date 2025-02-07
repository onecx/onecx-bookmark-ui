import { createReducer, on } from '@ngrx/store'

import { ActionErrorType, BookmarkSearchActions } from './bookmark-search.actions'
import { bookmarkSearchColumns } from './bookmark-search.columns'
import { BookmarkSearchState } from './bookmark-search.state'

export const initialState: BookmarkSearchState = {
  columns: bookmarkSearchColumns,
  results: [],
  bookmarkFilter: '',
  scopeQuickFilter: 'PRIVATE',
  loading: true,
  exceptionKey: null
}

export const bookmarkSearchReducer = createReducer(
  initialState,
  on(
    BookmarkSearchActions.bookmarkSearchResultsReceived,
    (state: BookmarkSearchState, { results }): BookmarkSearchState => ({ ...state, results, loading: false })
  ),
  on(
    BookmarkSearchActions.bookmarkSearchFailed,
    (state: BookmarkSearchState, error: ActionErrorType): BookmarkSearchState => ({
      ...state,
      results: [],
      loading: false,
      exceptionKey: error.exceptionKey ?? null
    })
  ),
  on(
    BookmarkSearchActions.bookmarkFilterChanged,
    (state: BookmarkSearchState, { bookmarkFilter }): BookmarkSearchState => ({ ...state, bookmarkFilter })
  ),
  on(
    BookmarkSearchActions.scopeQuickFilterChanged,
    (state: BookmarkSearchState, { scopeQuickFilter }): BookmarkSearchState => ({ ...state, scopeQuickFilter })
  )
)
