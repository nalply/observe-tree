// http://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: { sourceType: 'module', ecmaVersion: 8 },
  env: { browser: true, es6: true, },
  extends: 'eslint:recommended',
  plugins: [ 'html' ],
  rules: {
    yoda: 0,
    curly: 0,
    indent: [ "error", 2 ],
    quotes: [ "error", "single" ],
    semi: [  "error", "never" ],
    'linebreak-style': [ "error", "unix" ],
    'comma-dangle': 0,
    'no-console': 2,
    'space-before-function-paren': 0,
    'no-multiple-empty-lines': 0,
    'no-multi-spaces': 0,
    'key-spacing': 0,
    'operator-linebreak': 0,
    'array-bracket-even-spacing': 0,
    'brace-style': 0,
    'arrow-parens': 0,
    'generator-star-spacing': 0,
    'no-ebugger': process.env.NODE_ENV === 'production' ? 2 : 0,
  }
}

// TODO still doesn't work for .html files...