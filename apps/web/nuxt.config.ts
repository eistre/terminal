import type { Nitro } from 'nitropack';
import { cpSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATABASE_PACKAGE = '@terminal/database';
const MIGRATIONS_DIR = 'migrations';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@vueuse/nuxt',
  ],

  eslint: { config: { standalone: false } },

  image: {
    dir: 'assets/images',
  },

  css: ['~/assets/css/main.css'],

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'et', name: 'Eesti', file: 'et.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'locale',
    },
  },

  nitro: {
    hooks: {
      'build:before': (nitro: Nitro) => {
        const databaseModulePath = import.meta.resolve(DATABASE_PACKAGE);

        const sourceMigrationsDir = resolve(
          fileURLToPath(databaseModulePath),
          `../../${MIGRATIONS_DIR}`,
        );

        const destinationMigrationsDir = resolve(
          nitro.options.output.serverDir,
          `./${MIGRATIONS_DIR}`,
        );

        nitro.logger.info('Copying database migrations to Nitro output');
        cpSync(sourceMigrationsDir, destinationMigrationsDir, { recursive: true });
        nitro.logger.success('Database migrations copied successfully');
      },
    },
  },
});
