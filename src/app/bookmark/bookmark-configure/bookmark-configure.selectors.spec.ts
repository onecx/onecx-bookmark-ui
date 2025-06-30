import { BookmarkScope } from 'src/app/shared/generated'
import { selectBookmarkConfigureViewModel, selectResults } from './bookmark-configure.selectors'

describe('bookmark configure selectors', () => {
  it('should select results', () => {
    expect(
      selectResults.projector(
        [
          {
            displayName: 'shouldBeFiltered',
            id: '1',
            position: 1,
            scope: BookmarkScope.Private,
            workspaceName: 'w1',
            appId: 'app1',
            userId: '123',
            productName: 'p1'
          },
          {
            displayName: 'shouldNot',
            id: '2',
            position: 1,
            scope: BookmarkScope.Public,
            workspaceName: 'w1',
            appId: 'app1',
            userId: '123',
            productName: 'p1'
          },
          {
            id: '3',
            position: 1,
            scope: BookmarkScope.Public,
            workspaceName: 'w1',
            appId: 'app1',
            userId: '123',
            productName: 'p1'
          } as any
        ],
        'filter',
        'PRIVATE'
      )
    ).toEqual([
      {
        displayName: 'shouldBeFiltered',
        id: '1',
        position: 1,
        scope: BookmarkScope.Private,
        workspaceName: 'w1',
        appId: 'app1',
        userId: '123',
        productName: 'p1',
        scope_key: 'BOOKMARK.SCOPES.PRIVATE',
        imagePath: ''
      }
    ])
  })
  it('should select viewModel', () => {
    expect(selectBookmarkConfigureViewModel.projector([], [], 'abc', 'abc', true, 'abc')).toEqual({
      bookmarkFilter: 'abc',
      columns: [],
      exceptionKey: 'abc',
      loading: true,
      results: [],
      scopeQuickFilter: 'abc'
    })
  })
})
