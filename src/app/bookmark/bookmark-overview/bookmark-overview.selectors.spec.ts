import { BookmarkScope } from 'src/app/shared/generated'
import { selectBookmarkOverviewViewModel, selectResults } from './bookmark-overview.selectors'

describe('bookmark-overview selectors', () => {
  describe('selectResults', () => {
    it('should pass through results unchanged', () => {
      const results = [
        { id: '1', position: 1, scope: BookmarkScope.Private, workspaceName: 'ws', displayName: 'B1' },
        { id: '2', position: 2, scope: BookmarkScope.Public, workspaceName: 'ws', displayName: 'B2' }
      ]
      expect(selectResults.projector(results)).toEqual(results)
    })
  })

  describe('selectBookmarkOverviewViewModel', () => {
    it('should compose results, loading and exceptionKey into a view model', () => {
      const results = [{ id: '1', position: 1, scope: BookmarkScope.Private, workspaceName: 'ws', displayName: 'B1' }]
      expect(selectBookmarkOverviewViewModel.projector(results, true, 'SOME_ERROR')).toEqual({
        results,
        loading: true,
        exceptionKey: 'SOME_ERROR'
      })
    })

    it('should produce a view model with empty results and no error', () => {
      expect(selectBookmarkOverviewViewModel.projector([], false, null)).toEqual({
        results: [],
        loading: false,
        exceptionKey: null
      })
    })
  })
})
