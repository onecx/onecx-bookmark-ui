import { AppStateService, ConfigurationService } from '@onecx/angular-integration-interface'
import { PortalApiConfiguration } from '@onecx/angular-utils'

import { environment } from 'src/environments/environment'
import { Configuration } from '../generated'

export function apiConfigProvider(configService: ConfigurationService, appStateService: AppStateService) {
  return new PortalApiConfiguration(Configuration, environment.apiPrefix)
}
