import { createReducer, on } from '@ngrx/store'

import { BookmarkSearchActions } from './bookmark-search.actions'
import { bookmarkSearchColumns } from './bookmark-search.columns'
import { BookmarkSearchState } from './bookmark-search.state'

export const initialState: BookmarkSearchState = {
  columns: bookmarkSearchColumns,
  results: [],
  bookmarkFilter: '',
  scopeQuickFilter: 'BOOKMARK.SCOPES.PRIVATE',
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
    BookmarkSearchActions.bookmarkSearchResultsLoadingFailed,
    (state: BookmarkSearchState, { error }): BookmarkSearchState => ({
      ...state,
      results: [],
      loading: false,
      exceptionKey: error
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
