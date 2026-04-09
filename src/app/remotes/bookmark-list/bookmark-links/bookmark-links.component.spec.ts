import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterModule } from '@angular/router'
import { of } from 'rxjs'

import { WorkspaceService } from '@onecx/angular-integration-interface'

import { BookmarkScope } from 'src/app/shared/generated'
import { BookmarkLinksComponent } from './bookmark-links.component'
import { BookmarkLinksHarness } from './bookmark-links.harness'

describe('BookmarkLinksComponent', () => {
  let component: BookmarkLinksComponent
  let fixture: ComponentFixture<BookmarkLinksComponent>
  let workspaceServiceMock: jest.Mocked<WorkspaceService>

  beforeEach(async () => {
    workspaceServiceMock = {
      getUrl: jest.fn()
    } as unknown as jest.Mocked<WorkspaceService>

    await TestBed.configureTestingModule({
      imports: [BookmarkLinksComponent, RouterModule.forRoot([])],
      providers: [{ provide: WorkspaceService, useValue: workspaceServiceMock }]
    }).compileComponents()

    fixture = TestBed.createComponent(BookmarkLinksComponent)
    component = fixture.componentInstance
  })

  it('should create', () => {
    fixture.detectChanges()

    expect(component).toBeTruthy()
  })

  describe('getUrl', () => {
    it('should return undefined when bookmark has no id', () => {
      const result = component.getUrl({
        id: '',
        displayName: 'Test',
        workspaceName: 'ws',
        productName: 'product',
        appId: 'app',
        scope: BookmarkScope.Private,
        position: 0
      })

      expect(result).toBeUndefined()
    })

    it('should return undefined when bookmark has no productName', () => {
      const result = component.getUrl({
        id: '1',
        displayName: 'Test',
        workspaceName: 'ws',
        productName: undefined,
        appId: 'app',
        scope: BookmarkScope.Private,
        position: 0
      })

      expect(result).toBeUndefined()
    })

    it('should return undefined when bookmark has no appId', () => {
      const result = component.getUrl({
        id: '1',
        displayName: 'Test',
        workspaceName: 'ws',
        productName: 'product',
        appId: undefined,
        scope: BookmarkScope.Private,
        position: 0
      })

      expect(result).toBeUndefined()
    })

    it('should call workspaceService.getUrl and return an observable when bookmark is valid', () => {
      workspaceServiceMock.getUrl.mockReturnValue(of('/some/path'))

      const result = component.getUrl({
        id: '1',
        displayName: 'Test',
        workspaceName: 'ws',
        productName: 'product',
        appId: 'app',
        endpointName: 'ep',
        endpointParameters: { key: 'val' },
        scope: BookmarkScope.Private,
        position: 0
      })

      expect(workspaceServiceMock.getUrl).toHaveBeenCalledWith('product', 'app', 'ep', { key: 'val' })
      expect(result).toBeDefined()
    })

    it('should cache the observable and not call workspaceService.getUrl again for the same bookmark id', () => {
      workspaceServiceMock.getUrl.mockReturnValue(of('/some/path'))
      const bookmark = {
        id: '42',
        displayName: 'Cached',
        workspaceName: 'ws',
        productName: 'product',
        appId: 'app',
        scope: BookmarkScope.Private,
        position: 0
      }

      const first = component.getUrl(bookmark)
      const second = component.getUrl(bookmark)

      expect(workspaceServiceMock.getUrl).toHaveBeenCalledTimes(1)
      expect(first).toBe(second)
    })

    it('should emit the path returned by workspaceService.getUrl', (done) => {
      workspaceServiceMock.getUrl.mockReturnValue(of('/resolved/url'))

      const result = component.getUrl({
        id: '99',
        displayName: 'Test',
        workspaceName: 'ws',
        productName: 'product',
        appId: 'app',
        scope: BookmarkScope.Private,
        position: 0
      })

      result!.subscribe((url) => {
        expect(url).toBe('/resolved/url')
        done()
      })
    })
  })

  describe('template rendering', () => {
    it('should render a link for each bookmark with a resolved URL', async () => {
      workspaceServiceMock.getUrl.mockReturnValue(of('/path/to/app'))
      component.bookmarks = [
        {
          id: '1',
          displayName: 'Bookmark One',
          workspaceName: 'ws',
          productName: 'product',
          appId: 'app',
          scope: BookmarkScope.Private,
          position: 0
        },
        {
          id: '2',
          displayName: 'Bookmark Two',
          workspaceName: 'ws',
          productName: 'product',
          appId: 'app',
          scope: BookmarkScope.Private,
          position: 1
        }
      ]
      fixture.detectChanges()
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, BookmarkLinksHarness)

      expect(await harness.getLinkCount()).toBe(2)
      expect(await harness.getLinkText(0)).toBe('Bookmark One')
      expect(await harness.getLinkText(1)).toBe('Bookmark Two')
      expect(await harness.getLinkText(99)).toBeNull()
    })

    it('should render no links when bookmarks is empty', async () => {
      component.bookmarks = []
      fixture.detectChanges()
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, BookmarkLinksHarness)

      expect(await harness.getLinkCount()).toBe(0)
    })

    it('should render no links when bookmarks is undefined', async () => {
      component.bookmarks = undefined
      fixture.detectChanges()
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, BookmarkLinksHarness)

      expect(await harness.getLinkCount()).toBe(0)
    })
  })
})
