import { createSelector } from '@ngrx/store'

import { createChildSelectors } from '@onecx/ngrx-accelerator'

import { bookmarkFeature } from '../bookmark.reducers'
import { initialState } from './bookmark-overview.reducers'
import { BookmarkOverviewViewModel } from './bookmark-overview.viewmodel'

export const bookmarkOverviewSelectors = createChildSelectors(bookmarkFeature.selectOverview, initialState)

export const selectResults = createSelector(bookmarkOverviewSelectors.selectResults, (results) => results)

export const selectBookmarkOverviewViewModel = createSelector(
  selectResults,
  bookmarkOverviewSelectors.selectLoading,
  bookmarkOverviewSelectors.selectExceptionKey,
  (results, loading, exceptionKey): BookmarkOverviewViewModel => ({ results, loading, exceptionKey })
)
