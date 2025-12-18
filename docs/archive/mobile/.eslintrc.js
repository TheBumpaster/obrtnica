module.exports = {
  root: true,
  extends: ['expo', require.resolve('@serp/config/eslint-preset')],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
};
