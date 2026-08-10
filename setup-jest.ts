// setup-jest.ts
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone'

const globalObj = globalThis as any
const options = globalObj.ngJest?.testEnvironmentOptions || {}

setupZoneTestEnv(options as any)

if (globalObj.ngJest) {
  delete globalObj.ngJest
}

/* eslint-disable @typescript-eslint/no-empty-function */
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/* fixes a bug with jsdom: ignoring this error message in log */
const originalConsoleError = console.error
type Err = { message: string }
console.error = (message, ...optionalParams) => {
  try {
    if (message?.includes('Error: Could not parse CSS stylesheet')) return
  } catch (err) {
    ;(err as Err).message = `Error in console.error`
    return
  }
  originalConsoleError(message, ...optionalParams)
}

Object.defineProperty(HTMLElement.prototype, 'ariaLabel', {
  get() {
    return this.getAttribute('aria-label')
  },
  set(value) {
    this.setAttribute('aria-label', value)
  },
  configurable: true
})

globalThis.matchMedia =
  globalThis.matchMedia ||
  function () {
    return {
      addListener: () => {},
      removeListener: () => {}
    }
  }

// @ts-expect-error https://thymikee.github.io/jest-preset-angular/docs/getting-started/test-environment
globalThis.ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true
  }
}
