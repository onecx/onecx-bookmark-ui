/* eslint-disable @typescript-eslint/no-var-requires */
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { CommonModule } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormsModule } from '@angular/forms'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { FileSelectEvent, FileUpload, FileUploadModule } from 'primeng/fileupload'

import { PortalCoreModule } from '@onecx/portal-integration-angular'

import { BookmarkImportComponent } from './bookmark-import.component'
import { EximBookmarkScope, EximMode } from 'src/app/shared/generated'

describe('BookmarkImportComponent', () => {
  let component: BookmarkImportComponent
  let fixture: ComponentFixture<BookmarkImportComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BookmarkImportComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [
        CommonModule,
        FormsModule,
        FileUploadModule,
        PortalCoreModule,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents()

    fixture = TestBed.createComponent(BookmarkImportComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('initial state', () => {
    it('should have private set to true by default', () => {
      expect(component.private).toBe(true)
    })

    it('should have public set to false by default', () => {
      expect(component.public).toBe(false)
    })

    it('should have mode set to Append by default', () => {
      expect(component.mode).toBe(EximMode.Append)
    })

    it('should have dialogResult undefined by default', () => {
      expect(component.dialogResult).toBeUndefined()
    })

    it('should have snapshot undefined by default', () => {
      expect(component.snapshot).toBeUndefined()
    })

    it('should have importError undefined by default', () => {
      expect(component.importError).toBeUndefined()
    })

    it('should expose EximMode for template use', () => {
      expect(component.EximMode).toBe(EximMode)
    })
  })

  describe('onScopeChange', () => {
    it('should emit false when no scope is selected and snapshot is undefined', () => {
      const emitSpy = jest.spyOn(component.primaryButtonEnabled, 'emit')
      component.private = false
      component.public = false
      component.snapshot = undefined

      component.onScopeChange()

      expect(emitSpy).toHaveBeenCalledWith(false)
    })

    it('should emit false when scope is selected but snapshot is undefined', () => {
      const emitSpy = jest.spyOn(component.primaryButtonEnabled, 'emit')
      component.private = true
      component.snapshot = undefined

      component.onScopeChange()

      expect(emitSpy).toHaveBeenCalledWith(false)
    })

    it('should emit true when private is selected and snapshot is set', () => {
      const emitSpy = jest.spyOn(component.primaryButtonEnabled, 'emit')
      component.private = true
      component.snapshot = {} as any

      component.onScopeChange()

      expect(emitSpy).toHaveBeenCalledWith(true)
    })

    it('should emit true when public is selected and snapshot is set', () => {
      const emitSpy = jest.spyOn(component.primaryButtonEnabled, 'emit')
      component.private = false
      component.public = true
      component.snapshot = {} as any

      component.onScopeChange()

      expect(emitSpy).toHaveBeenCalledWith(true)
    })
  })

  describe('onImportFileSelect', () => {
    it('should parse valid JSON and emit primary button enabled', async () => {
      const emitSpy = jest.spyOn(component.primaryButtonEnabled, 'emit')
      component.private = true
      const jsonContent = JSON.stringify({ bookmarks: [] })
      const file = { text: jest.fn().mockResolvedValue(jsonContent) } as unknown as File
      const event = { files: [file], currentFiles: [file], originalEvent: new Event('change') } as FileSelectEvent

      await component.onImportFileSelect(event)

      expect(component.snapshot).toEqual({ bookmarks: [] })
      expect(component.importError).toBeUndefined()
      expect(emitSpy).toHaveBeenCalledWith(true)
    })

    it('should set importError when file contains invalid JSON', async () => {
      const emitSpy = jest.spyOn(component.primaryButtonEnabled, 'emit')
      const file = { text: jest.fn().mockResolvedValue('not valid json') } as unknown as File
      const event = { files: [file], currentFiles: [file], originalEvent: new Event('change') } as FileSelectEvent

      await component.onImportFileSelect(event)

      expect(component.snapshot).toBeUndefined()
      expect(component.importError).toBeDefined()
      expect(component.importError?.exceptionKey).toBe('ACTIONS.IMPORT.ERROR.PARSER')
      expect(emitSpy).not.toHaveBeenCalled()
    })

    it('should clear importError before parsing', async () => {
      component.importError = { name: 'old error' } as any
      const jsonContent = JSON.stringify({ workspaceName: 'ws' })
      const file = { text: jest.fn().mockResolvedValue(jsonContent) } as unknown as File
      const event = { files: [file], currentFiles: [file], originalEvent: new Event('change') } as FileSelectEvent

      await component.onImportFileSelect(event)

      expect(component.importError).toBeUndefined()
    })
  })

  describe('onImportClear', () => {
    it('should clear importError and emit false', () => {
      const emitSpy = jest.spyOn(component.primaryButtonEnabled, 'emit')
      component.importError = { name: 'error' } as any

      component.onImportClear()

      expect(component.importError).toBeUndefined()
      expect(emitSpy).toHaveBeenCalledWith(false)
    })

    it('should call fileUploader.clear when fileUploader is set', () => {
      const clearSpy = jest.fn()
      component.fileUploader = { clear: clearSpy } as unknown as FileUpload

      component.onImportClear()

      expect(clearSpy).toHaveBeenCalled()
    })

    it('should not throw when fileUploader is undefined', () => {
      component.fileUploader = undefined

      expect(() => component.onImportClear()).not.toThrow()
    })
  })

  describe('ocxDialogButtonClicked', () => {
    it('should set dialogResult with Private scope when only private is selected', () => {
      component.workspaceName = 'ws'
      component.private = true
      component.public = false
      component.snapshot = { bookmarks: [] } as any
      component.mode = EximMode.Append

      component.ocxDialogButtonClicked()

      expect(component.dialogResult).toEqual({
        workspaceName: 'ws',
        snapshot: { bookmarks: [] },
        importMode: EximMode.Append,
        scopes: [EximBookmarkScope.Private]
      })
    })

    it('should set dialogResult with Public scope when only public is selected', () => {
      component.workspaceName = 'ws'
      component.private = false
      component.public = true
      component.snapshot = { bookmarks: [] } as any
      component.mode = EximMode.Overwrite

      component.ocxDialogButtonClicked()

      expect(component.dialogResult).toEqual({
        workspaceName: 'ws',
        snapshot: { bookmarks: [] },
        importMode: EximMode.Overwrite,
        scopes: [EximBookmarkScope.Public]
      })
    })

    it('should set dialogResult with both scopes when both are selected', () => {
      component.workspaceName = 'ws'
      component.private = true
      component.public = true
      component.snapshot = undefined

      component.ocxDialogButtonClicked()

      expect(component.dialogResult).toMatchObject({
        workspaceName: 'ws',
        scopes: [EximBookmarkScope.Private, EximBookmarkScope.Public]
      })
    })
  })
})
