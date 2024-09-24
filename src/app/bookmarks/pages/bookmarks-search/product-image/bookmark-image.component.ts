import { Component, Input } from '@angular/core'
import { AppStateService } from '@onecx/angular-integration-interface'
import { map, Observable } from 'rxjs'
import { Bookmark } from 'src/app/shared/generated'
import { environment } from 'src/environments/environment'
import { Location } from '@angular/common'

@Component({
  selector: 'app-bookmark-image',
  templateUrl: './bookmark-image.component.html',
  styleUrls: ['./bookmark-image.component.scss']
})
export class BookmarkImageComponent {
  defaultImageUrl$: Observable<string>
  productLogoBaseURL$: Observable<string>

  @Input() public bookmark: Bookmark | undefined
  public loading = true
  public errorImage$: Observable<string> | undefined

  constructor(appStateService: AppStateService) {
    this.defaultImageUrl$ = appStateService.currentMfe$.pipe(
      map((mfe) => {
        return this.prepareUrlPath(mfe.remoteBaseUrl, environment.DEFAULT_LOGO_PATH)
      })
    )

    this.productLogoBaseURL$ = appStateService.currentMfe$.pipe(
      map((mfe) => {
        return this.prepareUrlPath(mfe.remoteBaseUrl, 'bff/images/product/')
      })
    )
  }

  prepareUrlPath(url?: string, path?: string): string {
    if (url && path) return Location.joinWithSlash(url, path)
    else if (url) return url
    else return ''
  }

  onImageLoad() {
    this.loading = false
  }

  onImageError() {
    this.errorImage$ = this.defaultImageUrl$
  }
}
