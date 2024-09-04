import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import {
  DialogButtonClicked,
  DialogPrimaryButtonDisabled,
  DialogResult,
} from '@onecx/portal-integration-angular';

import { FormControl, FormGroup, Validators } from '@angular/forms';
import { map } from 'rxjs';
import {
  Bookmark
} from 'src/app/shared/generated';

import { BookmarksCreateUpdateViewModel } from './bookmarks-create-update.viewmodel';

@Component({
  selector: 'app-bookmarks-create-update',
  templateUrl: './bookmarks-create-update.component.html',
  styleUrls: ['./bookmarks-create-update.component.scss'],
})
export class BookmarksCreateUpdateComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<Bookmark | undefined>,
    DialogButtonClicked<BookmarksCreateUpdateComponent>,
    OnInit
{
  @Input() public vm: BookmarksCreateUpdateViewModel = {
    itemToEdit: undefined,
  };

  public formGroup: FormGroup;

  primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter();
  dialogResult: Bookmark | undefined = undefined;

  constructor() {
    this.formGroup = new FormGroup({
      displayName: new FormControl(null, [Validators.maxLength(255)]),
    });
    this.formGroup.statusChanges
      .pipe(
        map((status) => {
          return status === 'VALID';
        })
      )
      .subscribe(this.primaryButtonEnabled);
  }

  ocxDialogButtonClicked() {
    this.dialogResult = {
      ...this.vm.itemToEdit,
      ...this.formGroup.value,
    };
  }

  ngOnInit() {
    if (this.vm.itemToEdit) {
      this.formGroup.patchValue({
        ...this.vm.itemToEdit,
      });
    }
  }
}
