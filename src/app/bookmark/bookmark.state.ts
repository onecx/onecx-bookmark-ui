import { BookmarkConfigureState } from './bookmark-configure/bookmark-configure.state'
import { BookmarkOverviewState } from './bookmark-overview/bookmark-overview.state'

export interface BookmarkState {
  configure: BookmarkConfigureState
  overview: BookmarkOverviewState
}
