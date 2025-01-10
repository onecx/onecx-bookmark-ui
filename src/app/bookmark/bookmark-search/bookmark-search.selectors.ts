import { createSelector } from '@ngrx/store'

import { createChildSelectors } from '@onecx/ngrx-accelerator'

import { bookmarkFeature } from '../bookmark.reducers'
import { initialState } from './bookmark-search.reducers'
import { BookmarkSearchViewModel } from './bookmark-search.viewmodel'

export const bookmarkSearchSelectors = createChildSelectors(bookmarkFeature.selectSearch, initialState)

export const selectResults = createSelector(
  bookmarkSearchSelectors.selectResults,
  bookmarkSearchSelectors.selectBookmarkFilter,
  bookmarkSearchSelectors.selectScopeQuickFilter,
  (results, bookmarkFilter, scopeQuickFilter) => {
    return results
      .map((item) => ({
        imagePath: '',
        ...item,
        scope_key: 'BOOKMARK.SCOPES.' + item.scope
      }))
      .filter((item) => {
        return (
          item.displayName?.toLowerCase().includes(bookmarkFilter.toLowerCase()) && item.scope_key === scopeQuickFilter
        )
      })
  }
)

export const selectBookmarkSearchViewModel = createSelector(
  bookmarkSearchSelectors.selectColumns,
  selectResults,
  bookmarkSearchSelectors.selectBookmarkFilter,
  bookmarkSearchSelectors.selectScopeQuickFilter,
  bookmarkSearchSelectors.selectLoading,
  bookmarkSearchSelectors.selectExceptionKey,
  (columns, results, bookmarkFilter, scopeQuickFilter, loading, exceptionKey): BookmarkSearchViewModel => ({
    columns,
    results,
    bookmarkFilter,
    scopeQuickFilter,
    loading,
    exceptionKey
  })
)
