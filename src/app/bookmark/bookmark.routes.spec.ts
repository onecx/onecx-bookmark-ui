import { LabelResolver } from 'src/app/shared/utils/label.resolver'
import { BookmarkConfigureComponent } from './bookmark-configure/bookmark-configure.component'
import { BookmarkOverviewComponent } from './bookmark-overview/bookmark-overview.component'
import { routes } from './bookmark.routes'

describe('bookmark routes', () => {
  it('should define exactly 2 routes', () => {
    expect(routes.length).toBe(2)
  })

  describe('root route', () => {
    const route = routes[0]

    it('should map empty path to BookmarkOverviewComponent', () => {
      expect(route.path).toBe('')
      expect(route.pathMatch).toBe('full')
      expect(route.component).toBe(BookmarkOverviewComponent)
    })
  })

  describe('configure route', () => {
    const route = routes[1]

    it('should map "configure" path to BookmarkConfigureComponent', () => {
      expect(route.path).toBe('configure')
      expect(route.pathMatch).toBe('full')
      expect(route.component).toBe(BookmarkConfigureComponent)
    })

    it('should have the correct breadcrumb data', () => {
      expect(route.data?.['breadcrumb']).toBe('BREADCRUMBS.CONFIGURE')
    })

    it('should have a breadcrumbFn that returns the labeli18n value', () => {
      const breadcrumbFn = route.data?.['breadcrumbFn'] as (data: any) => string
      expect(breadcrumbFn({ labeli18n: 'Configure Bookmarks' })).toBe('Configure Bookmarks')
    })

    it('should resolve labeli18n with LabelResolver', () => {
      expect(route.resolve?.['labeli18n']).toBe(LabelResolver)
    })
  })
})
