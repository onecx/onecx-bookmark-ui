import { expect, jest } from '@jest/globals'
import { Utils } from './utils'

describe('Utils', () => {
  describe('limitText', () => {
    it('should truncate text that exceeds the specified limit', () => {
      const result = Utils.limitText('hello', 4)

      expect(result).toEqual('hell...')
    })

    it('should return the original text if it does not exceed the limit', () => {
      const result = Utils.limitText('hello', 6)

      expect(result).toEqual('hello')
    })

    it('should return an empty string for undefined input', () => {
      const result = Utils.limitText(undefined, 5)

      expect(result).toEqual('')
    })
  })

  describe('copyToClipboard', () => {
    it('should copy to clipboard', () => {
      Object.assign(window.navigator, {
        clipboard: {
          writeText: jest.fn().mockImplementation(() => Promise.resolve())
        }
      })

      Utils.copyToClipboard('text')

      expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith('text')
    })
  })

  describe('getCurrentDateTime', () => {
    beforeAll(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2025-06-30T14:05:09'))
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    it('should return formatted current date and time', () => {
      const result = Utils.getCurrentDateTime()
      expect(result).toBe('2025-06-30_140509')
    })
  })
})
