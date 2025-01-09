import { createSelector } from '@ngrx/store'

import { createChildSelectors } from '@onecx/ngrx-accelerator'

import { BookmarkScopeEnum } from 'src/app/shared/generated'

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
        scope: item.scope === BookmarkScopeEnum.Private ? 'BOOKMARK.SCOPES.PRIVATE' : 'BOOKMARK.SCOPES.PUBLIC'
      }))
      .filter((item) => {
        if (scopeQuickFilter && scopeQuickFilter != 'BOOKMARK.SCOPES.ALL') {
          return (
            item.displayName?.toLowerCase().includes(bookmarkFilter.toLowerCase()) && item.scope === scopeQuickFilter
          )
        }
        return item.displayName?.toLowerCase().includes(bookmarkFilter.toLowerCase())
      })
  }
)

export const selectBookmarkSearchViewModel = createSelector(
  bookmarkSearchSelectors.selectColumns,
  selectResults,
  bookmarkSearchSelectors.selectBookmarkFilter,
  bookmarkSearchSelectors.selectScopeQuickFilter,
  (columns, results, bookmarkFilter, scopeQuickFilter): BookmarkSearchViewModel => ({
    columns,
    results,
    bookmarkFilter,
    scopeQuickFilter
  })
)
