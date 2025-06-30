import { BookmarkOverviewActions } from './bookmark-overview.actions'
import { bookmarkOverviewReducer, initialState } from './bookmark-overview.reducers'

describe('bookmark overview reducer', () => {
  it('should load data on search', () => {
    const failedAction = BookmarkOverviewActions.bookmarkSearchFailed({ errorText: '', exceptionKey: 'test' })
    const failedState = bookmarkOverviewReducer(initialState, failedAction)
    expect(failedState).toEqual({
      ...initialState,
      loading: false,
      exceptionKey: 'test'
    })

    const failedAction2 = BookmarkOverviewActions.bookmarkSearchFailed({ errorText: '' })
    const failedState2 = bookmarkOverviewReducer(initialState, failedAction2)
    expect(failedState2).toEqual({
      ...initialState,
      loading: false
    })
    const action = BookmarkOverviewActions.bookmarkSearchResultsReceived({
      results: [],
      totalNumberOfResults: 0
    })
    const nextState = bookmarkOverviewReducer(initialState, action)
    expect(nextState).toEqual({
      ...initialState,
      results: [],
      loading: false
    })
    expect(nextState).not.toBe(initialState)
  })
})
