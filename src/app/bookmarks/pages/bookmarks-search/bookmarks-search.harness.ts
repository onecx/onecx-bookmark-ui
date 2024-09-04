import { ComponentHarness } from '@angular/cdk/testing';
import {
  GroupByCountDiagramHarness,
  InteractiveDataViewHarness,
  PageHeaderHarness,
} from '@onecx/angular-accelerator/testing';

export class BookmarksSearchHarness extends ComponentHarness {
  static hostSelector = 'app-bookmarks-search';

  getHeader = this.locatorFor(PageHeaderHarness);
  getSearchResults = this.locatorFor(InteractiveDataViewHarness);
  getDiagram = this.locatorForOptional(GroupByCountDiagramHarness);
}
