import { Routes } from '@angular/router'

import { BookmarkSearchComponent } from './pages/bookmark-search/bookmark-search.component'

export const routes: Routes = [{ path: '', component: BookmarkSearchComponent, pathMatch: 'full' }]
