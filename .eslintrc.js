module.exports = {
  ignorePatterns: ['lib/dist/**/*'],
  extends: [
    'standard',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: '2020'
  },
  plugins: ['react', '@typescript-eslint', 'prettier'],
  rules: {
    camelcase: 'off',
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    'prettier/prettier': [
      'error',
      {
        tabWidth: 2,
        printWidth: 120,
        singleQuote: true,
        trailingComma: 'none',
        semi: false,
        overrides: [
          {
            files: '*.json',
            options: {
              parser: 'json'
            }
          },
          {
            files: '*.html',
            options: {
              parser: 'html'
            }
          },
          {
            files: '*.css',
            options: {
              parser: 'css'
            }
          },
          {
            files: '*.md',
            options: {
              parser: 'markdown'
            }
          }
        ]
      }
    ],
    'import/order': 'error',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}
