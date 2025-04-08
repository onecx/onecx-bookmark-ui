import { ComponentHarness } from '@angular/cdk/testing'

import {
  GroupByCountDiagramHarness,
  InteractiveDataViewHarness,
  PageHeaderHarness
} from '@onecx/angular-accelerator/testing'

export class BookmarkConfigureHarness extends ComponentHarness {
  static readonly hostSelector = 'app-bookmark-search'

  getHeader = this.locatorFor(PageHeaderHarness)
  getSearchResults = this.locatorFor(InteractiveDataViewHarness)
  getDiagram = this.locatorForOptional(GroupByCountDiagramHarness)
}
