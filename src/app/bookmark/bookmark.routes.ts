import { Routes } from '@angular/router'

import { BookmarkSearchComponent } from './bookmark-search/bookmark-search.component'

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: BookmarkSearchComponent
  }
]
