import { createFeatureSelector } from '@ngrx/store';
import { bookmarksFeature } from './bookmarks.reducers';
import { BookmarksState } from './bookmarks.state';

export const selectBookmarksFeature = createFeatureSelector<BookmarksState>(
  bookmarksFeature.name
);
