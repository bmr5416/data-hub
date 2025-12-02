/**
 * Global Teardown - Runs once after all tests
 *
 * Responsibilities:
 * - Clean up test data in CI environment
 * - Keep DB alive locally for fast re-runs
 * - Report test duration
 */

import isCI from 'is-ci'
import { createAdminClient } from './supabase-helpers'

// Tables in dependency order (children first for cascade safety)
const TEST_TABLES = [
  'report_alert_history',
  'report_alerts',
  'report_delivery_history',
  'scheduled_jobs',
  'blended_data',
  'platform_data',
  'platform_uploads',
  'data_lineage',
  'reports',
  'kpis',
  'etl_processes',
  'data_warehouses',
  'data_sources',
  'clients',
] as const

export default async function globalTeardown() {
  console.log('\n🧹 Global Test Teardown Starting...\n')

  try {
    // Calculate total test duration
    const startTime = (globalThis as any).__TEST_START_TIME__ || Date.now()
    const totalDuration = Date.now() - startTime

    // Only perform cleanup in CI environment
    if (isCI) {
      console.log('🔄 CI Environment detected - performing cleanup...')

      const client = createAdminClient()
      if (!client) {
        console.warn('⚠️ No admin client available - skipping CI cleanup')
      } else {
        let cleanedCount = 0
        let errorCount = 0

        for (const table of TEST_TABLES) {
          try {
            // Delete records with test- prefix in ID or name containing [test-
            const { error, count } = await client
              .from(table)
              .delete({ count: 'exact' })
              .or('id.like.test-%,name.like.%[test-%')

            if (error) {
              // Some tables may not have 'name' column - try just ID
              const { error: retryError, count: retryCount } = await client
                .from(table)
                .delete({ count: 'exact' })
                .like('id', 'test-%')

              if (retryError) {
                console.warn(`  ⚠️ ${table}: ${retryError.message}`)
                errorCount++
              } else if (retryCount && retryCount > 0) {
                console.log(`  ✓ ${table}: ${retryCount} records deleted`)
                cleanedCount += retryCount
              }
            } else if (count && count > 0) {
              console.log(`  ✓ ${table}: ${count} records deleted`)
              cleanedCount += count
            }
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            console.warn(`  ⚠️ ${table}: ${message}`)
            errorCount++
          }
        }

        console.log(`\n✓ CI cleanup complete: ${cleanedCount} records deleted`)
        if (errorCount > 0) {
          console.warn(`  (${errorCount} tables had errors)`)
        }
      }
    } else {
      console.log(
        '💡 Local environment - keeping database alive for fast re-runs',
      )
      console.log(
        '   Tip: Run "supabase db reset" manually if you need a clean slate',
      )
    }

    console.log(`\n✅ Global Teardown Complete`)
    console.log(`📊 Total test suite duration: ${(totalDuration / 1000).toFixed(2)}s\n`)
  } catch (error) {
    console.error('\n❌ Global Teardown Failed:', error)
    // Don't throw - we don't want teardown failures to mask test failures
  }
}
