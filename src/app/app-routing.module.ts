import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { startsWith } from '@onecx/angular-webcomponents';
import { addInitializeModuleGuard } from '@onecx/angular-integration-interface';

export const routes: Routes = [
  {
    matcher: startsWith(''),
    loadChildren: () =>
      import('./bookmarks/bookmarks.module').then((mod) => mod.BookmarksModule),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(addInitializeModuleGuard(routes)),
    TranslateModule,
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
