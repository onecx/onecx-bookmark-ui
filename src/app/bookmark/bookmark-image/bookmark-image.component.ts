import { Component, Input } from '@angular/core'
import { Location } from '@angular/common'
import { map, Observable, of } from 'rxjs'

import { AppStateService } from '@onecx/angular-integration-interface'

import { Bookmark } from 'src/app/shared/generated'
import { environment } from 'src/environments/environment'

import { Product } from '../bookmark-overview/bookmark-overview.component'

@Component({
  selector: 'app-bookmark-image',
  templateUrl: './bookmark-image.component.html',
  styleUrls: ['./bookmark-image.component.scss']
})
export class BookmarkImageComponent {
  @Input() public bookmark: Bookmark | undefined
  @Input() public product: Product | undefined
  @Input() public styleClass: string | undefined

  public defaultImageUrl$: Observable<string>
  public productLogoBaseURL$: Observable<string>
  public errorImage$: Observable<string> | undefined
  public loading = true

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

  private prepareUrlPath(url?: string, path?: string): string {
    if (url && path) return Location.joinWithSlash(url, path)
    else if (url) return url
    else return ''
  }

  public onImageLoad() {
    this.loading = false
  }

  public onImageError() {
    if (this.product?.imageUrl) this.errorImage$ = of(this.product?.imageUrl)
    else this.errorImage$ = this.defaultImageUrl$
  }
}
