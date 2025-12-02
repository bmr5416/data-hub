import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Enable global test APIs (describe, it, expect)
    globals: true,

    // Default environment for non-component tests
    environment: 'node',

    // Setup files run before each test file
    setupFiles: ['./tests/setup/setup.ts'],

    // Global setup/teardown (run once for entire suite)
    globalSetup: './tests/setup/global-setup.ts',
    globalTeardown: './tests/setup/global-teardown.ts',

    // Test file patterns
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}',
      'tests/component/**/*.test.{ts,tsx}',
      'tests/contracts/**/*.test.{ts,tsx}',
    ],

    // Exclude E2E tests (run separately with Playwright)
    exclude: ['tests/e2e/**', 'node_modules/**'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/index.js',
      ],
      // Coverage thresholds
      thresholds: {
        statements: 60,
        branches: 60,
        functions: 60,
        lines: 60,
      },
    },

    // Timeout settings
    testTimeout: 10000,
    hookTimeout: 30000,

    // Run tests in parallel
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },

    // Reporter configuration
    reporters: ['default'],

    // Watch mode settings
    watch: true,
    watchExclude: ['node_modules/**', 'coverage/**'],

    // Dependency optimization
    deps: {
      optimizer: {
        web: {
          include: ['@testing-library/react'],
        },
      },
    },
  },

  resolve: {
    alias: {
      '@client': path.resolve(__dirname, './client/src'),
      '@server': path.resolve(__dirname, './server'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
})
