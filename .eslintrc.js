/** @ts-check @type import('./types').TsEslintConfig */
module.exports = {
  extends: [
    'eslint-config-standard',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  rules: {
    //
    // Disable rules provided by other configs
    //

    'no-unused-vars': 0, // Provided by TypeScript
    'no-undef': 0, // Provided by TypeScript
    'no-void': 0,

    //
    // Disable opinionated rules from @typescript-eslint
    //

    '@typescript-eslint/member-delimiter-style': 0, // Provided by Prettier
    '@typescript-eslint/interface-name-prefix': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/no-use-before-define': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/no-unused-vars': 0 // Use TS compiler option instead
  }
}
