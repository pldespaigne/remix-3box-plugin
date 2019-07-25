
// import { Remix3BoxPlugin } from './remix-3box-plugin';
import { SpacePlugin } from './spaces-plugin';

import { connectIframe, listenOnThemeChanged } from '@remixproject/plugin';

const plugin = new SpacePlugin(); // instantiate the plugin
connectIframe(plugin);
listenOnThemeChanged(plugin);