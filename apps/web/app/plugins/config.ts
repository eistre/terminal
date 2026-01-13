import type { PublicConfig } from '#shared/public-config';

export default defineNuxtPlugin({
  name: 'config',
  enforce: 'pre',
  setup() {
    if (import.meta.server) {
      const event = useRequestEvent();
      const config = event?.context.config;

      if (!config) {
        throw new Error('Config not found in request context');
      }

      useState<PublicConfig>('config', () => config as PublicConfig);
    }
  },
});
