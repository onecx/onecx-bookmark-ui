/* eslint-disable @typescript-eslint/no-var-requires */
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CommonModule } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PortalCoreModule } from '@onecx/portal-integration-angular'

import { BookmarkDeleteComponent } from './bookmark-delete.component'
import { Bookmark, BookmarkScope } from 'src/app/shared/generated'

describe('BookmarkDeleteComponent', () => {
  let component: BookmarkDeleteComponent
  let fixture: ComponentFixture<BookmarkDeleteComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BookmarkDeleteComponent],
      imports: [
        CommonModule,
        PortalCoreModule,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents()

    fixture = TestBed.createComponent(BookmarkDeleteComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('limitText', () => {
    it('should return the original text when shorter than limit', () => {
      expect(component.limitText('hello', 10)).toBe('hello')
    })

    it('should truncate and append ellipsis when text length equals limit', () => {
      expect(component.limitText('hello', 5)).toBe('hello...')
    })

    it('should truncate and append ellipsis when text exceeds limit', () => {
      expect(component.limitText('hello world', 5)).toBe('hello...')
    })

    it('should return empty string for null input', () => {
      expect(component.limitText(null, 10)).toBe('')
    })

    it('should return empty string for undefined input', () => {
      expect(component.limitText(undefined, 10)).toBe('')
    })

    it('should return empty string for empty string input', () => {
      expect(component.limitText('', 10)).toBe('')
    })
  })

  describe('bookmark input', () => {
    it('should be undefined by default', () => {
      expect(component.bookmark).toBeUndefined()
    })

    it('should reflect the assigned bookmark', () => {
      const bookmark: Bookmark = {
        id: '1',
        displayName: 'My Bookmark',
        scope: BookmarkScope.Private,
        position: 0,
        workspaceName: 'ws'
      }
      component.bookmark = bookmark
      expect(component.bookmark).toBe(bookmark)
    })
  })

  describe('BookmarkScope exposure', () => {
    it('should expose BookmarkScope for template use', () => {
      expect(component.BookmarkScope).toBe(BookmarkScope)
    })
  })

  describe('Object exposure', () => {
    it('should expose Object for template use', () => {
      expect(component.Object).toBe(Object)
    })
  })
})
