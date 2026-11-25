import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-properties': [
        'error',
        {
          object: 'navigator',
          property: 'onLine',
          message: 'Read navigator.onLine only in src/connectivity/.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.object.name='window'][callee.property.name='addEventListener']",
          message: 'Register global connectivity listeners only in src/connectivity/.',
        },
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.object.name='window'][callee.property.name='removeEventListener']",
          message: 'Remove global connectivity listeners only in src/connectivity/.',
        },
      ],
    },
  },
  {
    files: ['src/connectivity/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'Connectivity modules must stay framework-independent.' },
            { name: 'react-dom', message: 'Connectivity modules must stay framework-independent.' },
          ],
        },
      ],
    },
  },
  {
    files: ['vite.config.ts', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
