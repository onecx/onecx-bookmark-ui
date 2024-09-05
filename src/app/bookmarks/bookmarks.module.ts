import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LetModule } from '@ngrx/component';
import { EffectsModule } from '@ngrx/effects';
import { BookmarksCreateUpdateComponent } from './pages/bookmarks-search/dialogs/bookmarks-create-update/bookmarks-create-update.component';
import { providePortalDialogService } from '@onecx/portal-integration-angular';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addInitializeModuleGuard } from '@onecx/angular-integration-interface';
import { PortalCoreModule } from '@onecx/portal-integration-angular';
import { SharedModule } from '../shared/shared.module';
import { bookmarksFeature } from './bookmarks.reducers';
import { routes } from './bookmarks.routes';
import { BookmarksSearchComponent } from './pages/bookmarks-search/bookmarks-search.component';
import { BookmarksSearchEffects } from './pages/bookmarks-search/bookmarks-search.effects';

@NgModule({
  providers: [providePortalDialogService()],
  declarations: [BookmarksCreateUpdateComponent, BookmarksSearchComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    SharedModule,
    LetModule,
    PortalCoreModule.forMicroFrontend(),
    RouterModule.forChild(addInitializeModuleGuard(routes)),
    FormsModule,
    ReactiveFormsModule,
    StoreModule.forFeature(bookmarksFeature),
    EffectsModule.forFeature([BookmarksSearchEffects]),
    TranslateModule,
  ],
})
export class BookmarksModule {}
