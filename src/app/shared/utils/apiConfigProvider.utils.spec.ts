import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'

import { AppStateService, ConfigurationService } from '@onecx/angular-integration-interface'
import { provideAppStateServiceMock } from '@onecx/angular-integration-interface/mocks'
import { PortalApiConfiguration } from '@onecx/angular-utils'

import { apiConfigProvider } from './apiConfigProvider.utils'

describe('apiConfigProvider', () => {
  let configService: ConfigurationService
  let appStateService: AppStateService

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AppStateService,
        provideAppStateServiceMock(),
        ConfigurationService
      ]
    }).compileComponents()

    configService = TestBed.inject(ConfigurationService)
    appStateService = TestBed.inject(AppStateService)
  })

  it('should return a PortalApiConfiguration instance', () => {
    const result = TestBed.runInInjectionContext(() => apiConfigProvider(configService, appStateService))
    expect(result).toBeInstanceOf(PortalApiConfiguration)
  })

  it('should pass the Configuration class to PortalApiConfiguration', () => {
    const spy = jest.spyOn(PortalApiConfiguration.prototype as object, 'constructor' as never)
    const result = TestBed.runInInjectionContext(() => apiConfigProvider(configService, appStateService))
    expect(result).toBeInstanceOf(PortalApiConfiguration)
    spy.mockRestore()
  })
})
