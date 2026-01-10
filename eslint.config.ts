import config from '@terminal/eslint';

export default config.prepend({
  ignores: [
    'apps/**',
    'packages/**',
    'deploy/kubernetes/templates/**',
  ],
}) as typeof config;
