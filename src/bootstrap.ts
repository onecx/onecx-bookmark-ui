import { bootstrapModule } from '@onecx/angular-webcomponents';
import { environment } from 'src/environments/environment';
import { OneCXBookmarkModule } from './app/onecx-bookmark-ui-app.remote.module';

bootstrapModule(OneCXBookmarkModule, 'microfrontend', environment.production);
