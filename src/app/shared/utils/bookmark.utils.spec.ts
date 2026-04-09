jest.mock('fast-deep-equal', () => {
  const actual = jest.requireActual<(a: unknown, b: unknown) => boolean>('fast-deep-equal')
  return { __esModule: true, default: actual }
})

import {
  findBookmarkForEndpoint,
  findBookmarkForMfeRoot,
  findPageBookmark,
  getEndpointForPath,
  isPageBookmarkable,
  matchesEndpointPathPattern
} from './bookmark.utils'
import { Bookmark, BookmarkScope } from '../generated'
import { Endpoint, MfeInfo, PageInfo, Workspace } from '@onecx/integration-interface'

const mfe: MfeInfo = { productName: 'product', appId: 'app', baseHref: '/app' } as MfeInfo

const endpoint: Endpoint = { name: 'details', path: '/details/{id}' }

const workspaceWithEndpoints: Workspace = {
  workspaceName: 'ws',
  routes: [
    {
      appId: 'app',
      productName: 'product',
      endpoints: [endpoint, { name: 'list', path: '/list' }]
    }
  ]
} as unknown as Workspace

const workspaceWithoutRoutes: Workspace = { workspaceName: 'ws' } as unknown as Workspace

function bookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: '1',
    displayName: 'B',
    workspaceName: 'ws',
    scope: BookmarkScope.Private,
    position: 0,
    productName: 'product',
    appId: 'app',
    ...overrides
  }
}

