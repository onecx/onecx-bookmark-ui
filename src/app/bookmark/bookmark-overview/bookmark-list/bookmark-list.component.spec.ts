/* eslint-disable @typescript-eslint/no-var-requires */
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { Router, RouterModule } from '@angular/router'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of } from 'rxjs'

import { WorkspaceService } from '@onecx/angular-integration-interface'
import { AngularAcceleratorModule } from '@onecx/angular-accelerator'

import { BookmarkListComponent } from './bookmark-list.component'
import { Bookmark, BookmarkScope, Target } from 'src/app/shared/generated'
import { Product } from '../bookmark-overview.component'

const bookmark: Bookmark = {
  id: 'bm-1',
  displayName: 'My Bookmark',
  position: 0,
  workspaceName: 'ws',
  productName: 'product-a',
  appId: 'app-a',
  scope: BookmarkScope.Private,
  target: Target.Self
}

const products: Product[] = [
  { name: 'product-a', displayName: 'Product A', imageUrl: 'http://img/a.png' },
  { name: 'product-b', displayName: 'Product B' }
]

describe('BookmarkListComponent', () => {
  let component: BookmarkListComponent
  let fixture: ComponentFixture<BookmarkListComponent>
  let router: Router
  let mockEvent: any
  let workspaceServiceMock: jest.Mocked<Pick<WorkspaceService, 'getUrl'>>

  beforeEach(async () => {
    workspaceServiceMock = {
      getUrl: jest.fn().mockReturnValue(of('/product-a/app-a/details'))
    }

    await TestBed.configureTestingModule({
      imports: [
        BookmarkListComponent,
        NoopAnimationsModule,
        RouterModule.forRoot([]),
        AngularAcceleratorModule,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: {
            navigate: jest.fn(),
            createUrlTree: jest.fn(() => ({})), // Gibt direkt ein leeres Objekt zurück
            serializeUrl: jest.fn(() => '/mock-url?q=1')
          }
        },
        { provide: WorkspaceService, useValue: workspaceServiceMock }
      ]
    }).compileComponents()
    router = TestBed.inject(Router)
    mockEvent = {
      preventDefault: jest.fn()
    }

    fixture = TestBed.createComponent(BookmarkListComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('initial state', () => {
    it('should have empty bookmarks array by default', () => {
      expect(component.bookmarks).toEqual([])
    })

    it('should have isPrivate false by default', () => {
      expect(component.isPrivate).toBe(false)
    })

    it('should have empty headerKey by default', () => {
      expect(component.headerKey).toBe('')
    })
  })

  describe('getUrl', () => {
    it('should return undefined when bookmark has no id', () => {
      const bm = { ...bookmark, id: undefined } as unknown as Bookmark
      expect(component.getUrl(bm)).toBeUndefined()
    })

    it('should return undefined when bookmark has no productName', () => {
      const bm = { ...bookmark, productName: undefined } as unknown as Bookmark
      expect(component.getUrl(bm)).toBeUndefined()
    })

    it('should return undefined when bookmark has no appId', () => {
      const bm = { ...bookmark, appId: undefined } as unknown as Bookmark
      expect(component.getUrl(bm)).toBeUndefined()
    })

    it('should return an observable when bookmark has id, productName and appId', (done) => {
      const result = component.getUrl(bookmark)

      expect(result).toBeDefined()
      if (result)
        result.subscribe((url) => {
          expect(url).toBe('/product-a/app-a/details')
          done()
        })
    })

    it('should cache the observable on repeated calls for the same bookmark', () => {
      component.getUrl(bookmark)
      component.getUrl(bookmark)

      expect(workspaceServiceMock.getUrl).toHaveBeenCalledTimes(1)
    })

    it('should create separate observables for different bookmarks', () => {
      const bm2: Bookmark = { ...bookmark, id: 'bm-2', appId: 'app-b' }

      component.getUrl(bookmark)
      component.getUrl(bm2)

      expect(workspaceServiceMock.getUrl).toHaveBeenCalledTimes(2)
    })
  })

  describe('getProductByName', () => {
    beforeEach(() => {
      component.products = products
    })

    it('should return matching product by name', () => {
      expect(component.getProductByName('product-a')).toEqual(products[0])
    })

    it('should return undefined when no product matches', () => {
      expect(component.getProductByName('unknown')).toBeUndefined()
    })

    it('should return undefined when name is undefined', () => {
      expect(component.getProductByName(undefined)).toBeUndefined()
    })

    it('should return undefined when products is undefined', () => {
      component.products = undefined
      expect(component.getProductByName('product-a')).toBeUndefined()
    })
  })

  describe('onBookmarkClick', () => {
    it('should call event.preventDefault() immediately', () => {
      jest.spyOn(component, 'getUrl').mockReturnValue(of('/some-url'))

      component.onBookmarkClick(mockEvent, bookmark)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    it('should navigate internally when target is not _blank', () => {
      const mockBookmark = { ...bookmark, query: { param: 'val' } }
      jest.spyOn(component, 'getUrl').mockReturnValue(of('/my-target-url'))

      component.onBookmarkClick(mockEvent, mockBookmark)

      expect(router.navigate).toHaveBeenCalledWith(['/my-target-url'], {
        queryParams: mockBookmark.query,
        fragment: mockBookmark.fragment
      })
    })

    it('should open a new window when target is _blank', () => {
      const mockBookmark = {
        ...bookmark,
        query: { param: 'val' },
        target: Target.Blank
      }
      jest.spyOn(component, 'getUrl').mockReturnValue(of('/my-target-url'))
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null)

      component.onBookmarkClick(mockEvent, mockBookmark)

      expect(router.createUrlTree).toHaveBeenCalledWith(['/my-target-url'], {
        queryParams: mockBookmark.query,
        fragment: mockBookmark.fragment
      })
      expect(router.serializeUrl).toHaveBeenCalled()
      expect(windowOpenSpy).toHaveBeenCalledWith('/mock-url?q=1', '_blank')

      windowOpenSpy.mockRestore()
    })

    it('should not navigate or crash if getUrl returns undefined', () => {
      const mockBookmark = { ...bookmark, query: {}, fragment: '' }
      jest.spyOn(component, 'getUrl').mockReturnValue(undefined as any)

      component.onBookmarkClick(mockEvent, mockBookmark)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(router.navigate).not.toHaveBeenCalled()
    })
  })
})
