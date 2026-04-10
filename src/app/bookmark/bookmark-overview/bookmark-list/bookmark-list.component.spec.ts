/* eslint-disable @typescript-eslint/no-var-requires */
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of } from 'rxjs'

import { WorkspaceService } from '@onecx/angular-integration-interface'
import { PortalCoreModule } from '@onecx/portal-integration-angular'

import { BookmarkListComponent } from './bookmark-list.component'
import { Bookmark, BookmarkScope } from 'src/app/shared/generated'
import { Product } from '../bookmark-overview.component'

const bookmark: Bookmark = {
  id: 'bm-1',
  displayName: 'My Bookmark',
  scope: BookmarkScope.Private,
  position: 0,
  workspaceName: 'ws',
  productName: 'product-a',
  appId: 'app-a'
}

const products: Product[] = [
  { name: 'product-a', displayName: 'Product A', imageUrl: 'http://img/a.png' },
  { name: 'product-b', displayName: 'Product B' }
]

describe('BookmarkListComponent', () => {
  let component: BookmarkListComponent
  let fixture: ComponentFixture<BookmarkListComponent>
  let workspaceServiceMock: jest.Mocked<Pick<WorkspaceService, 'getUrl'>>

  beforeEach(async () => {
    workspaceServiceMock = {
      getUrl: jest.fn().mockReturnValue(of('/product-a/app-a/details'))
    }

    await TestBed.configureTestingModule({
      declarations: [BookmarkListComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [
        CommonModule,
        RouterModule.forRoot([]),
        PortalCoreModule,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WorkspaceService, useValue: workspaceServiceMock }
      ]
    }).compileComponents()

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

    it('should have loading false by default', () => {
      expect(component.loading).toBe(false)
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
})
