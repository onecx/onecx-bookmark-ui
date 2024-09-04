import { combineReducers, createFeature } from '@ngrx/store';
import { BookmarksState } from './bookmarks.state';
import { bookmarksSearchReducer } from './pages/bookmarks-search/bookmarks-search.reducers';

export const bookmarksFeature = createFeature({
  name: 'bookmarks',
  reducer: combineReducers<BookmarksState>({
    search: bookmarksSearchReducer,
  }),
});
