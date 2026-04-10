/* eslint-disable @typescript-eslint/no-var-requires */
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'
import { CommonModule } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PortalCoreModule } from '@onecx/portal-integration-angular'

import { Bookmark, BookmarkScope, UpdateBookmark } from 'src/app/shared/generated'
import { BookmarkSortComponent } from './bookmark-sort.component'

const makeBookmark = (id: string, position: number, overrides: Partial<Bookmark> = {}): Bookmark => ({
  id,
  displayName: `Bookmark ${id}`,
  position,
  workspaceName: 'ws',
  scope: BookmarkScope.Private,
  ...overrides
})

describe('BookmarkSortComponent', () => {
  let component: BookmarkSortComponent
  let fixture: ComponentFixture<BookmarkSortComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BookmarkSortComponent],
      schemas: [NO_ERRORS_SCHEMA],
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

    fixture = TestBed.createComponent(BookmarkSortComponent)
    component = fixture.componentInstance
  })

  it('should create', () => {
    fixture.detectChanges()
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize dialogResult as empty array when initialBookmarks is undefined', fakeAsync(() => {
      component.vm = { initialBookmarks: undefined }

      fixture.detectChanges()
      tick(200)

      expect(component.dialogResult).toEqual([])
    }))

    it('should cast bookmarks to UpdateBookmark format', fakeAsync(() => {
      const bookmark = makeBookmark('bm-1', 1, { modificationCount: 3, url: 'http://example.com' })
      component.vm = { initialBookmarks: [bookmark] }

      fixture.detectChanges()
      tick(200)

      expect(component.dialogResult[0]).toMatchObject<Partial<UpdateBookmark>>({
        id: 'bm-1',
        displayName: 'Bookmark bm-1',
        position: 1,
        modificationCount: 3,
        url: 'http://example.com',
        scope: BookmarkScope.Private
      })
    }))

    it('should default modificationCount to 0 when undefined', fakeAsync(() => {
      const bookmark = makeBookmark('bm-1', 1)
      component.vm = { initialBookmarks: [bookmark] }

      fixture.detectChanges()
      tick(200)

      expect(component.dialogResult[0].modificationCount).toBe(0)
    }))

    it('should sort bookmarks by position ascending', fakeAsync(() => {
      component.vm = {
        initialBookmarks: [makeBookmark('bm-3', 3), makeBookmark('bm-1', 1), makeBookmark('bm-2', 2)]
      }

      fixture.detectChanges()
      tick(200)

      expect(component.dialogResult.map((b) => b.id)).toEqual(['bm-1', 'bm-2', 'bm-3'])
    }))

    it('should emit primaryButtonEnabled true after 200ms', fakeAsync(() => {
      const emittedValues: boolean[] = []
      component.primaryButtonEnabled.subscribe((val) => emittedValues.push(val))
      component.vm = { initialBookmarks: undefined }

      fixture.detectChanges()
      expect(emittedValues).toHaveLength(0)

      tick(200)
      expect(emittedValues).toEqual([true])
    }))
  })

  describe('ocxDialogButtonClicked', () => {
    it('should set 1-based positions on dialogResult items', fakeAsync(() => {
      component.vm = {
        initialBookmarks: [makeBookmark('bm-3', 3), makeBookmark('bm-1', 1), makeBookmark('bm-2', 2)]
      }
      fixture.detectChanges()
      tick(200)

      component.ocxDialogButtonClicked()

      expect(component.dialogResult.map((b) => b.position)).toEqual([1, 2, 3])
    }))

    it('should handle empty dialogResult without errors', fakeAsync(() => {
      component.vm = { initialBookmarks: undefined }
      fixture.detectChanges()
      tick(200)

      expect(() => component.ocxDialogButtonClicked()).not.toThrow()
    }))
  })
})
