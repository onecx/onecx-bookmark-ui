import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing'
import { BookmarkCreateUpdateComponent } from './bookmark-create-update.component'
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { UserService } from '@onecx/angular-integration-interface'
import { BookmarkScope } from 'src/app/shared/generated'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { BreadcrumbService } from '@onecx/angular-accelerator'
import { PortalCoreModule } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { TranslateService } from '@ngx-translate/core'

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

describe('BookmarkCreateUpdateComponent', () => {
  let component: BookmarkCreateUpdateComponent
  let fixture: ComponentFixture<BookmarkCreateUpdateComponent>
  let userService: UserService
  const mockActivatedRoute = {}
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [
        PortalCoreModule,
        FormsModule,
        ReactiveFormsModule,
        LetDirective,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        BreadcrumbService,
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents()
    userService = TestBed.inject(UserService)
    userService.hasPermission = () => true
    fixture = TestBed.createComponent(BookmarkCreateUpdateComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should disable form if no permission', () => {
    component.vm = {
      initialBookmark: { displayName: 'Test', scope: BookmarkScope.Private, id: 'a', position: 0, workspaceName: 'w1' },
      permissions: [],
      mode: 'CREATE'
    }
    fixture.detectChanges()
    component.ngOnChanges()
    expect(component.formGroup.disabled).toBe(true)
  })

  it('should enable form if permission exists', () => {
    component.vm = {
      initialBookmark: { displayName: 'Test', scope: BookmarkScope.Private, id: 'a', position: 0, workspaceName: 'w1' },
      permissions: ['BOOKMARK#CREATE'],
      mode: 'CREATE'
    }
    fixture.detectChanges()
    component.ngOnChanges()
    expect(component.formGroup.enabled).toBe(true)
  })

  it('should disable form if bookmark is public', () => {
    component.vm = {
      initialBookmark: { displayName: 'Test', scope: BookmarkScope.Public, id: 'a', position: 0, workspaceName: 'w1' },
      permissions: ['BOOKMARK#CREATE'],
      mode: 'CREATE'
    }
    fixture.detectChanges()
    component.ngOnChanges()
    expect(component.formGroup.disabled).toBe(true)
  })

  it('should emit dialog result on button click', () => {
    component.vm = {
      initialBookmark: {
        displayName: 'Old Name',
        scope: BookmarkScope.Private,
        id: 'a',
        position: 0,
        workspaceName: 'w1'
      },
      permissions: ['BOOKMARK#CREATE'],
      mode: 'CREATE'
    }
    component.formGroup.setValue({ displayName: 'New Name' })
    component.ocxDialogButtonClicked()
    expect(component.dialogResult?.displayName).toBe('New Name')
  })

  it('should emit primaryButtonEnabled based on form validity', fakeAsync(() => {
    const emitSpy = jest.spyOn(component.primaryButtonEnabled, 'emit')
    component.vm = {
      initialBookmark: undefined,
      permissions: ['BOOKMARK#CREATE'],
      mode: 'CREATE'
    }
    fixture.detectChanges()
    component.ngOnChanges()
    component.formGroup.setValue({ displayName: 'Valid Name' })
    tick()
    expect(emitSpy).toHaveBeenCalledWith(true)
    flush()
  }))

  it('should call userService.hasPermission if permissions not set', () => {
    jest.spyOn(userService, 'hasPermission')
    component.vm = {
      initialBookmark: undefined,
      permissions: undefined,

      mode: 'CREATE'
    }
    component.ngOnChanges()
    expect(userService.hasPermission).toHaveBeenCalledWith('BOOKMARK#CREATE')
  })

  it('should emit false if no permission or public bookmark', fakeAsync(() => {
    const emitSpy = jest.spyOn(component.primaryButtonEnabled, 'emit')
    component.vm = {
      initialBookmark: { displayName: 'Test', scope: BookmarkScope.Public, id: '', position: 0, workspaceName: 'w1' },
      permissions: ['BOOKMARK#CREATE'],
      mode: 'CREATE'
    }

    fixture.detectChanges()
    component.ngOnChanges()

    component.formGroup.setValue({ displayName: 'Valid Name' })
    tick(500)

    expect(emitSpy).toHaveBeenCalledWith(false)
    flush()
  }))

  it('should validate all error tailor configurations', () => {
    const translateService = TestBed.inject(TranslateService)
    jest.spyOn(translateService, 'instant').mockReturnValue('error message')

    // Trigger required validation
    component.formGroup.get('displayName')?.setValue('')
    component.formGroup.get('displayName')?.markAsTouched()
    expect(component.formGroup.get('displayName')?.hasError('required')).toBe(true)

    // Trigger minlength validation
    component.formGroup.get('displayName')?.setValue('a')
    expect(component.formGroup.get('displayName')?.hasError('minlength')).toBe(true)

    // Trigger maxlength validation
    component.formGroup.get('displayName')?.setValue('a'.repeat(256))
    expect(component.formGroup.get('displayName')?.hasError('maxlength')).toBe(true)

    // Trigger pattern validation by adding a pattern validator temporarily
    component.formGroup.get('displayName')?.addValidators(Validators.pattern(/^[A-Z]/))
    component.formGroup.get('displayName')?.setValue('lowercase')
    component.formGroup.get('displayName')?.updateValueAndValidity()
    expect(component.formGroup.get('displayName')?.hasError('pattern')).toBe(true)
  })
})
