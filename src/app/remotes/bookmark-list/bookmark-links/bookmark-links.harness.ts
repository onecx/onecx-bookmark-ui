import { ComponentHarness } from '@angular/cdk/testing'

export class BookmarkLinksHarness extends ComponentHarness {
  static readonly hostSelector = 'app-bookmark-links'

  getLinks = this.locatorForAll('a')

  async getLinkCount(): Promise<number> {
    return (await this.getLinks()).length
  }

  async getLinkText(index: number): Promise<string | null> {
    const links = await this.getLinks()
    return links[index]?.text() ?? null
  }
}
