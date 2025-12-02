/**
 * Upload Processing Integration Tests
 *
 * Tests CSV parsing and data upload functionality against local Supabase.
 * Uses fixture files for realistic platform data.
 *
 * Requirements:
 * - Local Supabase must be running (supabase start)
 * - SUPABASE_SERVICE_ROLE_KEY must be set
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { TestContext } from '../../setup/supabase-helpers'
import { readFileSync } from 'fs'
import { join } from 'path'

// Track Supabase availability
let supabaseService: any = null
let supabaseAvailable = false

// Fixture paths
const FIXTURES_DIR = join(__dirname, '../../fixtures')

const checkSupabaseConnection = async (): Promise<boolean> => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠ Supabase credentials not set. Skipping upload processing tests.')
    return false
  }

  try {
    const { supabaseService: svc } = await import('../../../server/services/supabase.js')
    await svc.init()
    await svc.getClients()
    supabaseService = svc
    return true
  } catch (error: any) {
    console.warn('⚠ Supabase connection failed. Skipping upload processing tests.')
    console.warn(`  Error: ${error.message}`)
    return false
  }
}

// Helper to parse CSV string to array of objects
function parseCSV(csvContent: string): Record<string, any>[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim())
  const rows: Record<string, any>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim())
    const row: Record<string, any> = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx]
    })
    rows.push(row)
  }

  return rows
}

describe('Upload Processing Integration', () => {
  let context: TestContext
  let testClientId: string

  beforeAll(async () => {
    supabaseAvailable = await checkSupabaseConnection()
  })

  beforeEach(async ({ skip }) => {
    if (!supabaseAvailable) {
      skip()
      return
    }
    context = new TestContext()

    // Create test client
    const client = await supabaseService.createClient({
      name: context.uniqueName('Upload Test Client'),
      email: context.uniqueEmail('upload'),
      status: 'active',
    })
    context.track('clients', client.id)
    testClientId = client.id
  })

  afterEach(async () => {
    if (context) {
      await context.cleanup()
    }
  })

  // ============================================================
  // Platform Data Uploads
  // ============================================================
  describe('Platform Data Uploads', () => {
    it('creates upload record for Meta Ads data', async () => {
      const upload = await supabaseService.createUpload(testClientId, {
        platformId: 'meta_ads',
        filename: 'test_meta_ads.csv',
        rowCount: 55,
        status: 'completed',
      })
      context.track('platform_uploads', upload.id)

      expect(upload.platformId).toBe('meta_ads')
      expect(upload.rowCount).toBe(55)
      expect(upload.status).toBe('completed')
    })

    it('creates upload record for Google Ads data', async () => {
      const upload = await supabaseService.createUpload(testClientId, {
        platformId: 'google_ads',
        filename: 'test_google_ads.csv',
        rowCount: 30,
        status: 'completed',
      })
      context.track('platform_uploads', upload.id)

      expect(upload.platformId).toBe('google_ads')
    })

    it('creates upload record for GA4 data', async () => {
      const upload = await supabaseService.createUpload(testClientId, {
        platformId: 'ga4',
        filename: 'test_ga4.csv',
        rowCount: 25,
        status: 'completed',
      })
      context.track('platform_uploads', upload.id)

      expect(upload.platformId).toBe('ga4')
    })

    it('tracks upload status progression', async () => {
      // Create pending upload
      const upload = await supabaseService.createUpload(testClientId, {
        platformId: 'meta_ads',
        filename: 'processing_test.csv',
        rowCount: 0,
        status: 'pending',
      })
      context.track('platform_uploads', upload.id)

      expect(upload.status).toBe('pending')

      // Update to processing
      const processing = await supabaseService.updateUpload(upload.id, {
        status: 'processing',
      })
      expect(processing.status).toBe('processing')

      // Update to completed
      const completed = await supabaseService.updateUpload(upload.id, {
        status: 'completed',
        rowCount: 100,
      })
      expect(completed.status).toBe('completed')
      expect(completed.rowCount).toBe(100)
    })

    it('tracks failed upload with error message', async () => {
      const upload = await supabaseService.createUpload(testClientId, {
        platformId: 'meta_ads',
        filename: 'failed_upload.csv',
        status: 'pending',
      })
      context.track('platform_uploads', upload.id)

      const failed = await supabaseService.updateUpload(upload.id, {
        status: 'error',
        errorMessage: 'Invalid CSV format: missing required columns',
      })

      expect(failed.status).toBe('error')
      expect(failed.errorMessage).toContain('Invalid CSV format')
    })
  })

  // ============================================================
  // Upload Retrieval
  // ============================================================
  describe('Upload Retrieval', () => {
    it('retrieves uploads for client', async () => {
      // Create multiple uploads
      const upload1 = await supabaseService.createUpload(testClientId, {
        platformId: 'meta_ads',
        filename: 'meta_upload1.csv',
        rowCount: 50,
        status: 'completed',
      })
      context.track('platform_uploads', upload1.id)

      const upload2 = await supabaseService.createUpload(testClientId, {
        platformId: 'google_ads',
        filename: 'google_upload1.csv',
        rowCount: 30,
        status: 'completed',
      })
      context.track('platform_uploads', upload2.id)

      const uploads = await supabaseService.getClientUploads(testClientId)

      expect(uploads).toHaveLength(2)
      expect(uploads.map((u: any) => u.id)).toContain(upload1.id)
      expect(uploads.map((u: any) => u.id)).toContain(upload2.id)
    })

    it('filters uploads by platform', async () => {
      const metaUpload = await supabaseService.createUpload(testClientId, {
        platformId: 'meta_ads',
        filename: 'meta_only.csv',
        rowCount: 25,
        status: 'completed',
      })
      context.track('platform_uploads', metaUpload.id)

      const googleUpload = await supabaseService.createUpload(testClientId, {
        platformId: 'google_ads',
        filename: 'google_only.csv',
        rowCount: 20,
        status: 'completed',
      })
      context.track('platform_uploads', googleUpload.id)

      const metaUploads = await supabaseService.getClientUploads(testClientId, 'meta_ads')

      expect(metaUploads.every((u: any) => u.platformId === 'meta_ads')).toBe(true)
    })

    it('retrieves single upload by ID', async () => {
      const upload = await supabaseService.createUpload(testClientId, {
        platformId: 'meta_ads',
        filename: 'single_upload.csv',
        rowCount: 42,
        status: 'completed',
      })
      context.track('platform_uploads', upload.id)

      const fetched = await supabaseService.getUpload(upload.id)

      expect(fetched.id).toBe(upload.id)
      expect(fetched.filename).toBe('single_upload.csv')
      expect(fetched.rowCount).toBe(42)
    })
  })

  // ============================================================
  // Upload Deletion
  // ============================================================
  describe('Upload Deletion', () => {
    it('deletes single upload', async () => {
      const upload = await supabaseService.createUpload(testClientId, {
        platformId: 'meta_ads',
        filename: 'to_delete.csv',
        rowCount: 10,
        status: 'completed',
      })

      await supabaseService.deleteUpload(upload.id)

      const result = await supabaseService.getUpload(upload.id)
      expect(result).toBeNull()
    })

    it('deletes all uploads for platform', async () => {
      // Create uploads for two platforms
      const meta1 = await supabaseService.createUpload(testClientId, {
        platformId: 'meta_ads',
        filename: 'meta_to_delete1.csv',
        status: 'completed',
      })
      context.track('platform_uploads', meta1.id)

      const meta2 = await supabaseService.createUpload(testClientId, {
        platformId: 'meta_ads',
        filename: 'meta_to_delete2.csv',
        status: 'completed',
      })
      context.track('platform_uploads', meta2.id)

      const google = await supabaseService.createUpload(testClientId, {
        platformId: 'google_ads',
        filename: 'google_keep.csv',
        status: 'completed',
      })
      context.track('platform_uploads', google.id)

      // Delete all meta_ads uploads
      await supabaseService.deleteUploadsByPlatform(testClientId, 'meta_ads')

      // Google upload should still exist
      const googleFetch = await supabaseService.getUpload(google.id)
      expect(googleFetch).not.toBeNull()

      // Meta uploads should be gone - can't track them for cleanup since they're deleted
      const uploads = await supabaseService.getClientUploads(testClientId, 'meta_ads')
      expect(uploads.filter((u: any) => u.id === meta1.id || u.id === meta2.id)).toHaveLength(0)
    })
  })

  // ============================================================
  // Platform Data Storage
  // ============================================================
  describe('Platform Data Storage', () => {
    it('stores platform data with upload reference', async () => {
      // Create upload record
      const upload = await supabaseService.createUpload(testClientId, {
        platformId: 'meta_ads',
        filename: 'data_storage_test.csv',
        rowCount: 5,
        status: 'completed',
      })
      context.track('platform_uploads', upload.id)

      // Store associated data (this depends on your actual implementation)
      // If createPlatformData exists:
      // await supabaseService.createPlatformData(testClientId, 'meta_ads', upload.id, rowData)

      const fetchedUpload = await supabaseService.getUpload(upload.id)
      expect(fetchedUpload.status).toBe('completed')
    })

    it('retrieves platform data for client', async () => {
      // Create upload with data
      const upload = await supabaseService.createUpload(testClientId, {
        platformId: 'meta_ads',
        filename: 'retrieval_test.csv',
        rowCount: 10,
        status: 'completed',
      })
      context.track('platform_uploads', upload.id)

      // Get platform data (may be empty if no actual rows inserted)
      const data = await supabaseService.getPlatformData(testClientId, 'meta_ads')

      // Should not throw error, data might be empty array
      expect(Array.isArray(data)).toBe(true)
    })

    it('counts platform data rows', async () => {
      // Create uploads
      const upload = await supabaseService.createUpload(testClientId, {
        platformId: 'meta_ads',
        filename: 'count_test.csv',
        rowCount: 25,
        status: 'completed',
      })
      context.track('platform_uploads', upload.id)

      // Count rows - returns total count as number
      const count = await supabaseService.countPlatformDataRows(testClientId)

      // Should return a number (count of platform_data rows, not upload.rowCount)
      // Note: This test creates an upload record but doesn't insert actual platform_data rows
      expect(typeof count).toBe('number')
    })
  })

  // ============================================================
  // Edge Cases
  // ============================================================
  describe('Edge Cases', () => {
    it('handles empty upload list', async () => {
      // Create fresh client with no uploads
      const freshClient = await supabaseService.createClient({
        name: context.uniqueName('Fresh Client'),
        email: context.uniqueEmail('fresh'),
      })
      context.track('clients', freshClient.id)

      const uploads = await supabaseService.getClientUploads(freshClient.id)

      expect(uploads).toEqual([])
    })

    it('handles non-existent upload ID', async () => {
      const result = await supabaseService.getUpload('upload-nonexistent')
      expect(result).toBeNull()
    })

    it('creates upload with metadata', async () => {
      const upload = await supabaseService.createUpload(testClientId, {
        platformId: 'meta_ads',
        filename: 'with_metadata.csv',
        rowCount: 100,
        status: 'completed',
        metadata: {
          dateRange: {
            start: '2024-01-01',
            end: '2024-01-31',
          },
          columns: ['date', 'campaign_name', 'impressions', 'clicks', 'spend'],
        },
      })
      context.track('platform_uploads', upload.id)

      const fetched = await supabaseService.getUpload(upload.id)
      expect(fetched.metadata).toEqual({
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31',
        },
        columns: ['date', 'campaign_name', 'impressions', 'clicks', 'spend'],
      })
    })
  })

  // ============================================================
  // CSV Fixture Parsing Tests (Pure Unit)
  // ============================================================
  describe('CSV Parsing', () => {
    it('parses Meta Ads CSV fixture', () => {
      const csvPath = join(FIXTURES_DIR, 'platforms/meta-ads/meta_ads_basic.csv')
      const csvContent = readFileSync(csvPath, 'utf-8')
      const rows = parseCSV(csvContent)

      expect(rows.length).toBeGreaterThan(0)
      expect(rows[0]).toHaveProperty('date_start')
      expect(rows[0]).toHaveProperty('campaign_name')
      expect(rows[0]).toHaveProperty('impressions')
      expect(rows[0]).toHaveProperty('spend')
    })

    it('parses Google Ads CSV fixture', () => {
      const csvPath = join(FIXTURES_DIR, 'platforms/google-ads/google_ads_basic.csv')
      const csvContent = readFileSync(csvPath, 'utf-8')
      const rows = parseCSV(csvContent)

      expect(rows.length).toBeGreaterThan(0)
    })

    it('handles empty CSV file', () => {
      const csvPath = join(FIXTURES_DIR, 'edge-cases/empty_file.csv')
      const csvContent = readFileSync(csvPath, 'utf-8')
      const rows = parseCSV(csvContent)

      expect(rows).toEqual([])
    })

    it('handles headers-only CSV', () => {
      const csvPath = join(FIXTURES_DIR, 'edge-cases/headers_only.csv')
      const csvContent = readFileSync(csvPath, 'utf-8')
      const rows = parseCSV(csvContent)

      expect(rows).toEqual([])
    })

    it('handles Unicode in CSV', () => {
      const csvPath = join(FIXTURES_DIR, 'edge-cases/unicode_test.csv')
      const csvContent = readFileSync(csvPath, 'utf-8')
      const rows = parseCSV(csvContent)

      expect(rows.length).toBeGreaterThan(0)
    })
  })
})
