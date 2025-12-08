import { Component } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslateService } from '@ngx-translate/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { SharedModule } from './shared.module'
import { LabelResolver } from './utils/label.resolver'

@Component({
  template: `
    <form [formGroup]="testForm">
      <input formControlName="testField" />
    </form>
  `,
  standalone: false
})
class TestComponent {
  testForm = new FormGroup({
    testField: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(10)])
  })
}

describe('SharedModule', () => {
  let component: TestComponent
  let fixture: ComponentFixture<TestComponent>
  let translateService: TranslateService

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [SharedModule, ReactiveFormsModule],
      providers: [
        {
          provide: TranslateService,
          useValue: {
            instant: jest.fn().mockReturnValue('error message'),
            get: jest.fn()
          }
        }
      ]
    }).compileComponents()

    translateService = TestBed.inject(TranslateService)
    fixture = TestBed.createComponent(TestComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create the module', () => {
    expect(SharedModule).toBeDefined()
  })

  it('should provide LabelResolver', () => {
    const labelResolver = TestBed.inject(LabelResolver)
    expect(labelResolver).toBeTruthy()
  })

  it('should trigger all error tailor validation configurations', () => {
    jest.spyOn(translateService, 'instant').mockReturnValue('error message')

    // Trigger required validation
    component.testForm.get('testField')?.setValue('')
    component.testForm.get('testField')?.markAsTouched()
    expect(component.testForm.get('testField')?.hasError('required')).toBe(true)

    // Trigger minlength validation
    component.testForm.get('testField')?.setValue('a')
    expect(component.testForm.get('testField')?.hasError('minlength')).toBe(true)

    // Trigger maxlength validation
    component.testForm.get('testField')?.setValue('a'.repeat(11))
    expect(component.testForm.get('testField')?.hasError('maxlength')).toBe(true)

    // Add pattern validator and trigger it
    component.testForm.get('testField')?.addValidators(Validators.pattern(/^[0-9]+$/))
    component.testForm.get('testField')?.setValue('abc')
    component.testForm.get('testField')?.updateValueAndValidity()
    expect(component.testForm.get('testField')?.hasError('pattern')).toBe(true)
  })
})
