import { BookmarkConfigureActions } from './bookmark-configure.actions'
import { bookmarkConfigureReducer, initialState } from './bookmark-configure.reducers'

describe('bookmark configure reducer', () => {
  it('should load data on search', () => {
    const failedAction = BookmarkConfigureActions.bookmarkSearchFailed({ errorText: '', exceptionKey: 'test' })
    const failedState = bookmarkConfigureReducer(initialState, failedAction)
    expect(failedState).toEqual({
      ...initialState,
      loading: false,
      exceptionKey: 'test'
    })

    const failedAction2 = BookmarkConfigureActions.bookmarkSearchFailed({ errorText: '' })
    const failedState2 = bookmarkConfigureReducer(initialState, failedAction2)
    expect(failedState2).toEqual({
      ...initialState,
      loading: false
    })
    const action = BookmarkConfigureActions.bookmarkSearchResultsReceived({
      results: [],
      totalNumberOfResults: 0
    })
    const nextState = bookmarkConfigureReducer(initialState, action)
    expect(nextState).toEqual({
      ...initialState,
      results: [],
      loading: false
    })
    expect(nextState).not.toBe(initialState)
  })

  it('should update filter ', () => {
    const action = BookmarkConfigureActions.bookmarkFilterChanged({
      bookmarkFilter: 'test'
    })
    const nextState = bookmarkConfigureReducer(initialState, action)
    expect(nextState).toEqual({
      ...initialState,
      bookmarkFilter: 'test'
    })
    expect(nextState).not.toBe(initialState)
  })

  it('should update quick-filter ', () => {
    const action = BookmarkConfigureActions.scopeQuickFilterChanged({
      scopeQuickFilter: 'test'
    })
    const nextState = bookmarkConfigureReducer(initialState, action)
    expect(nextState).toEqual({
      ...initialState,
      scopeQuickFilter: 'test'
    })
    expect(nextState).not.toBe(initialState)
  })
})
