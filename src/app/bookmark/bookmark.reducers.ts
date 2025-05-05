import { combineReducers, createFeature } from '@ngrx/store'

import { BookmarkState } from './bookmark.state'
import { bookmarkOverviewReducer } from './bookmark-overview/bookmark-overview.reducers'
import { bookmarkConfigureReducer } from './bookmark-configure/bookmark-configure.reducers'

export const bookmarkFeature = createFeature({
  name: 'bookmarks',
  reducer: combineReducers<BookmarkState>({
    configure: bookmarkConfigureReducer,
    overview: bookmarkOverviewReducer
  })
})
