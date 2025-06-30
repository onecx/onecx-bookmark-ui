/* eslint-disable @typescript-eslint/no-var-requires */
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { TabViewModule } from 'primeng/tabview'

import { BreadcrumbService } from '@onecx/angular-accelerator'
import { AppStateService, PortalCoreModule, UserService } from '@onecx/portal-integration-angular'

import { BookmarkDetailComponent, Product } from './bookmark-detail.component'
import { of, throwError } from 'rxjs'
import { AppStateServiceMock, provideAppStateServiceMock } from '@onecx/angular-integration-interface/mocks'
import { provideMockStore } from '@ngrx/store/testing'
import { BookmarkDetailViewModel } from './bookmark-detail.viewmodel'
import { BookmarkScope } from 'src/app/shared/generated'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn()
  }))

describe('BookmarkDetailComponent', () => {
  let component: BookmarkDetailComponent
  let fixture: ComponentFixture<BookmarkDetailComponent>
  let appStateMock: AppStateServiceMock
  const baseBookmarkDetailViewModel: BookmarkDetailViewModel = {
    changeMode: 'VIEW',
    initialBookmark: {
      displayName: 'b1',
      position: 1,
      scope: BookmarkScope.Private,
      workspaceName: 'w1',
      appId: 'app1',
      productName: 'p1',
      id: '123',
      query: { q: 'abc' },
      endpointName: 'endpoint',
      endpointParameters: { a: 'abc' }
    },
    permissions: ['']
  }

  const mockActivatedRoute = {}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BookmarkDetailComponent],
      imports: [
        PortalCoreModule,
        FormsModule,
        ReactiveFormsModule,
        LetDirective,
        TabViewModule,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        BreadcrumbService,
        provideHttpClient(),
        provideHttpClientTesting(),
        AppStateService,
        provideAppStateServiceMock(),
        provideMockStore({ initialState: {} }),
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents()
    fixture = TestBed.createComponent(BookmarkDetailComponent)
    component = fixture.componentInstance
    appStateMock = TestBed.inject(AppStateServiceMock)
    appStateMock.currentMfe$.publish({
      appId: 'abc',
      baseHref: 'http:test.de',
      productName: 'p1',
      shellName: 'shell',
      mountPath: '',
      remoteBaseUrl: 'http://example.com'
    })
    const userService = TestBed.inject(UserService)
    userService.hasPermission = () => true
    component.vm = baseBookmarkDetailViewModel

    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
  it('should return appName for matching appId', () => {
    const product = {
      applications: [{ appId: 'app1', appName: 'My App', deprecated: false, undeployed: false }]
    } as Product

    const result = component.getProductAppDisplayName(product, 'app1')
    expect(result).toBe('My App')
  })

  it('should return undefined if applications are undefined', () => {
    const product = {} as Product

    const result = component.getProductAppDisplayName(product, 'app1')
    expect(result).toBeUndefined()
  })

  it('should build the correct image URL', fakeAsync(() => {
    let emittedUrl: string | undefined
    ;(component as any).bookmarkImageBaseURL$.subscribe((url: any) => {
      emittedUrl = url
    })

    tick()

    expect(emittedUrl).toBe('http://example.com/bff/images/123')
    flush()
  }))
  it('should build no valid image URL if no url given', fakeAsync(() => {
    let emittedUrl: string | undefined
    appStateMock.currentMfe$.publish({
      appId: 'abc',
      baseHref: 'http:test.de',
      productName: 'p1',
      shellName: 'shell',
      mountPath: '',
      remoteBaseUrl: ''
    })
    ;(component as any).bookmarkImageBaseURL$.subscribe((url: any) => {
      emittedUrl = url
    })

    tick()

    expect(emittedUrl).toBe('123')
    flush()
  }))
  it('should build the image URL without id', fakeAsync(() => {
    let emittedUrl: string | undefined
    component.vm = { changeMode: 'VIEW', initialBookmark: undefined, permissions: [] }
    component.editable = false
    ;(component as any).bookmarkImageBaseURL$.subscribe((url: any) => {
      emittedUrl = url
    })

    tick()

    expect(emittedUrl).toBe('http://example.com/bff/images/undefined')
    flush()
  }))
  it('should create and fallback to empty strings if fields missing', fakeAsync(() => {
    component.vm = {
      changeMode: 'CREATE',
      initialBookmark: {
        displayName: 'b1',
        workspaceName: 'w1',
        scope: BookmarkScope.Private,
        position: 1,
        imageUrl: 'test'
      },
      permissions: []
    }
    component.ngOnInit()
    tick()
    expect(component).toBeTruthy()
    flush()
  }))
  it('should create if initialbookmark undefined', fakeAsync(() => {
    component.vm = {
      changeMode: 'CREATE',
      initialBookmark: undefined,
      permissions: []
    }
    component.ngOnInit()
    tick()
    expect(component).toBeTruthy()
    flush()
  }))
  it('should disable form if changemode is view', fakeAsync(() => {
    component.editable = true
    component.vm = {
      changeMode: 'VIEW',
      initialBookmark: {
        displayName: 'b1',
        workspaceName: 'w1',
        scope: BookmarkScope.Private,
        position: 1,
        imageUrl: 'test'
      },
      permissions: []
    }
    component.ngOnInit()
    tick()
    expect(component).toBeTruthy()
    flush()
  }))
  it('should enable form if changemode is edit', fakeAsync(() => {
    jest.spyOn(component.primaryButtonEnabled, 'emit')

    component.editable = true
    component.vm = {
      changeMode: 'EDIT',
      initialBookmark: {
        displayName: 'b1',
        workspaceName: 'w1',
        scope: BookmarkScope.Private,
        position: 1,
        imageUrl: 'test',
        url: 'abc'
      },
      permissions: []
    }

    component.ngOnInit()
    component.formGroup.get('displayName')?.setValue('Valid Name')
    component.formGroup.get('endpointName')?.setValue('ep')
    component.formGroup.get('endpointParams')?.setValue('{"q":"abc"}')
    component.formGroup.get('query')?.setValue('{"q": "abc"}')
    component.formGroup.get('fragment')?.setValue('fragment')
    component.formGroup.get('url')?.setValue('https://example.com')
    component.formGroup.get('imageUrl')?.setValue('https://example.com/image.png')

    component.formGroup.updateValueAndValidity()
    tick()

    expect(component).toBeTruthy()
    expect(component.primaryButtonEnabled.emit).toHaveBeenCalledWith(true)
    flush()
  }))
  it('should not enable validator for url if bookmark is undefined', fakeAsync(() => {
    jest.spyOn(component.primaryButtonEnabled, 'emit')

    component.editable = true
    component.vm = {
      changeMode: 'EDIT',
      initialBookmark: undefined,
      permissions: []
    }

    component.ngOnInit()
    component.formGroup.get('displayName')?.setValue('Valid Name')
    component.formGroup.get('endpointName')?.setValue('ep')
    component.formGroup.get('endpointParams')?.setValue('{"q":"abc"}')
    component.formGroup.get('query')?.setValue('{"q": "abc"}')
    component.formGroup.get('fragment')?.setValue('fragment')
    component.formGroup.get('url')?.setValue('https://example.com')
    component.formGroup.get('imageUrl')?.setValue('https://example.com/image.png')

    component.formGroup.updateValueAndValidity()
    tick()

    expect(component).toBeTruthy()

    flush()
  }))
  it('should invalidate formgroup if json is not valid', fakeAsync(() => {
    jest.spyOn(component.primaryButtonEnabled, 'emit')

    component.editable = true
    component.vm = {
      changeMode: 'EDIT',
      initialBookmark: {
        displayName: 'b1',
        workspaceName: 'w1',
        scope: BookmarkScope.Private,
        position: 1,
        imageUrl: 'test',
        url: 'abc'
      },
      permissions: []
    }

    component.ngOnInit()
    component.formGroup.get('displayName')?.setValue('Valid Name')
    component.formGroup.get('endpointName')?.setValue('ep')
    component.formGroup.get('endpointParams')?.setValue('abc')
    component.formGroup.get('query')?.setValue('abc')
    component.formGroup.get('fragment')?.setValue('fragment')
    component.formGroup.get('url')?.setValue('https://example.com')
    component.formGroup.get('imageUrl')?.setValue('https://example.com/image.png')

    component.formGroup.updateValueAndValidity()
    tick()

    expect(component.formGroup.valid).toBeFalsy()
    flush()
  }))
  it('should return data if ocx button clicked and changemode is not CREATE', fakeAsync(() => {
    jest.spyOn(component.primaryButtonEnabled, 'emit')

    component.editable = true
    component.vm = {
      changeMode: 'EDIT',
      initialBookmark: {
        displayName: 'b1',
        workspaceName: 'w1',
        scope: BookmarkScope.Private,
        position: 1,
        imageUrl: 'test',
        url: 'abc'
      },
      permissions: []
    }

    component.ngOnInit()
    component.formGroup.get('displayName')?.setValue('Valid Name')
    component.formGroup.get('endpointName')?.setValue('ep')
    component.formGroup.get('endpointParams')?.setValue('{"q":"abc"}')
    component.formGroup.get('query')?.setValue('{"q": "abc"}')
    component.formGroup.get('fragment')?.setValue('fragment')
    component.formGroup.get('url')?.setValue('https://example.com')
    component.formGroup.get('imageUrl')?.setValue('https://example.com/image.png')

    component.formGroup.updateValueAndValidity()
    tick()
    component.ocxDialogButtonClicked()
    tick()
    expect(component).toBeTruthy()
    flush()
  }))
  it('should return data if ocx button clicked and changemode is not CREATE with edge case data', fakeAsync(() => {
    jest.spyOn(component.primaryButtonEnabled, 'emit')

    component.editable = true
    component.vm = {
      changeMode: 'EDIT',
      initialBookmark: {
        displayName: 'b1',
        workspaceName: 'w1',
        scope: BookmarkScope.Private,
        imageUrl: 'test',
        url: 'abc'
      } as any,
      permissions: []
    }

    component.ngOnInit()
    component.formGroup.get('displayName')?.setValue('Valid Name')
    component.formGroup.get('endpointName')?.setValue('ep')
    component.formGroup.get('fragment')?.setValue('fragment')
    component.formGroup.get('url')?.setValue('https://example.com')
    component.formGroup.get('is_public')?.setValue(true)
    component.formGroup.get('imageUrl')?.setValue('')

    component.formGroup.updateValueAndValidity()
    tick()
    component.ocxDialogButtonClicked()
    tick()
    expect(component).toBeTruthy()
    flush()
  }))

  it('should catch error on ocx button clicked and json is invalid', fakeAsync(() => {
    jest.spyOn(component.primaryButtonEnabled, 'emit')

    component.editable = true
    component.vm = {
      changeMode: 'EDIT',
      initialBookmark: {
        displayName: 'b1',
        workspaceName: 'w1',
        scope: BookmarkScope.Private,
        imageUrl: 'test',
        url: 'abc'
      } as any,
      permissions: []
    }

    component.ngOnInit()
    component.formGroup.get('displayName')?.setValue('Valid Name')
    component.formGroup.get('endpointName')?.setValue('{{"')
    component.formGroup.get('query')?.setValue('{{"')
    component.formGroup.get('fragment')?.setValue('fragment')
    component.formGroup.get('url')?.setValue('https://example.com')
    component.formGroup.get('is_public')?.setValue(true)
    component.formGroup.get('imageUrl')?.setValue('')

    component.formGroup.updateValueAndValidity()
    tick()
    component.ocxDialogButtonClicked()

    expect(component).toBeTruthy()
  }))

  it('should remove logo on button click => imageUrl', fakeAsync(() => {
    // jest.spyOn(ImagesInternalAPIService, 'deleteImage')

    component.editable = true
    component.vm = {
      changeMode: 'EDIT',
      initialBookmark: {
        displayName: 'b1',
        workspaceName: 'w1',
        scope: BookmarkScope.Public,
        imageUrl: 'test',
        url: 'abc',
        id: '1',
        position: 0
      },
      permissions: []
    }
    component.ngOnInit()
    component.formGroup.get('displayName')?.setValue('Valid Name')
    component.formGroup.get('endpointName')?.setValue('ep')
    component.formGroup.get('fragment')?.setValue('fragment')
    component.formGroup.get('url')?.setValue('https://example.com')
    component.formGroup.get('is_public')?.setValue(true)
    component.formGroup.get('imageUrl')?.setValue('testValue')

    component.formGroup.updateValueAndValidity()
    tick()
    fixture.detectChanges()

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('#bm_detail_form_field_remove_logo')
    expect(button).toBeTruthy()
    button.click()
    fixture.detectChanges()

    expect(component).toBeTruthy()
  }))
  it('should remove logo on button click => image', fakeAsync(() => {
    jest.spyOn((component as any).imageApi, 'deleteImage').mockReturnValue(of({}))

    component.editable = true
    component.vm = {
      changeMode: 'EDIT',
      initialBookmark: {
        displayName: 'b1',
        workspaceName: 'w1',
        scope: BookmarkScope.Public,
        url: 'abc',
        id: '1',
        position: 0
      },
      permissions: []
    }
    component.ngOnInit()
    component.formGroup.get('displayName')?.setValue('Valid Name')
    component.formGroup.get('endpointName')?.setValue('ep')
    component.formGroup.get('fragment')?.setValue('fragment')
    component.formGroup.get('url')?.setValue('https://example.com')
    component.formGroup.get('is_public')?.setValue(true)

    component.formGroup.updateValueAndValidity()
    tick()
    fixture.detectChanges()

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('#bm_detail_form_field_remove_logo')
    expect(button).toBeTruthy()
    button.click()
    fixture.detectChanges()

    expect(component).toBeTruthy()
  }))
  it('should catch error on remove logo => image', fakeAsync(() => {
    jest.spyOn((component as any).imageApi, 'deleteImage').mockReturnValue(throwError(() => new Error('test error')))

    component.editable = true
    component.vm = {
      changeMode: 'EDIT',
      initialBookmark: {
        displayName: 'b1',
        workspaceName: 'w1',
        scope: BookmarkScope.Public,
        url: 'abc',
        id: '1',
        position: 0
      },
      permissions: []
    }
    component.ngOnInit()
    component.formGroup.get('displayName')?.setValue('Valid Name')
    component.formGroup.get('endpointName')?.setValue('ep')
    component.formGroup.get('fragment')?.setValue('fragment')
    component.formGroup.get('url')?.setValue('https://example.com')
    component.formGroup.get('is_public')?.setValue(true)

    component.formGroup.updateValueAndValidity()
    tick()
    fixture.detectChanges()

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('#bm_detail_form_field_remove_logo')
    expect(button).toBeTruthy()
    button.click()
    fixture.detectChanges()

    expect(component).toBeTruthy()
  }))
  it('should do nothing on remove logo if no bookmark is set => image', fakeAsync(() => {
    jest.spyOn((component as any).imageApi, 'deleteImage').mockReturnValue(throwError(() => new Error('test error')))

    component.editable = true
    component.vm = {
      changeMode: 'EDIT',
      permissions: []
    } as any as BookmarkDetailViewModel
    component.ngOnInit()
    component.formGroup.get('displayName')?.setValue('Valid Name')
    component.formGroup.get('endpointName')?.setValue('ep')
    component.formGroup.get('fragment')?.setValue('fragment')
    component.formGroup.get('url')?.setValue('https://example.com')
    component.formGroup.get('is_public')?.setValue(true)
    component.formGroup.get('image_url')?.setValue('someURL')
    component.formGroup.updateValueAndValidity()
    tick()
    fixture.detectChanges()
    component.onRemoveLogo()
    fixture.detectChanges()

    expect(component).toBeTruthy()
  }))
  it('should remove logo => edge cases with missing id', fakeAsync(() => {
    component.editable = true
    component.vm = {
      changeMode: 'EDIT',
      initialBookmark: {
        displayName: 'b1',
        workspaceName: 'w1',
        scope: BookmarkScope.Public,
        url: 'abc',
        position: 0
      },
      permissions: []
    }
    fixture.detectChanges()

    component.ngOnInit()
    component.formGroup.get('displayName')?.setValue('Valid Name')
    component.formGroup.get('endpointName')?.setValue('ep')
    component.formGroup.get('fragment')?.setValue('fragment')
    component.formGroup.get('url')?.setValue('https://example.com')
    component.formGroup.get('is_public')?.setValue(true)

    component.formGroup.updateValueAndValidity()
    tick()
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('#bm_detail_form_field_remove_logo')
    expect(button).toBeTruthy()
    button.click()
    fixture.detectChanges()
    expect(component).toBeTruthy()
  }))

  it('should remove logo => edge cases with missing bookmark ', fakeAsync(() => {
    component.editable = true
    component.vm = {
      changeMode: 'EDIT',
      initialBookmark: {} as any,
      permissions: []
    }
    fixture.detectChanges()
    component.ngOnInit()
    component.formGroup.get('displayName')?.setValue('Valid Name')
    component.formGroup.get('endpointName')?.setValue('ep')
    component.formGroup.get('fragment')?.setValue('fragment')
    component.formGroup.get('url')?.setValue('https://example.com')
    component.formGroup.get('is_public')?.setValue(true)
    component.formGroup.get('image_url')?.setValue('https://example.com')

    component.formGroup.updateValueAndValidity()
    tick()
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('#bm_detail_form_field_remove_logo')
    expect(button).toBeTruthy()
    button.click()
    fixture.detectChanges()
    expect(component).toBeTruthy()
  }))
  it('should show error if file is too large (direct call)', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 1000001 })

    const input = document.createElement('input')
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false
    })

    const event = { target: input } as unknown as Event

    ;(component as any).msgService = { error: jest.fn() }
    const errorSpy = jest.spyOn((component as any).msgService, 'error')

    component.onFileUpload(event, {
      id: '123',
      displayName: '',
      position: 0,
      scope: BookmarkScope.Public,
      workspaceName: '1'
    })

    expect(errorSpy).toHaveBeenCalledWith({
      summaryKey: 'IMAGE.CONSTRAINT_FAILED',
      detailKey: 'IMAGE.CONSTRAINT_SIZE'
    })
  })
  it('should show error if file type is invalid ', () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' })
    Object.defineProperty(file, 'size', { value: 100 }) // gültige Größe

    const input = document.createElement('input')
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false
    })

    const event = { target: input } as unknown as Event

    ;(component as any).msgService = { error: jest.fn() }
    const errorSpy = jest.spyOn((component as any).msgService, 'error')

    component.onFileUpload(event, {
      id: '123',
      displayName: '',
      position: 0,
      scope: BookmarkScope.Public,
      workspaceName: '1'
    })

    expect(errorSpy).toHaveBeenCalledWith({
      summaryKey: 'IMAGE.CONSTRAINT_FAILED',
      detailKey: 'IMAGE.CONSTRAINT_FILE_TYPE'
    })
  })
  it('should call saveImage if file is valid ', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 100 }) // gültige Größe

    const input = document.createElement('input')
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false
    })

    const event = { target: input } as unknown as Event

    const saveSpy = jest.spyOn(component as any, 'saveImage')

    component.onFileUpload(event, {
      id: '123',
      displayName: '',
      position: 0,
      scope: BookmarkScope.Public,
      workspaceName: '1'
    })

    expect(saveSpy).toHaveBeenCalledWith('123', input.files)
  })
  it('should show error if no file is present ', () => {
    const event = { target: null } as Event

    ;(component as any).msgService = { error: jest.fn() }
    const errorSpy = jest.spyOn((component as any).msgService, 'error')

    component.onFileUpload(event)

    expect(errorSpy).toHaveBeenCalledWith({
      summaryKey: 'IMAGE.CONSTRAINT_FAILED',
      detailKey: 'IMAGE.CONSTRAINT_FILE_MISSING'
    })
  })
  it('should upload image and show success message (direct call)', () => {
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })
    const fileList = {
      0: file,
      length: 1,
      item: (index: number) => file
    } as FileList

    ;(component as any).msgService = { info: jest.fn() }
    const infoSpy = jest.spyOn((component as any).msgService, 'info')

    ;(component as any).prepareImageUrl = jest.fn()
    ;(component as any).imageApi = {
      uploadImage: jest.fn().mockReturnValue(of({}))
    }
    ;(component as any).saveImage('123', fileList)

    expect((component as any).imageApi.uploadImage).toHaveBeenCalled()
    expect((component as any).prepareImageUrl).toHaveBeenCalledWith('123')
    expect(component.onBookmarkImageLoadError).toBe(false)
    expect(infoSpy).toHaveBeenCalledWith({
      summaryKey: 'IMAGE.UPLOAD_SUCCESS'
    })
  })
  it('should set fetchingLogoUrl and reset error if input has value ', () => {
    const input = document.createElement('input')
    input.value = 'https://example.com/logo.png'

    const event = { target: input } as unknown as Event

    component.onBookmarkImageLoadError = true

    component.onInputChange(event, {
      id: '123',
      displayName: '',
      position: 0,
      scope: BookmarkScope.Public,
      workspaceName: '1'
    })

    expect(component.onBookmarkImageLoadError).toBe(false)
    expect(component.fetchingLogoUrl).toBe('https://example.com/logo.png')
  })

  it('should do nothing if no bookmark is provided', () => {
    const input = document.createElement('input')
    input.value = 'https://example.com/logo.png'

    const event = { target: input } as unknown as Event

    component.fetchingLogoUrl = undefined
    component.onBookmarkImageLoadError = true

    component.onInputChange(event)

    expect(component.fetchingLogoUrl).toBeUndefined()
    expect(component.onBookmarkImageLoadError).toBe(true)
  })
})
