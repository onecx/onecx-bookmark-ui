import { PrimeIcons } from 'primeng/api'
import { ButtonDialogButtonDetails } from '@onecx/portal-integration-angular'

export const yesButton: ButtonDialogButtonDetails = {
  key: 'ACTIONS.CONFIRMATION.YES',
  tooltipKey: 'ACTIONS.CONFIRMATION.YES.TOOLTIP',
  tooltipPosition: 'top',
  icon: PrimeIcons.CHECK
}

export const noButton: ButtonDialogButtonDetails = {
  key: 'ACTIONS.CONFIRMATION.NO',
  tooltipKey: 'ACTIONS.CONFIRMATION.NO.TOOLTIP',
  tooltipPosition: 'top',
  icon: PrimeIcons.TIMES
}

export const closeButton: ButtonDialogButtonDetails = {
  key: 'ACTIONS.NAVIGATION.CLOSE',
  tooltipKey: 'ACTIONS.NAVIGATION.CLOSE.TOOLTIP',
  tooltipPosition: 'top',
  icon: PrimeIcons.TIMES
}

export const cancelButton: ButtonDialogButtonDetails = {
  key: 'ACTIONS.CANCEL',
  tooltipKey: 'ACTIONS.TOOLTIPS.CANCEL',
  tooltipPosition: 'top',
  icon: PrimeIcons.TIMES
}

export const saveButton: ButtonDialogButtonDetails = {
  key: 'ACTIONS.SAVE',
  tooltipKey: 'ACTIONS.TOOLTIPS.SAVE',
  tooltipPosition: 'top',
  icon: PrimeIcons.SAVE
}

export const exportButton: ButtonDialogButtonDetails = {
  key: 'ACTIONS.EXPORT.LABEL',
  tooltipKey: 'ACTIONS.EXPORT.TOOLTIP',
  tooltipPosition: 'top',
  icon: PrimeIcons.DOWNLOAD
}
