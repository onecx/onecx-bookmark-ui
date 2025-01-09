import equal from 'fast-deep-equal'

import { Endpoint, MfeInfo, PageInfo, Workspace } from '@onecx/integration-interface'

import { Bookmark } from '../generated'
import { extractPathAfter, mapPathSegmentsToPathParameters } from './path.utils'

export function isPageBookmarkable(currentWorkspace: Workspace, currentMfe: MfeInfo, currentPage?: PageInfo) {
  if (currentPage) {
    const pagePath = extractPathAfter(currentPage.path, currentMfe.baseHref)
    if (pagePath === '/') {
      return true
    }
    const endpointForCurrentPage = getEndpointForPath(currentWorkspace, currentMfe, pagePath)
    if (endpointForCurrentPage) {
      return true
    }
    return false
  } else {
    return false
  }
}

export function findPageBookmark(
  currentBookmarks: Bookmark[] | undefined,
  currentWorkspace: Workspace,
  currentMfe: MfeInfo,
  currentPage: PageInfo | undefined
): Bookmark | undefined {
  if (currentPage && currentBookmarks) {
    const pagePath = extractPathAfter(currentPage.path, currentMfe.baseHref)
    const endpointForCurrentPage = getEndpointForPath(currentWorkspace, currentMfe, pagePath)
    if (endpointForCurrentPage) {
      return findBookmarkForEndpoint(currentBookmarks, endpointForCurrentPage, currentMfe, currentPage)
    }
    return findBookmarkForMfeRoot(currentBookmarks, currentMfe, pagePath)
  } else {
    return undefined
  }
}

export function findBookmarkForEndpoint(
  bookmarks: Bookmark[],
  endpoint: Endpoint,
  currentMfe: MfeInfo,
  currentPage: PageInfo
): Bookmark | undefined {
  let currentPageEndpointParameters = {}
  if (currentPage && endpoint.path) {
    const pagePath = extractPathAfter(currentPage.path, currentMfe.baseHref)
    currentPageEndpointParameters = mapPathSegmentsToPathParameters(endpoint.path, pagePath)
  }
  return bookmarks.find((bookmark) => {
    return (
      bookmark.productName === currentMfe.productName &&
      bookmark.appId === currentMfe.appId &&
      bookmark.endpointName === endpoint.name &&
      equal(bookmark.endpointParameters ?? {}, currentPageEndpointParameters)
    )
  })
}

export function findBookmarkForMfeRoot(
  bookmarks: Bookmark[],
  currentMfe: MfeInfo,
  pagePath: string
): Bookmark | undefined {
  if (pagePath !== '/') {
    return undefined
  }
  return bookmarks.find((bookmark) => {
    return (
      bookmark.productName === currentMfe.productName &&
      bookmark.appId === currentMfe.appId &&
      !bookmark.endpointName &&
      (!bookmark.endpointParameters || equal(bookmark.endpointParameters, {}))
    )
  })
}

export function getEndpointForPath(
  currentWorkspace: Workspace,
  currentMfe: MfeInfo,
  applicationPath: string
): Endpoint | undefined {
  const endpointsForCurrentMFE =
    currentWorkspace.routes?.find((route) => {
      return route.appId == currentMfe.appId && route.productName == currentMfe.productName
    })?.endpoints ?? []
  return endpointsForCurrentMFE.find((endpoint) => {
    if (!endpoint.path) {
      return false
    }
    return matchesEndpointPathPattern(applicationPath, endpoint.path)
  })
}

export function matchesEndpointPathPattern(applicationPath: string, endpointPath: string): boolean {
  if (applicationPath === endpointPath) {
    return true
  }
  // Remove trailing slashes from both paths
  applicationPath = applicationPath.replace(/\/+$/, '')
  endpointPath = endpointPath.replace(/\/+$/, '')

  // Convert endpointPath to a regex pattern
  const regexPattern = endpointPath
    .split('/')
    .map((segment) => {
      if (segment.startsWith('{') && segment.endsWith('}')) {
        // Replace {variable} with a regex to match any characters except '/'
        return '([^/]+)'
      } else {
        // Escape special regex characters in normal segments
        return segment.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
      }
    })
    .join('\\/')

  // Add start and end anchors, and make the trailing slash optional
  const fullRegexPattern = `^${regexPattern}\\/?$`

  // Create a RegExp object and test the applicationPath
  const regex = new RegExp(fullRegexPattern)
  return regex.test(applicationPath)
}
