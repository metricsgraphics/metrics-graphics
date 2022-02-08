module.exports = {
  tabWidth: 2,
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'none',
  semi: false,
  overrides: [
    {
      files: '*.json',
      options: {
        parser: 'json',
      },
    },
    {
      files: '*.html',
      options: {
        parser: 'html',
      },
    },
    {
      files: '*.css',
      options: {
        parser: 'css',
      },
    },
    {
      files: '*.md',
      options: {
        parser: 'markdown',
      },
    },
  ],
}
