import { TestBed } from '@angular/core/testing'
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { of } from 'rxjs'
import { LabelResolver } from './label.resolver'

describe('LabelResolver', () => {
  let resolver: LabelResolver
  let translateService: TranslateService

  beforeEach(() => {
    const translateServiceMock = {
      get: jest.fn(),
      instant: jest.fn()
    }

    TestBed.configureTestingModule({
      providers: [LabelResolver, { provide: TranslateService, useValue: translateServiceMock }]
    })

    resolver = TestBed.inject(LabelResolver)
    translateService = TestBed.inject(TranslateService)
  })

  it('should be created', () => {
    expect(resolver).toBeTruthy()
  })

  it('should resolve breadcrumb from route data', (done) => {
    const route = {
      data: { breadcrumb: 'BREADCRUMB.KEY' }
    } as unknown as ActivatedRouteSnapshot

    const state = {} as RouterStateSnapshot

    jest.spyOn(translateService, 'get').mockReturnValue(of('Translated Breadcrumb'))

    const result = resolver.resolve(route, state)

    if (result instanceof Promise || (typeof result === 'object' && result && 'subscribe' in result)) {
      ;(result as any).subscribe((value: string) => {
        expect(value).toBe('Translated Breadcrumb')
        expect(translateService.get).toHaveBeenCalledWith('BREADCRUMB.KEY')
        done()
      })
    }
  })

  it('should return route path if no breadcrumb in route data', () => {
    const route = {
      data: {},
      routeConfig: { path: 'test-path' }
    } as unknown as ActivatedRouteSnapshot

    const state = {} as RouterStateSnapshot

    const result = resolver.resolve(route, state)

    expect(result).toBe('test-path')
    expect(translateService.get).not.toHaveBeenCalled()
  })

  it('should return empty string if no breadcrumb and no route path', () => {
    const route = {
      data: {},
      routeConfig: {}
    } as unknown as ActivatedRouteSnapshot

    const state = {} as RouterStateSnapshot

    const result = resolver.resolve(route, state)

    expect(result).toBe('')
    expect(translateService.get).not.toHaveBeenCalled()
  })

  it('should return empty string if routeConfig is undefined', () => {
    const route = {
      data: {}
    } as unknown as ActivatedRouteSnapshot

    const state = {} as RouterStateSnapshot

    const result = resolver.resolve(route, state)

    expect(result).toBe('')
    expect(translateService.get).not.toHaveBeenCalled()
  })
})
