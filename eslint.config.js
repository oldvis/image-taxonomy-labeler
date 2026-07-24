import antfu from '@antfu/eslint-config'

export default antfu(
  {
    vue: true,
    typescript: true,
    ignores: [
      '**/dist/**',
      '**/shims.d.ts',
      '**/auto-imports.d.ts',
      '**/components.d.ts',
      '**/src/**/*.json',
      'packages/shared/assets/**/*.json',
    ],
  },
  {
    rules: {
      'arrow-parens': ['error', 'always'],
      'style/arrow-parens': ['error', 'always'],
      'curly': ['error', 'multi-line'],
      'antfu/if-newline': ['off'],
      'antfu/top-level-function': ['off'],
    },
  },
)
