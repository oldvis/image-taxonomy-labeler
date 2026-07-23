import antfu from '@antfu/eslint-config'

export default antfu(
  {
    vue: false,
    typescript: true,
    ignores: ['assets/**/*.json'],
  },
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    rules: {
      'arrow-parens': ['error', 'always'],
      'style/arrow-parens': ['error', 'always'],
      'curly': ['error', 'multi-line'],
      'antfu/if-newline': ['off'],
      'antfu/top-level-function': ['off'],
    },
  },
)
