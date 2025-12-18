module.exports = {
  root: true,
  extends: ['next/core-web-vitals', require.resolve('@serp/config/eslint-preset')],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
};
