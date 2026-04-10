/* eslint-disable @typescript-eslint/no-var-requires */
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CommonModule } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { SimpleChange, SimpleChanges } from '@angular/core'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { AppStateService } from '@onecx/angular-integration-interface'
import { AppStateServiceMock, provideAppStateServiceMock } from '@onecx/angular-integration-interface/mocks'
import { PortalCoreModule } from '@onecx/portal-integration-angular'

import { BookmarkImageComponent } from './bookmark-image.component'
import { Bookmark, BookmarkScope } from 'src/app/shared/generated'
import { Product } from '../bookmark-overview/bookmark-overview.component'

const baseBookmark: Bookmark = {
  id: 'bm-1',
  displayName: 'My Bookmark',
  scope: BookmarkScope.Private,
  position: 0,
  workspaceName: 'ws'
}

const baseProduct: Product = {
  name: 'product',
  displayName: 'My Product'
}

describe('BookmarkImageComponent', () => {
  let component: BookmarkImageComponent
  let fixture: ComponentFixture<BookmarkImageComponent>
  let appStateMock: AppStateServiceMock

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BookmarkImageComponent],
      imports: [
        CommonModule,
        PortalCoreModule,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [provideHttpClient(), provideHttpClientTesting(), AppStateService, provideAppStateServiceMock()]
    }).compileComponents()

    appStateMock = TestBed.inject(AppStateServiceMock)
    appStateMock.currentMfe$.publish({
      appId: 'app',
      baseHref: '/',
      productName: 'product',
      shellName: 'shell',
      mountPath: '/',
      remoteBaseUrl: 'http://remote.example.com'
    })

    fixture = TestBed.createComponent(BookmarkImageComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('initial state', () => {
    it('should start with loading true', () => {
      expect(component.loading).toBe(true)
    })

    it('should start with errorImage$ undefined', () => {
      expect(component.errorImage$).toBeUndefined()
    })

    it('should resolve defaultImageUrl$ from remoteBaseUrl', (done) => {
      component.defaultImageUrl$.subscribe((url) => {
        expect(url).toContain('http://remote.example.com')
        done()
      })
    })

    it('should resolve bookmarkImageBaseURL$ from remoteBaseUrl and bookmark id', (done) => {
      component.bookmark = baseBookmark
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      component.bookmarkImageBaseURL$!.subscribe((url) => {
        expect(url).toContain('bff/images/')
        expect(url).toContain('bm-1')
        done()
      })
    })

    it('should resolve bookmarkImageBaseURL$ without bookmark id when bookmark is not set', (done) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      component.bookmarkImageBaseURL$!.subscribe((url) => {
        expect(url).toContain('bff/images/')
        done()
      })
    })
  })

  describe('prepareUrlPath (via observables)', () => {
    it('should return empty string when remoteBaseUrl is empty', (done) => {
      appStateMock.currentMfe$.publish({
        appId: 'app',
        baseHref: '/',
        productName: 'product',
        shellName: 'shell',
        mountPath: '/',
        remoteBaseUrl: ''
      })
      component.defaultImageUrl$.subscribe((url) => {
        expect(url).toBe('')
        done()
      })
    })

    it('should return url when only url is provided', () => {
      expect(component['prepareUrlPath']('http://example.com', undefined)).toBe('http://example.com')
    })
  })

  describe('onImageLoad', () => {
    it('should set loading to false', () => {
      component.loading = true
      component.onImageLoad()
      expect(component.loading).toBe(false)
    })
  })

  describe('onImageError', () => {
    it('should do nothing when loading is false', () => {
      component.loading = false
      component.onImageError()
      expect(component.errorImage$).toBeUndefined()
    })

    it('should load product logo when counter is 0 and productLogoUrl is set', () => {
      component.loading = true
      component['imageLoadCounter'] = 0
      component['productLogoUrl'] = 'http://product.logo/img.png'

      component.onImageError()

      expect(component['imageLoadCounter']).toBe(1)
      expect(component.errorImage$).toBeDefined()
    })

    it('should load default image when counter is 0 and no productLogoUrl', () => {
      component.loading = true
      component['imageLoadCounter'] = 0
      component['productLogoUrl'] = undefined

      component.onImageError()

      expect(component['imageLoadCounter']).toBe(2)
      expect(component.errorImage$).toBe(component.defaultImageUrl$)
    })

    it('should load default image when counter is 1', () => {
      component.loading = true
      component['imageLoadCounter'] = 1

      component.onImageError()

      expect(component['imageLoadCounter']).toBe(2)
      expect(component.errorImage$).toBe(component.defaultImageUrl$)
    })
  })

  describe('ngOnChanges', () => {
    it('should do nothing when bookmark has no id', () => {
      component.bookmark = undefined
      const changes: SimpleChanges = {
        product: new SimpleChange(undefined, baseProduct, false)
      }

      component.ngOnChanges(changes)

      expect(component['productLogoUrl']).toBeUndefined()
    })

    it('should do nothing when product change is first change', () => {
      component.bookmark = baseBookmark
      const changes: SimpleChanges = {
        product: new SimpleChange(undefined, baseProduct, true)
      }

      component.ngOnChanges(changes)

      expect(component['productLogoUrl']).toBeUndefined()
    })

    it('should do nothing when product is falsy after non-first change', () => {
      component.bookmark = baseBookmark
      const changes: SimpleChanges = {
        product: new SimpleChange(baseProduct, undefined, false)
      }
      component.product = undefined

      component.ngOnChanges(changes)

      expect(component['productLogoUrl']).toBeUndefined()
    })

    it('should set productLogoUrl to undefined when product has no imageUrl', () => {
      component.bookmark = baseBookmark
      component.product = { name: 'product', displayName: 'My Product' }
      const changes: SimpleChanges = {
        product: new SimpleChange(undefined, component.product, false)
      }

      component.ngOnChanges(changes)

      expect(component['productLogoUrl']).toBeUndefined()
    })

    it('should set productLogoUrl on non-first product change with bookmark and product', () => {
      component.bookmark = baseBookmark
      component.product = { ...baseProduct, imageUrl: 'http://img.example.com/logo.png' }
      const changes: SimpleChanges = {
        product: new SimpleChange(undefined, component.product, false)
      }

      component.ngOnChanges(changes)

      expect(component['productLogoUrl']).toBe('http://img.example.com/logo.png')
    })

    it('should trigger image reload when counter is 2 and productLogoUrl exists', () => {
      component.bookmark = baseBookmark
      component.product = { ...baseProduct, imageUrl: 'http://img.example.com/logo.png' }
      component['imageLoadCounter'] = 2
      component.loading = false
      const changes: SimpleChanges = {
        product: new SimpleChange(undefined, component.product, false)
      }

      component.ngOnChanges(changes)

      expect(component.loading).toBe(true)
      expect(component['imageLoadCounter']).toBeGreaterThan(0)
    })
  })
})
