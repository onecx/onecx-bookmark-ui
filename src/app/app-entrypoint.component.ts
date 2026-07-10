import { Component, OnInit } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { RouterOutlet } from '@angular/router'
import { PrimeNG } from 'primeng/config'
import { merge, mergeMap } from 'rxjs'

@Component({
  selector: 'app-root',
  templateUrl: './app-entrypoint.component.html',
  imports: [RouterOutlet],
  standalone: true
})
export class AppEntrypointComponent implements OnInit {
  constructor(
    private readonly translateService: TranslateService,
    private readonly config: PrimeNG
  ) {}

  ngOnInit(): void {
    merge(
      this.translateService.onLangChange,
      this.translateService.onTranslationChange,
      this.translateService.onDefaultLangChange
    )
      .pipe(mergeMap(() => this.translateService.get('primeng')))
      .subscribe((res) => this.config.setTranslation(res))
  }
}
