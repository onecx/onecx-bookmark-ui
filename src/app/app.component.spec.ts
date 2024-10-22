/* eslint-disable @typescript-eslint/no-var-requires */
import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { AUTH_SERVICE, MockAuthModule, PortalCoreModule } from '@onecx/portal-integration-angular'
import { AppComponent } from './app.component'

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [
        RouterTestingModule,
        PortalCoreModule.forRoot('test'),
        HttpClientTestingModule,
        TranslateTestingModule.withTranslations('en', require('./src/assets/i18n/en.json')).withTranslations(
          'de',
          require('./src/assets/i18n/de.json')
        )
      ],
      providers: [{ provide: AUTH_SERVICE, useClass: MockAuthModule }]
    }).compileComponents()
  })

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent)
    const app = fixture.componentInstance
    expect(app).toBeTruthy()
  })
})
