import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PageNotBookmarkableDialogComponent } from './page-not-bookmarkable-dialog.component'

describe('PageNotBookmarkableDialogComponent', () => {
  let component: PageNotBookmarkableDialogComponent
  let fixture: ComponentFixture<PageNotBookmarkableDialogComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      imports: [
        PageNotBookmarkableDialogComponent,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(PageNotBookmarkableDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have mfeBaseUrl undefined by default', () => {
    expect(component.mfeBaseUrl).toBeUndefined()
  })

  it('should accept a mfeBaseUrl input', () => {
    component.mfeBaseUrl = 'http://example.com'

    expect(component.mfeBaseUrl).toBe('http://example.com')
  })
})
