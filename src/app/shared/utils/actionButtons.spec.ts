import { PrimeIcons } from 'primeng/api'

import {
  cancelButton,
  closeButton,
  exportButton,
  importButton,
  noButton,
  saveButton,
  yesButton
} from './actionButtons'

describe('actionButtons', () => {
  it('should define yesButton with correct properties', () => {
    expect(yesButton).toEqual({
      key: 'ACTIONS.CONFIRMATION.YES',
      tooltipKey: 'ACTIONS.CONFIRMATION.YES.TOOLTIP',
      tooltipPosition: 'top',
      icon: PrimeIcons.CHECK
    })
  })

  it('should define noButton with correct properties', () => {
    expect(noButton).toEqual({
      key: 'ACTIONS.CONFIRMATION.NO',
      tooltipKey: 'ACTIONS.CONFIRMATION.NO.TOOLTIP',
      tooltipPosition: 'top',
      icon: PrimeIcons.TIMES
    })
  })

  it('should define closeButton with correct properties', () => {
    expect(closeButton).toEqual({
      key: 'ACTIONS.NAVIGATION.CLOSE',
      tooltipKey: 'ACTIONS.NAVIGATION.CLOSE.TOOLTIP',
      tooltipPosition: 'top',
      icon: PrimeIcons.TIMES
    })
  })

  it('should define cancelButton with correct properties', () => {
    expect(cancelButton).toEqual({
      key: 'ACTIONS.CANCEL',
      tooltipKey: 'ACTIONS.TOOLTIPS.CANCEL',
      tooltipPosition: 'top',
      icon: PrimeIcons.TIMES
    })
  })

  it('should define saveButton with correct properties', () => {
    expect(saveButton).toEqual({
      key: 'ACTIONS.SAVE',
      tooltipKey: 'ACTIONS.TOOLTIPS.SAVE',
      tooltipPosition: 'top',
      icon: PrimeIcons.SAVE
    })
  })

  it('should define exportButton with correct properties', () => {
    expect(exportButton).toEqual({
      key: 'ACTIONS.EXPORT.LABEL',
      tooltipKey: 'ACTIONS.EXPORT.TOOLTIP',
      tooltipPosition: 'top',
      icon: PrimeIcons.DOWNLOAD
    })
  })

  it('should define importButton with correct properties', () => {
    expect(importButton).toEqual({
      key: 'ACTIONS.IMPORT.LABEL',
      tooltipKey: 'ACTIONS.IMPORT.TOOLTIP',
      tooltipPosition: 'top',
      icon: PrimeIcons.UPLOAD
    })
  })
})
