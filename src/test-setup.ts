import { jest } from '@jest/globals'

// 1. Zuerst den DOM-Prototyp für JSDOM fixen
Object.defineProperty(HTMLElement.prototype, 'ariaLabel', {
  get() {
    return this.getAttribute('aria-label')
  },
  set(value) {
    this.setAttribute('aria-label', value)
  },
  configurable: true
})

// 2. MatchMedia Mock
globalThis.matchMedia =
  globalThis.matchMedia ||
  function () {
    return {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  }

// 3. Strikte Angular-Jest Optionen definieren
// @ts-expect-error https://thymikee.github.io/jest-preset-angular/docs/getting-started/test-environment
globalThis.ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true
  }
}

// 4. Erst jetzt das Preset laden (nutzt die modifizierten Prototypen)
import 'jest-preset-angular/setup-jest'

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
