import { FlatCompat } from '@eslint/eslintrc'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import js from '@eslint/js'
import nxEslintPlugin from '@nx/eslint-plugin'

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended
})

export default [
  {
    ignores: ['**/dist']
  },
  {
    plugins: {
      '@nx': nxEslintPlugin
    }
  },
  ...compat.config({}).map((config) => ({
    ...config,
    files: ['**/*.ts'],
    rules: {
      ...config.rules
    },
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.*?.json']
      }
    }
  })),
  ...compat
    .config({
      extends: ['plugin:@nx/typescript']
    })
    .map((config) => ({
      ...config,
      files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
      rules: {
        ...config.rules
      }
    })),
  ...compat
    .config({
      extends: ['plugin:@nx/javascript']
    })
    .map((config) => ({
      ...config,
      files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
      rules: {
        ...config.rules
      }
    })),
  ...compat
    .config({
      extends: ['plugin:@nx/angular', 'plugin:@angular-eslint/template/process-inline-templates']
    })
    .map((config) => ({
      ...config,
      files: ['**/*.ts'],
      rules: {
        ...config.rules,
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            vars: 'all',
            args: 'none'
          }
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@angular-eslint/directive-selector': [
          'error',
          {
            type: 'attribute',
            prefix: 'app',
            style: 'camelCase'
          }
        ],
        '@angular-eslint/component-selector': [
          'error',
          {
            type: 'element',
            prefix: 'app',
            style: 'kebab-case'
          }
        ]
      }
    })),
  ...compat
    .config({
      extends: ['plugin:@nx/angular-template']
    })
    .map((config) => ({
      ...config,
      files: ['**/*.html'],
      rules: {
        ...config.rules
      }
    })),
  {
    ignores: [
      '.nx/**',
      '.angular/**',
      '.husky/**',
      '.github/**',
      'dist/**',
      'helm/**',
      'node_modules/**',
      'reports/**',
      'src/app/shared/generated/**',
      'src/assets/api/**',
      'src/**/*.ico',
      'src/**/*.svg'
    ]
  }
]
