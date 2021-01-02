module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
  },
  extends: [
    'eslint:recommended',
    'prettier',
  ],
  plugins: ['prettier'],
  env: {
    node: true,
    es6: true,
  },
  rules: {
    'prettier/prettier': 'error',
    'arrow-body-style': 'error',
    'prefer-arrow-callback': 'error',
    'no-inner-declarations': 'off',
    'consistent-return': 'off',
    'no-floating-decimal': 'error',
    'no-self-compare': 'error',
    'no-throw-literal': 'error',
    'no-void': 'error',
    'strict': ['error', 'global'],
    'no-use-before-define': ['error', 'nofunc'],
    'no-empty': 'error',
    'curly': ['error', 'multi-line'],
    'no-var': 'error',
  },
};
