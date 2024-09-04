import { bootstrapModule } from '@onecx/angular-webcomponents';
import { environment } from 'src/environments/environment';
import { OnecxBookmarkUiModule } from './app/onecx-bookmark-ui-app.remote.module';

bootstrapModule(OnecxBookmarkUiModule, 'microfrontend', environment.production);
