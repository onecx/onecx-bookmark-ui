import { extractPathAfter, mapPathSegmentsToPathParameters } from './path.utils'

describe('path.utils', () => {
  describe('mapPathSegmentsToPathParameters', () => {
    it('should return empty object when pattern has no parameters', () => {
      expect(mapPathSegmentsToPathParameters('details/view', 'details/view')).toEqual({})
    })

    it('should extract a single parameter value', () => {
      expect(mapPathSegmentsToPathParameters('{id}/details', '123/details')).toEqual({ id: '123' })
    })

    it('should extract multiple parameter values', () => {
      expect(mapPathSegmentsToPathParameters('{type}/{id}/view', 'user/42/view')).toEqual({ type: 'user', id: '42' })
    })

    it('should strip leading slash from pattern before extracting keys', () => {
      expect(mapPathSegmentsToPathParameters('/{id}/details', '/123/details')).toEqual({ id: '123' })
    })

    it('should trim whitespace from pattern', () => {
      expect(mapPathSegmentsToPathParameters('  {id}/view  ', '99/view')).toEqual({ id: '99' })
    })
  })

  describe('extractPathAfter', () => {
    it('should return the path after the marker when marker is found', () => {
      expect(extractPathAfter('/app/workspace/page', '/workspace')).toBe('/page')
    })

    it('should strip trailing slash from fullString before searching', () => {
      expect(extractPathAfter('/app/workspace/page/', '/workspace')).toBe('/page')
    })

    it('should strip trailing slash from marker before searching', () => {
      expect(extractPathAfter('/app/workspace/page', '/workspace/')).toBe('/page')
    })

    it('should prepend slash to substr when it does not start with slash', () => {
      expect(extractPathAfter('localhostmyapp', 'localhost')).toBe('/myapp')
    })

    it('should return fullString as-is when marker is not found and fullString starts with slash', () => {
      expect(extractPathAfter('/app/page', '/missing')).toBe('/app/page')
    })

    it('should prepend slash to fullString when marker is not found and fullString does not start with slash', () => {
      expect(extractPathAfter('app/page', '/missing')).toBe('/app/page')
    })

    it('should handle marker at the end of fullString returning a slash', () => {
      expect(extractPathAfter('/app/workspace', '/workspace')).toBe('/')
    })
  })
})
