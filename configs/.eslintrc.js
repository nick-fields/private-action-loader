module.exports = {
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
  },
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
  ],
};
