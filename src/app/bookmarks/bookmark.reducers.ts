import { combineReducers, createFeature } from '@ngrx/store'

import { BookmarkState } from './bookmark.state'
import { bookmarkSearchReducer } from './pages/bookmark-search/bookmark-search.reducers'

export const bookmarkFeature = createFeature({
  name: 'bookmarks',
  reducer: combineReducers<BookmarkState>({
    search: bookmarkSearchReducer
  })
})
