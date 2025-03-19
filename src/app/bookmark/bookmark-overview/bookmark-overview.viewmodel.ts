import { Bookmark } from 'src/app/shared/generated'

export interface BookmarkOverviewViewModel {
  results: Bookmark[]
  loading: boolean
  exceptionKey: string | null
}
