import { createReducer, on } from '@ngrx/store';
import { BookmarksSearchActions } from './bookmarks-search.actions';
import { bookmarksSearchColumns } from './bookmarks-search.columns';
import { BookmarksSearchState } from './bookmarks-search.state';

export const initialState: BookmarksSearchState = {
  columns: bookmarksSearchColumns,
  results: [],
  bookmarkFilter: '',
  scopeQuickFilter: 'BOOKMARK_TYPES.ALL'
};

export const bookmarksSearchReducer = createReducer(
  initialState,
  on(
    BookmarksSearchActions.bookmarksSearchResultsReceived,
    (state: BookmarksSearchState, { results }): BookmarksSearchState => ({
      ...state,
      results,
    })
  ),
  on(
    BookmarksSearchActions.bookmarksSearchResultsLoadingFailed,
    (state: BookmarksSearchState): BookmarksSearchState => ({
      ...state,
      results: [],
    })
  ),
  on(
    BookmarksSearchActions.bookmarkFilterChanged,
    (state: BookmarksSearchState, { bookmarkFilter }): BookmarksSearchState => ({
     ...state,
      bookmarkFilter
    })
  ),
  on(
    BookmarksSearchActions.scopeQuickFilterChanged,
    (state: BookmarksSearchState, { scopeQuickFilter }): BookmarksSearchState => ({
     ...state,
      scopeQuickFilter
    })
  )
);
