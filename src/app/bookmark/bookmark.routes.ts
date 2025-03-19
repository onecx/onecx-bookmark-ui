import { Routes } from '@angular/router'

import { LabelResolver } from 'src/app/shared/utils/label.resolver'

import { BookmarkOverviewComponent } from './bookmark-overview/bookmark-overview.component'
import { BookmarkConfigureComponent } from './bookmark-configure/bookmark-configure.component'

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: BookmarkOverviewComponent
  },
  {
    path: './configure',
    pathMatch: 'full',
    component: BookmarkConfigureComponent,
    data: {
      breadcrumb: 'BREADCRUMBS.CONFIGURE',
      breadcrumbFn: (data: any) => `${data.labeli18n}`
    },
    resolve: {
      labeli18n: LabelResolver
    }
  }
]
