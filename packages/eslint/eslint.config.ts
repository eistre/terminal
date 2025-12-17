import antfu from '@antfu/eslint-config';
import turboPlugin from 'eslint-plugin-turbo';

export default antfu({
  typescript: true,
  stylistic: {
    semi: true,
  },
  plugins: {
    turbo: turboPlugin,
  },
  rules: {
    ...turboPlugin.configs.recommended.rules,
    'pnpm/yaml-enforce-settings': 'off',
  },
});
