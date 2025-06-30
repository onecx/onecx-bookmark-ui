import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'
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
export class BookmarkImageComponent implements OnChanges {
  @Input() public bookmark: Bookmark | undefined
  @Input() public product: Product | undefined
  @Input() public styleClass: string | undefined

  public defaultImageUrl$: Observable<string>
  public bookmarkImageBaseURL$: Observable<string> | undefined
  public errorImage$: Observable<string> | undefined
  public loading = true
  public productLogoUrl: string | undefined
  private imageLoadCounter = 0

  constructor(private readonly appStateService: AppStateService) {
    this.errorImage$ = undefined
    this.defaultImageUrl$ = appStateService.currentMfe$.pipe(
      map((mfe) => {
        return this.prepareUrlPath(mfe.remoteBaseUrl, environment.DEFAULT_LOGO_PATH)
      })
    )
    // bookmark image URL via bookmark BFF
    this.bookmarkImageBaseURL$ = appStateService.currentMfe$.pipe(
      map((mfe) => {
        return this.prepareUrlPath(mfe.remoteBaseUrl, 'bff/images/') + this.bookmark?.id
      })
    )
  }
  public ngOnChanges(changes: SimpleChanges): void {
    if (this.bookmark?.id) {
      if (changes['product'] && !changes['product'].firstChange && this.product) {
        this.productLogoUrl = this.product?.imageUrl
        // if default was loaded and product image url exists, then try to get product logos
        if (this.imageLoadCounter === 2 && this.productLogoUrl) {
          this.errorImage$ = undefined
          this.loading = true
          this.imageLoadCounter = 0
          this.onImageError()
        }
      }
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

  /**
   * Loading order:
   *   0 => load bookmark a) URL b) image
   *   1 => loaded the product URL => prepared by RC product data with existing extern or image URL of the product
   *   2 => loaded default bookmark image
   */
  public onImageError() {
    if (this.loading) {
      // load bookmark default logo
      if (this.imageLoadCounter === 1 || (this.imageLoadCounter === 0 && !this.productLogoUrl)) {
        this.errorImage$ = this.defaultImageUrl$
        this.imageLoadCounter = 2
      }
      // load product logo
      if (this.imageLoadCounter === 0 && this.productLogoUrl) {
        this.errorImage$ = of(this.productLogoUrl)
        this.imageLoadCounter = 1
      }
    }
  }
}
