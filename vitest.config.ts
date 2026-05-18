/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'
import { availableParallelism } from 'node:os'
import { resolve } from 'node:path'

/**
 * Vitest-only config. Intentionally does NOT load tanstackStart or
 * tailwindcss plugins — tests run in jsdom and only need React + path
 * aliases. See .cursor/rules/50-testing.mdc for the test conventions.
 */
export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '#': resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    /** Heavy UI suites + shared runners can exceed Vitest's default 5s budget. */
    testTimeout: 15_000,
    /** Very high core counts + jsdom + userEvent can starve and time out on Windows. */
    maxWorkers: Math.min(4, Math.max(1, availableParallelism())),
    globals: false,
    css: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      'src/routeTree.gen.ts',
    ],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/routeTree.gen.ts',
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/**/*.d.ts',
        'src/**/__tests__/**',
      ],
    },
  },
})
