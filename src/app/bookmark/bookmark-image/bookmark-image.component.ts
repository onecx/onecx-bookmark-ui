import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core'
import { Location, NgClass } from '@angular/common'
import { take } from 'rxjs'

import { SkeletonModule } from 'primeng/skeleton'

import { AngularAcceleratorModule } from '@onecx/angular-accelerator'
import { AppStateService } from '@onecx/angular-integration-interface'

import { Bookmark } from 'src/app/shared/generated'
import { environment } from 'src/environments/environment'

import { Product } from '../bookmark-overview/bookmark-overview.component'

@Component({
  selector: 'app-bookmark-image',
  standalone: true,
  imports: [AngularAcceleratorModule, NgClass, SkeletonModule],
  templateUrl: './bookmark-image.component.html',
  styleUrl: './bookmark-image.component.scss'
})
export class BookmarkImageComponent implements OnChanges {
  private readonly appStateService = inject(AppStateService)

  @Input() public bookmark: Bookmark | undefined
  @Input() public product: Product | undefined
  @Input() public styleClass: string | undefined

  public currentImageUrl: string | undefined
  public loading = true

  private remoteBaseUrl = ''
  // Ordered fallback list; walked front-to-back on each image load error
  private urlQueue: string[] = []
  private urlQueueIndex = 0

  constructor() {
    // Capture the remote base URL once — needed to build absolute paths for BFF and default logo
    this.appStateService.currentMfe$.pipe(take(1)).subscribe((mfe) => {
      this.remoteBaseUrl = mfe.remoteBaseUrl ?? ''
      this.rebuildUrlQueue()
      this.applyCurrentUrl()
    })
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['bookmark'] || changes['product']) {
      // Restart the fallback chain from the top when the displayed item changes
      this.rebuildUrlQueue()
      this.urlQueueIndex = 0
      this.loading = true
      this.applyCurrentUrl()
    }
  }

  public onImageLoad(): void {
    this.loading = false
  }

  public onImageError(): void {
    // Try the next URL in priority order
    this.urlQueueIndex++
    if (this.urlQueueIndex < this.urlQueue.length) {
      this.applyCurrentUrl()
    } else {
      // All fallbacks exhausted
      this.loading = false
      this.currentImageUrl = undefined
    }
  }

  private rebuildUrlQueue(): void {
    const queue: string[] = []

    // Priority 1: External URL stored directly on the bookmark
    if (this.bookmark?.imageUrl) {
      queue.push(this.bookmark.imageUrl)
    }

    // Priority 2: Image uploaded to BFF storage for this bookmark (identified by id)
    if (this.bookmark?.id && this.remoteBaseUrl) {
      queue.push(Location.joinWithSlash(this.remoteBaseUrl, `bff/images/${this.bookmark.id}`))
    }

    // Priority 3: Product logo URL
    if (this.product?.imageUrl) {
      queue.push(this.product.imageUrl)
    }

    // Priority 4: Default app logo served from the MFE remote base
    if (this.remoteBaseUrl) {
      queue.push(Location.joinWithSlash(this.remoteBaseUrl, environment.DEFAULT_LOGO_PATH))
    }

    this.urlQueue = queue
  }

  private applyCurrentUrl(): void {
    this.currentImageUrl = this.urlQueue[this.urlQueueIndex]
  }
}
