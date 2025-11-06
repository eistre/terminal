import sharedConfig from '@terminal/eslint';

export default sharedConfig
  .prepend({
    ignores: [
      'apps/**',
      'packages/**',
    ],
  });
