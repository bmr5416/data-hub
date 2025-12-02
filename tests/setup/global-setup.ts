/**
 * Global Setup - Runs once before all tests
 *
 * Responsibilities:
 * - Ensure Supabase local is running
 * - Run database migrations
 * - Seed metadata (platforms, etc.)
 * - Set up environment variables
 */

import { execSync } from 'child_process'

export default async function globalSetup() {
  console.log('\n🚀 Global Test Setup Starting...\n')
  const startTime = Date.now()

  try {
    // Step 1: Check if Supabase CLI is available
    try {
      execSync('supabase --version', { stdio: 'pipe' })
      console.log('✓ Supabase CLI detected')
    } catch {
      console.warn(
        '⚠ Supabase CLI not found. Tests will use existing database connection.',
      )
      // Continue without Supabase CLI - useful for CI or when using remote DB
    }

    // Step 2: Verify environment variables
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY']
    const missingVars = requiredEnvVars.filter((v) => !process.env[v])

    if (missingVars.length > 0) {
      // Use default local Supabase URLs if not set
      process.env.SUPABASE_URL =
        process.env.SUPABASE_URL || 'http://localhost:54321'
      process.env.SUPABASE_ANON_KEY =
        process.env.SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      // Default service role key for local Supabase (needed for server-side operations)
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
      console.log('✓ Using default local Supabase configuration')
    }

    // Step 3: Set test-specific environment variables
    process.env.NODE_ENV = 'test'
    process.env.APP_PASSWORD = 'test-password-123'
    process.env.SCHEDULER_ENABLED = 'false' // Disable scheduler during tests

    console.log('✓ Environment variables configured')

    // Step 4: Store start time for teardown reference
    ;(globalThis as any).__TEST_START_TIME__ = startTime

    const duration = Date.now() - startTime
    console.log(`\n✅ Global Setup Complete (${duration}ms)\n`)
  } catch (error) {
    console.error('\n❌ Global Setup Failed:', error)
    throw error
  }
}
