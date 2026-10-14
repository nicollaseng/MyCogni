import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import { noComments } from './tooling/eslint/no-comments.ts'

export default defineConfig(
  globalIgnores([
    '**/dist',
    '**/build',
    '**/out',
    '**/.next',
    '**/.turbo',
    '**/coverage',
    '**/next-env.d.ts',
  ]),
  {
    linterOptions: {
      noInlineConfig: true,
    },
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      mycogni: { rules: { 'no-comments': noComments } },
    },
    rules: {
      'mycogni/no-comments': 'error',
      'max-lines': ['error', { max: 650, skipBlankLines: false, skipComments: false }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
)
