module.exports = {
  root: true,
  extends: [require.resolve('@serp/config/eslint-preset')],
  env: {
    browser: true,
    node: true,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  plugins: ['react-hooks'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
