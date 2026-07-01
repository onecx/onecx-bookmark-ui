import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

// import { DisabledAuthService, AuthService } from '@onecx/angular-auth'
import { AngularAcceleratorModule } from '@onecx/angular-accelerator'
import { AppComponent } from './app.component'

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [
        AngularAcceleratorModule,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        // { provide: AuthService, useClass: DisabledAuthService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents()
  })

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent)
    const app = fixture.componentInstance
    expect(app).toBeTruthy()
  })
})
