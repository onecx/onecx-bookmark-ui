/* eslint-disable @typescript-eslint/no-var-requires */
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { SimpleChange, SimpleChanges } from '@angular/core'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { AppStateService } from '@onecx/angular-integration-interface'
import { AppStateServiceMock, provideAppStateServiceMock } from '@onecx/angular-integration-interface/mocks'

import { Bookmark, BookmarkScope } from 'src/app/shared/generated'
import { environment } from 'src/environments/environment'
import { BookmarkImageComponent } from './bookmark-image.component'
import { Product } from '../bookmark-overview/bookmark-overview.component'

const REMOTE_BASE_URL = 'http://remote.example.com'

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

  function publishMfe(remoteBaseUrl: string): void {
    appStateMock.currentMfe$.publish({
      appId: 'app',
      baseHref: '/',
      productName: 'product',
      shellName: 'shell',
      mountPath: '/',
      remoteBaseUrl
    })
  }

  function createFreshComponent(remoteBaseUrl = REMOTE_BASE_URL): BookmarkImageComponent {
    publishMfe(remoteBaseUrl)
    const f = TestBed.createComponent(BookmarkImageComponent)
    f.detectChanges()
    return f.componentInstance
  }

  function bookmarkChange(curr: Bookmark | undefined): SimpleChanges {
    return { bookmark: new SimpleChange(undefined, curr, curr === undefined) }
  }

  function productChange(curr: Product | undefined): SimpleChanges {
    return { product: new SimpleChange(undefined, curr, curr === undefined) }
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BookmarkImageComponent,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [provideHttpClient(), provideHttpClientTesting(), AppStateService, provideAppStateServiceMock()]
    }).compileComponents()

    appStateMock = TestBed.inject(AppStateServiceMock)
    publishMfe(REMOTE_BASE_URL)

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

    it('should set currentImageUrl to the default logo when no bookmark or product is set', () => {
      expect(component.currentImageUrl).toContain(REMOTE_BASE_URL)
      expect(component.currentImageUrl).toContain(environment.DEFAULT_LOGO_PATH)
    })

    it('should set currentImageUrl to undefined when remoteBaseUrl is empty and no bookmark or product', () => {
      const c = createFreshComponent('')
      expect(c.currentImageUrl).toBeUndefined()
    })

    it('should set currentImageUrl to undefined when remoteBaseUrl is undefined', () => {
      appStateMock.currentMfe$.publish({
        appId: 'app',
        baseHref: '/',
        productName: 'product',
        shellName: 'shell',
        mountPath: '/'
      } as never)
      const f = TestBed.createComponent(BookmarkImageComponent)
      f.detectChanges()
      expect(f.componentInstance.currentImageUrl).toBeUndefined()
    })
  })

  describe('ngOnChanges', () => {
    it('should rebuild queue and reset loading to true when bookmark changes', () => {
      component.loading = false
      component.bookmark = { ...baseBookmark, imageUrl: 'http://img.example.com/logo.png' }

      component.ngOnChanges(bookmarkChange(component.bookmark))

      expect(component.loading).toBe(true)
      expect(component.currentImageUrl).toBe('http://img.example.com/logo.png')
    })

    it('should rebuild queue and reset loading to true when product changes', () => {
      component.loading = false
      component.product = { ...baseProduct, imageUrl: 'http://product.example.com/logo.png' }

      component.ngOnChanges(productChange(component.product))

      expect(component.loading).toBe(true)
    })

    it('should not reset or rebuild when an unrelated input changes', () => {
      component.loading = false
      const urlBefore = component.currentImageUrl

      component.ngOnChanges({ styleClass: new SimpleChange(undefined, 'my-class', false) })

      expect(component.loading).toBe(false)
      expect(component.currentImageUrl).toBe(urlBefore)
    })
  })

  describe('rebuildUrlQueue priorities', () => {
    it('should use bookmark.imageUrl as first priority (P1)', () => {
      component.bookmark = { ...baseBookmark, imageUrl: 'http://img.example.com/logo.png' }
      component.ngOnChanges(bookmarkChange(component.bookmark))

      expect(component.currentImageUrl).toBe('http://img.example.com/logo.png')
    })

    it('should use BFF URL as second priority when bookmark has id and remoteBaseUrl is set (P2)', () => {
      component.bookmark = { ...baseBookmark, imageUrl: undefined }
      component.ngOnChanges(bookmarkChange(component.bookmark))

      expect(component.currentImageUrl).toContain(REMOTE_BASE_URL)
      expect(component.currentImageUrl).toContain('bff/images/bm-1')
    })

    it('should skip BFF URL when remoteBaseUrl is empty (P2 skipped)', () => {
      const c = createFreshComponent('')
      c.bookmark = { ...baseBookmark, imageUrl: undefined }
      c.product = { ...baseProduct, imageUrl: 'http://product.example.com/logo.png' }
      c.ngOnChanges({
        bookmark: new SimpleChange(undefined, c.bookmark, true),
        product: new SimpleChange(undefined, c.product, true)
      })

      expect(c.currentImageUrl).toBe('http://product.example.com/logo.png')
    })

    it('should use product.imageUrl as third priority after BFF URL fails (P3)', () => {
      component.bookmark = { ...baseBookmark, imageUrl: undefined }
      component.product = { ...baseProduct, imageUrl: 'http://product.example.com/logo.png' }
      component.ngOnChanges({
        bookmark: new SimpleChange(undefined, component.bookmark, true),
        product: new SimpleChange(undefined, component.product, true)
      })

      component.onImageError() // skip BFF URL (P2)

      expect(component.currentImageUrl).toBe('http://product.example.com/logo.png')
    })

    it('should use default logo as last fallback when all higher priorities fail (P4)', () => {
      component.bookmark = { ...baseBookmark, imageUrl: undefined }
      component.product = undefined
      component.ngOnChanges(bookmarkChange(component.bookmark))

      component.onImageError() // skip BFF URL (P2) → arrives at default (P4)

      expect(component.currentImageUrl).toContain(REMOTE_BASE_URL)
      expect(component.currentImageUrl).toContain(environment.DEFAULT_LOGO_PATH)
    })

    it('should skip default logo when remoteBaseUrl is empty (P4 skipped)', () => {
      const c = createFreshComponent('')
      c.bookmark = { ...baseBookmark, imageUrl: 'http://img.example.com/logo.png' }
      c.ngOnChanges(bookmarkChange(c.bookmark))
      // P1 is bookmark.imageUrl — after one error the queue is exhausted (no BFF, no default)
      c.onImageError()

      expect(c.currentImageUrl).toBeUndefined()
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
    it('should advance to the next URL in the queue', () => {
      component.bookmark = { ...baseBookmark, imageUrl: 'http://img.example.com/logo.png' }
      component.ngOnChanges(bookmarkChange(component.bookmark))
      expect(component.currentImageUrl).toBe('http://img.example.com/logo.png')

      component.onImageError()

      expect(component.currentImageUrl).toContain('bff/images/bm-1')
    })

    it('should walk through all four priorities in order', () => {
      component.bookmark = { ...baseBookmark, imageUrl: 'http://img.example.com/logo.png' }
      component.product = { ...baseProduct, imageUrl: 'http://product.example.com/logo.png' }
      component.ngOnChanges({
        bookmark: new SimpleChange(undefined, component.bookmark, true),
        product: new SimpleChange(undefined, component.product, true)
      })

      expect(component.currentImageUrl).toBe('http://img.example.com/logo.png') // P1

      component.onImageError()
      expect(component.currentImageUrl).toContain('bff/images/bm-1') // P2

      component.onImageError()
      expect(component.currentImageUrl).toBe('http://product.example.com/logo.png') // P3

      component.onImageError()
      expect(component.currentImageUrl).toContain(environment.DEFAULT_LOGO_PATH) // P4
    })

    it('should set loading to false and currentImageUrl to undefined when all fallbacks are exhausted', () => {
      // Queue has only the default logo; one error exhausts it
      component.bookmark = undefined
      component.ngOnChanges(bookmarkChange(undefined))

      component.onImageError()

      expect(component.loading).toBe(false)
      expect(component.currentImageUrl).toBeUndefined()
    })
  })
})