describe('bookmark.utils', () => {
  describe('isPageBookmarkable', () => {
    it('should return false when currentPage is undefined', () => {
      expect(isPageBookmarkable(workspaceWithEndpoints, mfe, undefined)).toBe(false)
    })

    it('should return true when pagePath resolves to root (/)', () => {
      const page: PageInfo = { path: '/app' }

      expect(isPageBookmarkable(workspaceWithEndpoints, mfe, page)).toBe(true)
    })

    it('should return true when a matching endpoint exists for the page path', () => {
      const page: PageInfo = { path: '/app/list' }

      expect(isPageBookmarkable(workspaceWithEndpoints, mfe, page)).toBe(true)
    })

    it('should return false when no matching endpoint exists and path is not root', () => {
      const page: PageInfo = { path: '/app/unknown' }

      expect(isPageBookmarkable(workspaceWithoutRoutes, mfe, page)).toBe(false)
    })
  })

  describe('findPageBookmark', () => {
    it('should return undefined when currentPage is undefined', () => {
      expect(findPageBookmark([bookmark()], workspaceWithEndpoints, mfe, undefined)).toBeUndefined()
    })

    it('should return undefined when currentBookmarks is undefined', () => {
      const page: PageInfo = { path: '/app/list' }

      expect(findPageBookmark(undefined, workspaceWithEndpoints, mfe, page)).toBeUndefined()
    })

    it('should return the matching bookmark when endpoint matches', () => {
      const bm = bookmark({ endpointName: 'details', endpointParameters: { id: '42' } })
      const page: PageInfo = { path: '/app/details/42' }

      const result = findPageBookmark([bm], workspaceWithEndpoints, mfe, page)

      expect(result).toBe(bm)
    })

    it('should return the root bookmark when page is at mfe root', () => {
      const bm = bookmark({ endpointName: undefined, endpointParameters: undefined })
      const page: PageInfo = { path: '/app' }

      const result = findPageBookmark([bm], workspaceWithoutRoutes, mfe, page)

      expect(result).toBe(bm)
    })

    it('should return undefined when no bookmark matches the page endpoint', () => {
      const bm = bookmark({ endpointName: 'other', endpointParameters: {} })
      const page: PageInfo = { path: '/app/list' }

      const result = findPageBookmark([bm], workspaceWithEndpoints, mfe, page)

      expect(result).toBeUndefined()
    })
  })

  describe('findBookmarkForEndpoint', () => {
    const page: PageInfo = { path: '/app/details/99' }

    it('should return the bookmark matching productName, appId, endpointName and endpointParameters', () => {
      const bm = bookmark({ endpointName: 'details', endpointParameters: { id: '99' } })

      const result = findBookmarkForEndpoint([bm], endpoint, mfe, page)

      expect(result).toBe(bm)
    })

    it('should return undefined when endpointName does not match', () => {
      const bm = bookmark({ endpointName: 'other', endpointParameters: { id: '99' } })

      const result = findBookmarkForEndpoint([bm], endpoint, mfe, page)

      expect(result).toBeUndefined()
    })

    it('should return undefined when endpointParameters do not match', () => {
      const bm = bookmark({ endpointName: 'details', endpointParameters: { id: '1' } })

      const result = findBookmarkForEndpoint([bm], endpoint, mfe, page)

      expect(result).toBeUndefined()
    })

    it('should treat undefined endpointParameters on bookmark as empty object', () => {
      const endpointWithoutParams: Endpoint = { name: 'list', path: '/list' }
      const bm = bookmark({ endpointName: 'list', endpointParameters: undefined })
      const listPage: PageInfo = { path: '/app/list' }

      const result = findBookmarkForEndpoint([bm], endpointWithoutParams, mfe, listPage)

      expect(result).toBe(bm)
    })

    it('should return undefined when no endpoint path is defined', () => {
      const endpointNoPath: Endpoint = { name: 'list' }
      const bm = bookmark({ endpointName: 'list', endpointParameters: {} })
      const listPage: PageInfo = { path: '/app/list' }

      const result = findBookmarkForEndpoint([bm], endpointNoPath, mfe, listPage)

      expect(result).toBe(bm)
    })
  })

  describe('findBookmarkForMfeRoot', () => {
    it('should return undefined when pagePath is not root', () => {
      expect(findBookmarkForMfeRoot([bookmark()], mfe, '/subpage')).toBeUndefined()
    })

    it('should return the root bookmark matching productName and appId without endpointName', () => {
      const bm = bookmark({ endpointName: undefined, endpointParameters: undefined })

      const result = findBookmarkForMfeRoot([bm], mfe, '/')

      expect(result).toBe(bm)
    })

    it('should return the root bookmark when endpointParameters is an empty object', () => {
      const bm = bookmark({ endpointName: undefined, endpointParameters: {} })

      const result = findBookmarkForMfeRoot([bm], mfe, '/')

      expect(result).toBe(bm)
    })

    it('should return undefined when bookmark has an endpointName', () => {
      const bm = bookmark({ endpointName: 'list' })

      const result = findBookmarkForMfeRoot([bm], mfe, '/')

      expect(result).toBeUndefined()
    })

    it('should return undefined when bookmark has non-empty endpointParameters', () => {
      const bm = bookmark({ endpointName: undefined, endpointParameters: { id: '1' } })

      const result = findBookmarkForMfeRoot([bm], mfe, '/')

      expect(result).toBeUndefined()
    })
  })

  describe('getEndpointForPath', () => {
    it('should return the matching endpoint for a static path', () => {
      const result = getEndpointForPath(workspaceWithEndpoints, mfe, '/list')

      expect(result?.name).toBe('list')
    })

    it('should return the matching endpoint for a parameterised path', () => {
      const result = getEndpointForPath(workspaceWithEndpoints, mfe, '/details/42')

      expect(result?.name).toBe('details')
    })

    it('should return undefined when no route matches the mfe', () => {
      const result = getEndpointForPath(workspaceWithoutRoutes, mfe, '/list')

      expect(result).toBeUndefined()
    })

    it('should return undefined when no endpoint matches the path', () => {
      const result = getEndpointForPath(workspaceWithEndpoints, mfe, '/unknown')

      expect(result).toBeUndefined()
    })

    it('should return undefined when workspace has no routes', () => {
      const result = getEndpointForPath({ workspaceName: 'ws' } as unknown as Workspace, mfe, '/list')

      expect(result).toBeUndefined()
    })

    it('should return undefined for an endpoint without a path', () => {
      const ws: Workspace = {
        workspaceName: 'ws',
        routes: [{ appId: 'app', productName: 'product', endpoints: [{ name: 'nopath' }] }]
      } as unknown as Workspace

      const result = getEndpointForPath(ws, mfe, '/nopath')

      expect(result).toBeUndefined()
    })
  })

  describe('matchesEndpointPathPattern', () => {
    it('should return true for identical paths', () => {
      expect(matchesEndpointPathPattern('/list', '/list')).toBe(true)
    })

    it('should return true when applicationPath matches a parameterised endpoint pattern', () => {
      expect(matchesEndpointPathPattern('/details/42', '/details/{id}')).toBe(true)
    })

    it('should return false when paths differ', () => {
      expect(matchesEndpointPathPattern('/other', '/list')).toBe(false)
    })

    it('should return true when paths match ignoring trailing slash on applicationPath', () => {
      expect(matchesEndpointPathPattern('/list/', '/list')).toBe(true)
    })

    it('should return true when paths match ignoring trailing slash on endpointPath', () => {
      expect(matchesEndpointPathPattern('/list', '/list/')).toBe(true)
    })

    it('should return false when segment count differs', () => {
      expect(matchesEndpointPathPattern('/details/42/extra', '/details/{id}')).toBe(false)
    })

    it('should escape special regex characters in static segments', () => {
      expect(matchesEndpointPathPattern('/path.with.dots', '/path.with.dots')).toBe(true)
    })
  })
})
