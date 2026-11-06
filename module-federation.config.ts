import { ModuleFederationConfig } from '@nx/module-federation'
import { getOneCXSharedRecommendations } from '@onecx/accelerator'

const config: ModuleFederationConfig = {
  name: 'onecx-bookmark-ui',
  exposes: {
    './OneCXBookmarkModule': 'src/main.ts',
    './OneCXManageBookmarkComponent': 'src/app/remotes/manage-bookmark/manage-bookmark.component.main.ts',
    './OneCXBookmarkListComponent': 'src/app/remotes/bookmark-list/bookmark-list.component.main.ts'
  },
  shared: (libraryName, sharedConfig) => {
    const config = getOneCXSharedRecommendations(libraryName, sharedConfig)
    return config
  }
}

export default config
