// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default defineConfig(
  globalIgnores(['dist/', '.astro/', 'node_modules/', 'playwright-report/', 'test-results/']),
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  {
    // TypeScript already reports undefined names; this rule misreads browser and Node globals.
    files: ['**/*.ts', '**/*.astro'],
    rules: { 'no-undef': 'off' },
  },
);
