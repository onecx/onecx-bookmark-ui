import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/portal-integration-angular/ngrx'
import { bookmarksFeature } from '../../bookmarks.reducers'
import { initialState } from './bookmarks-search.reducers'
import { BookmarksSearchViewModel } from './bookmarks-search.viewmodel'
import { BookmarkScopeEnum } from 'src/app/shared/generated'

export const bookmarksSearchSelectors = createChildSelectors(bookmarksFeature.selectSearch, initialState)

export const selectResults = createSelector(
  bookmarksSearchSelectors.selectResults,
  bookmarksSearchSelectors.selectBookmarkFilter,
  bookmarksSearchSelectors.selectScopeQuickFilter,
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

export const selectBookmarksSearchViewModel = createSelector(
  bookmarksSearchSelectors.selectColumns,
  selectResults,
  bookmarksSearchSelectors.selectBookmarkFilter,
  bookmarksSearchSelectors.selectScopeQuickFilter,
  (columns, results, bookmarkFilter, scopeQuickFilter): BookmarksSearchViewModel => ({
    columns,
    results,
    bookmarkFilter,
    scopeQuickFilter
  })
)
