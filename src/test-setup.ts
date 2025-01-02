// @ts-expect-error https://thymikee.github.io/jest-preset-angular/docs/getting-started/test-environment
globalThis.ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true
  }
}
import 'jest-preset-angular/setup-jest'

/* fixes a bug with jsdom: ignoring this error message in log */
const originalConsoleError = console.error
console.error = (message, ...optionalParams) => {
  try {
    if (message && message.indexOf('Error: Could not parse CSS stylesheet') > -1) return
  } catch (err) {
    return
  }
  originalConsoleError(message, ...optionalParams)
}
