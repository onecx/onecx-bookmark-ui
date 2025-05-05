/* eslint-disable @typescript-eslint/no-var-requires */
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { BreadcrumbService, PortalCoreModule } from '@onecx/portal-integration-angular'

import { BookmarkCreateUpdateComponent } from './bookmark-create-update.component'

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

    fixture = TestBed.createComponent(BookmarkCreateUpdateComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
