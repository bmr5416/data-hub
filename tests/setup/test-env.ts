/**
 * Test Environment Configuration
 *
 * Centralized configuration for test environments
 */

export const TEST_CONFIG = {
  // API endpoints
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
    timeout: 10000,
  },

  // Client (frontend) URLs
  client: {
    baseUrl: process.env.CLIENT_BASE_URL || 'http://localhost:5173',
  },

  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL || 'http://localhost:54321',
    anonKey:
      process.env.SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // Test credentials (must match scripts/setup-test-user.js)
  auth: {
    testEmail: 'test@test.com',
    testPassword: 'testtest',
  },

  // Timing configuration
  timing: {
    // Max time to wait for async operations
    asyncTimeout: 5000,
    // Minimum loading time simulation
    minLoadingTime: 100,
    // Database operation delay
    dbDelay: 50,
  },

  // Feature flags for tests
  features: {
    // Skip slow tests in watch mode
    skipSlowTests: process.env.VITEST_WATCH === 'true',
    // Enable verbose logging
    verboseLogging: process.env.TEST_VERBOSE === 'true',
    // Run integration tests against real API
    useRealApi: process.env.TEST_REAL_API === 'true',
  },
} as const

/**
 * Get the full API URL for a given path
 */
export function apiUrl(path: string): string {
  const base = TEST_CONFIG.api.baseUrl
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${cleanPath}`
}

/**
 * Get the full client URL for a given path
 */
export function clientUrl(path: string): string {
  const base = TEST_CONFIG.client.baseUrl
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${cleanPath}`
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return (
    process.env.CI === 'true' ||
    process.env.GITHUB_ACTIONS === 'true' ||
    process.env.GITLAB_CI === 'true'
  )
}

/**
 * Check if running in watch mode
 */
export function isWatchMode(): boolean {
  return process.env.VITEST_WATCH === 'true'
}

export default TEST_CONFIG
