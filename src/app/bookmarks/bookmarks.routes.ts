import { Routes } from '@angular/router'
import { BookmarksSearchComponent } from './pages/bookmarks-search/bookmarks-search.component'

export const routes: Routes = [{ path: '', component: BookmarksSearchComponent, pathMatch: 'full' }]
