import { Injectable } from '@angular/core'

export type BookmarkDialogType = 'manage'

@Injectable({ providedIn: 'root' })
export class BookmarkDialogCoordinatorService {
  private currentDialog: BookmarkDialogType | null = null
  private readonly closeHandlers = new Map<BookmarkDialogType, () => void>()

  public register(dialog: BookmarkDialogType, closeHandler: () => void): void {
    this.closeHandlers.set(dialog, closeHandler)
  }

  public open(dialog: BookmarkDialogType): void {
    this.currentDialog = dialog
  }

  public close(dialog: BookmarkDialogType): void {
    if (this.currentDialog === dialog) {
      this.closeHandlers.get(dialog)?.()
      this.currentDialog = null
    }
  }

  public isOpen(dialog: BookmarkDialogType): boolean {
    return this.currentDialog === dialog
  }
}
