import { Bookmark } from 'src/app/shared/generated'

export interface BookmarkOverviewState {
  results: Bookmark[]
  loading: boolean
  exceptionKey: string | null
}
