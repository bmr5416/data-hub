/**
 * Supabase Test Helpers
 *
 * Utilities for testing with Supabase:
 * - Create test clients
 * - Generate unique test data
 * - Database cleanup utilities
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

// Supabase configuration from environment
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Create a Supabase client for testing with anonymous key
 */
export function createTestClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/**
 * Create a Supabase client with service role (admin) privileges
 * Use for setup/teardown operations
 */
export function createAdminClient(): SupabaseClient | null {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not set - admin client unavailable')
    return null
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Sequence counter for guaranteed uniqueness within same millisecond
let suiteCounter = 0

/**
 * Generate a unique test suite identifier
 * Uses crypto UUID for collision prevention in parallel test runs
 */
export function generateTestSuiteId(): string {
  const timestamp = Date.now().toString(36)
  const uuid = randomUUID().replace(/-/g, '').substring(0, 8)
  const sequence = (++suiteCounter).toString(36).padStart(3, '0')
  return `test-${timestamp}-${uuid}-${sequence}`
}

/**
 * Generate a unique test email address
 */
export function generateTestEmail(prefix = 'user'): string {
  const unique = getShortUnique()
  return `${prefix}-${unique}@test.local`
}

/**
 * Generate a unique test name
 */
export function generateTestName(prefix = 'Test'): string {
  const unique = getShortUnique()
  return `${prefix} ${unique}`
}

/**
 * Wait for a database operation to complete
 * Useful for eventual consistency scenarios
 */
export async function waitForDb(ms = 100): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Clean up test data by prefix
 * Safe to run - only deletes records matching the test prefix
 */
export async function cleanupTestData(
  client: SupabaseClient,
  table: string,
  column: string,
  prefix: string,
): Promise<void> {
  try {
    await client.from(table).delete().like(column, `${prefix}%`)
  } catch (error) {
    console.warn(`Failed to cleanup ${table}:`, error)
  }
}

/**
 * Test data isolation wrapper
 * Creates a unique context for each test to prevent collisions
 */
export class TestContext {
  public readonly suiteId: string
  public readonly client: SupabaseClient
  private createdRecords: Array<{ table: string; id: string }> = []

  constructor() {
    this.suiteId = generateTestSuiteId()
    this.client = createTestClient()
  }

  /**
   * Track a created record for cleanup
   */
  track(table: string, id: string): void {
    this.createdRecords.push({ table, id })
  }

  /**
   * Generate a unique name with suite prefix
   */
  uniqueName(base: string): string {
    return `${base} [${this.suiteId}]`
  }

  /**
   * Generate a unique email with suite prefix
   */
  uniqueEmail(prefix = 'test'): string {
    const unique = getShortUnique()
    return `${prefix}-${unique}@test.local`
  }

  /**
   * Clean up all tracked records
   * Logs failures locally, throws in CI to catch cleanup issues
   */
  async cleanup(): Promise<void> {
    const failures: Array<{ table: string; id: string; error: string }> = []

    for (const record of this.createdRecords.reverse()) {
      try {
        const { error } = await this.client
          .from(record.table)
          .delete()
          .eq('id', record.id)

        if (error) {
          // PGRST116 = not found (already deleted via cascade) - not a failure
          if (error.code !== 'PGRST116') {
            failures.push({ ...record, error: error.message })
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        failures.push({ ...record, error: message })
      }
    }

    this.createdRecords = []

    if (failures.length > 0) {
      console.error('⚠️ Cleanup failures:', JSON.stringify(failures, null, 2))
      if (process.env.CI) {
        throw new Error(`Test cleanup failed: ${failures.length} records not deleted`)
      }
    }
  }

  /**
   * Verify all tracked records were actually deleted
   * Call after cleanup() to ensure database state is clean
   */
  async verifyCleanup(): Promise<void> {
    const stillExists: Array<{ table: string; id: string }> = []

    for (const record of this.createdRecords) {
      const { data } = await this.client
        .from(record.table)
        .select('id')
        .eq('id', record.id)
        .maybeSingle()

      if (data) {
        stillExists.push(record)
      }
    }

    if (stillExists.length > 0) {
      throw new Error(
        `Records still exist after cleanup: ${stillExists.map((r) => `${r.table}:${r.id}`).join(', ')}`,
      )
    }
  }
}

// Export helper function for global use
declare global {
  function getShortUnique(): string
}

export { SUPABASE_URL, SUPABASE_ANON_KEY }
