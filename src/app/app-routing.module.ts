import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'

import { startsWith } from '@onecx/angular-webcomponents'
import { addInitializeModuleGuard } from '@onecx/angular-integration-interface'

export const routes: Routes = [
  {
    matcher: startsWith(''),
    loadChildren: () => import('./bookmark/bookmark.module').then((mod) => mod.BookmarkModule)
  }
]

@NgModule({
  imports: [RouterModule.forRoot(addInitializeModuleGuard(routes)), TranslateModule],
  exports: [RouterModule]
})
export class AppRoutingModule {}
