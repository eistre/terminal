import config from '@terminal/eslint';

export default config.prepend({
  ignores: [
    'apps/**',
    'packages/**',
  ],
});
