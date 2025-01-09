import { createFeatureSelector } from '@ngrx/store'

import { bookmarkFeature } from './bookmark.reducers'
import { BookmarkState } from './bookmark.state'

export const selectBookmarkFeature = createFeatureSelector<BookmarkState>(bookmarkFeature.name)
