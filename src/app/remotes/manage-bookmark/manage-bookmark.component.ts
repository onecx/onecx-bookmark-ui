import { HttpClient } from '@angular/common/http'
import { APP_INITIALIZER, Component, Inject, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { AppConfigService, createRemoteComponentTranslateLoader } from '@onecx/angular-accelerator'
import { UserService } from '@onecx/angular-integration-interface'
import {
  AngularRemoteComponentsModule,
  BASE_URL,
  ocxRemoteComponent,
  ocxRemoteWebcomponent,
  provideTranslateServiceForRoot,
  RemoteComponentConfig,
  SLOT_SERVICE,
  SlotService
} from '@onecx/angular-remote-components'
import { PortalCoreModule } from '@onecx/portal-integration-angular'
import { SharedModule } from 'primeng/api'
import { RippleModule } from 'primeng/ripple'
import { ReplaySubject } from 'rxjs'

export function slotInitializer(slotService: SlotService) {
  return () => slotService.init()
}

@Component({
  standalone: true,
  imports: [AngularRemoteComponentsModule, FormsModule, SharedModule, RippleModule, PortalCoreModule, TranslateModule],
  providers: [
    {
      provide: BASE_URL,
      useValue: new ReplaySubject<string>(1)
    },
    provideTranslateServiceForRoot({
      isolate: true,
      loader: {
        provide: TranslateLoader,
        useFactory: createRemoteComponentTranslateLoader,
        deps: [HttpClient, BASE_URL]
      }
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: slotInitializer,
      deps: [SLOT_SERVICE],
      multi: true
    },
    {
      provide: SLOT_SERVICE,
      useExisting: SlotService
    }
  ],
  selector: 'app-manage-bookmark',
  templateUrl: './manage-bookmark.component.html',
  styleUrls: ['./manage-bookmark.component.scss']
})
export class OneCXManageBookmarkComponent implements ocxRemoteComponent, ocxRemoteWebcomponent {
  permissions: string[] = []
  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }

  constructor(
    @Inject(BASE_URL) private baseUrl: ReplaySubject<string>,
    private appConfigService: AppConfigService,
    private userService: UserService,
    private translateService: TranslateService
  ) {
    this.userService.lang$.subscribe((lang) => this.translateService.use(lang))
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.baseUrl.next(config.baseUrl)
    this.permissions = config.permissions
    this.appConfigService.init(config.baseUrl)
  }
}
