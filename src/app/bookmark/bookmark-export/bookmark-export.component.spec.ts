/* eslint-disable @typescript-eslint/no-var-requires */
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { CheckboxModule } from 'primeng/checkbox'

import { AngularAcceleratorModule } from '@onecx/angular-accelerator'

import { BookmarkExportComponent } from './bookmark-export.component'
import { EximBookmarkScope } from 'src/app/shared/generated'

describe('BookmarkExportComponent', () => {
  let component: BookmarkExportComponent
  let fixture: ComponentFixture<BookmarkExportComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BookmarkExportComponent,
        CommonModule,
        FormsModule,
        CheckboxModule,
        AngularAcceleratorModule,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents()

    fixture = TestBed.createComponent(BookmarkExportComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('initial state', () => {
    it('should have empty workspaceName by default', () => {
      expect(component.workspaceName).toBe('')
    })

    it('should have private set to false by default', () => {
      expect(component.private).toBe(false)
    })

    it('should have public set to false by default', () => {
      expect(component.public).toBe(false)
    })

    it('should have dialogResult undefined by default', () => {
      expect(component.dialogResult).toBeUndefined()
    })
  })

  describe('onScopeChange', () => {
    it.each([
      { private: false, public: false, expected: false },
      { private: true, public: false, expected: true },
      { private: false, public: true, expected: true },
      { private: true, public: true, expected: true }
    ])(
      'should emit $expected when private is $private and public is $public',
      ({ private: p, public: q, expected }) => {
        const emitSpy = jest.spyOn(component.primaryButtonEnabled, 'emit')
        component.private = p
        component.public = q

        component.onScopeChange()

        expect(emitSpy).toHaveBeenCalledWith(expected)
      }
    )
  })

  describe('ocxDialogButtonClicked', () => {
    it('should set dialogResult with empty scopes when neither private nor public is selected', () => {
      component.workspaceName = 'my-workspace'
      component.private = false
      component.public = false

      component.ocxDialogButtonClicked()

      expect(component.dialogResult).toEqual({ workspaceName: 'my-workspace', scopes: [] })
    })

    it('should set dialogResult with Private scope when only private is selected', () => {
      component.workspaceName = 'ws'
      component.private = true
      component.public = false

      component.ocxDialogButtonClicked()

      expect(component.dialogResult).toEqual({ workspaceName: 'ws', scopes: [EximBookmarkScope.Private] })
    })

    it('should set dialogResult with Public scope when only public is selected', () => {
      component.workspaceName = 'ws'
      component.private = false
      component.public = true

      component.ocxDialogButtonClicked()

      expect(component.dialogResult).toEqual({ workspaceName: 'ws', scopes: [EximBookmarkScope.Public] })
    })

    it('should set dialogResult with both scopes when both are selected', () => {
      component.workspaceName = 'ws'
      component.private = true
      component.public = true

      component.ocxDialogButtonClicked()

      expect(component.dialogResult).toEqual({
        workspaceName: 'ws',
        scopes: [EximBookmarkScope.Private, EximBookmarkScope.Public]
      })
    })
  })
})
