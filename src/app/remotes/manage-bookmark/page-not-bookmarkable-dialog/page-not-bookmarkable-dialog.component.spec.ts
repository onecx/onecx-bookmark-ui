import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { provideTranslateTestingService } from '@onecx/angular-testing'

import { PageNotBookmarkableDialogComponent } from './page-not-bookmarkable-dialog.component'

describe('PageNotBookmarkableDialogComponent', () => {
  let component: PageNotBookmarkableDialogComponent
  let fixture: ComponentFixture<PageNotBookmarkableDialogComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageNotBookmarkableDialogComponent],
      providers: [
        provideNoopAnimations(),
        ...provideTranslateTestingService({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        })
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
