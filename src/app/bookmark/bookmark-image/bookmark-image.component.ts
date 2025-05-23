import { Component, Input, OnChanges } from '@angular/core'
import { Location } from '@angular/common'
import { map, Observable } from 'rxjs'

import { AppStateService } from '@onecx/angular-integration-interface'

import { Bookmark } from 'src/app/shared/generated'
import { environment } from 'src/environments/environment'

import { Product } from '../bookmark-overview/bookmark-overview.component'

@Component({
  selector: 'app-bookmark-image',
  templateUrl: './bookmark-image.component.html',
  styleUrls: ['./bookmark-image.component.scss']
})
export class BookmarkImageComponent implements OnChanges {
  @Input() public bookmark: Bookmark | undefined
  @Input() public product: Product | undefined
  @Input() public styleClass: string | undefined

  public defaultImageUrl$: Observable<string>
  public bookmarkImageBaseURL$: Observable<string | undefined>
  public errorImage$: Observable<string> | undefined
  public loading = true
  public productLogoUrl: string | undefined

  constructor(appStateService: AppStateService) {
    this.defaultImageUrl$ = appStateService.currentMfe$.pipe(
      map((mfe) => {
        return this.prepareUrlPath(mfe.remoteBaseUrl, environment.DEFAULT_LOGO_PATH)
      })
    )
    // bookmark image URL via bookmark BFF
    this.bookmarkImageBaseURL$ = appStateService.currentMfe$.pipe(
      map((mfe) => {
        return this.prepareUrlPath(mfe.remoteBaseUrl, 'bff/images/product/')
      })
    )
  }
  public ngOnChanges(): void {
    if (this.product) {
      this.productLogoUrl = this.product?.imageUrl
      console.log('bookmark-image', this.product, this.productLogoUrl)
    }
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
    this.errorImage$ = this.defaultImageUrl$
  }
}
