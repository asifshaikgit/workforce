module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ['eslint:recommended',
    'plugin:node/recommended',
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    // Best Practices
    'no-console': 'off', // Allowing console.log statements
    'no-unused-vars': 'warn', // Warning for unused variables
    'no-alert': 'error', // Disallowing the use of alert, which is generally not recommended in modern web development
    // Code style
    indent: ['error', 2], // Enforcing 2 spaces indentation
    quotes: ['error', 'single'], // Enforcing single quotes for strings
    semi: ['error', 'always'], // Enforcing semicolons at the end of statements
    'comma-dangle': ['error', 'always-multiline'], // Enforcing trailing commas in multiline object and array literals
    'object-curly-spacing': ['error', 'always'], // Enforcing spaces inside object literals
    'array-bracket-spacing': ['error', 'never'], // Disallowing spaces inside array brackets
    'arrow-parens': ['error', 'always'], // Enforcing parentheses around arrow function parameters even for single parameter
    // Error handling and safety
    'no-throw-literal': 'error', // Disallowing throwing non-error literals
    'no-var': 'error', // Recommending using 'const' or 'let' instead of 'var'
    // Node.js specific
    'node/no-unpublished-require': 'off', // Allowing require statements for local modules
    // Security (optional, install eslint-plugin-security)
    // 'security/detect-non-literal-fs-filename': 'warn', // Warning for non-literal file path
    'security/detect-object-injection': 'warn', // Warning for possible object injection attacks
    // Additional rules as per your project requirements
  }

};