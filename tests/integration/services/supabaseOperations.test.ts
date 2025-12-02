/**
 * Supabase Operations Integration Tests
 *
 * Tests real database operations against local Supabase instance.
 * Uses TestContext for cleanup and factories for test data.
 *
 * Requirements:
 * - Local Supabase must be running (supabase start)
 * - SUPABASE_SERVICE_ROLE_KEY must be set
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { TestContext } from '../../setup/supabase-helpers'
import { createTestClient as createClientData } from '../../fixtures/factories/client.factory'
import { createConnectedSource } from '../../fixtures/factories/source.factory'

// Track Supabase availability - checked at runtime in beforeAll
let supabaseService: any = null
let supabaseAvailable = false

// Dynamic import wrapper to avoid import errors when Supabase isn't configured
const checkSupabaseConnection = async (): Promise<boolean> => {
  // First check if credentials are set
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠ Supabase credentials not set. Skipping integration tests.')
    return false
  }

  try {
    // Try to connect to Supabase
    const { supabaseService: svc } = await import('../../../server/services/supabase.js')
    await svc.init()

    // Test connection with a simple query
    await svc.getClients()

    supabaseService = svc
    return true
  } catch (error: any) {
    console.warn('⚠ Supabase connection failed. Skipping integration tests.')
    console.warn(`  Error: ${error.message}`)
    return false
  }
}

describe('Supabase Operations Integration', () => {
  let context: TestContext

  beforeAll(async () => {
    supabaseAvailable = await checkSupabaseConnection()
  })

  beforeEach(({ skip }) => {
    if (!supabaseAvailable) {
      skip()
      return
    }
    context = new TestContext()
  })

  afterEach(async () => {
    if (context) {
      await context.cleanup()
    }
  })

  // ============================================================
  // Client CRUD Operations
  // ============================================================
  describe('Client Operations', () => {
    describe('createClient', () => {
      it('creates a client with all fields', async () => {
        const clientData = createClientData({
          name: context.uniqueName('Integration Test Client'),
          status: 'active',
          industry: 'Technology',
        })

        const result = await supabaseService.createClient(clientData)
        context.track('clients', result.id)

        expect(result).toMatchObject({
          name: clientData.name,
          email: clientData.email,
          status: 'active',
          industry: 'Technology',
        })
        expect(result.id).toMatch(/^c-[a-z0-9]{8}$/)
        expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      })

      it('creates a client with minimal fields', async () => {
        const result = await supabaseService.createClient({
          name: context.uniqueName('Minimal Client'),
          email: context.uniqueEmail('minimal'),
        })
        context.track('clients', result.id)

        expect(result.name).toContain('Minimal Client')
        expect(result.status).toBe('onboarding') // default
      })

      it('creates client with custom ID', async () => {
        // Custom ID must fit varchar(20) constraint: c-XXXXXXXX format
        const shortId = Date.now().toString(36).slice(-8)
        const customId = `c-${shortId}`
        const result = await supabaseService.createClient({
          id: customId,
          name: context.uniqueName('Custom ID Client'),
          email: context.uniqueEmail('customid'),
        })
        context.track('clients', result.id)

        expect(result.id).toBe(customId)
        expect(result.id.length).toBeLessThanOrEqual(20)
      })
    })

    describe('getClient', () => {
      it('returns client with all related data', async () => {
        // Create client
        const client = await supabaseService.createClient({
          name: context.uniqueName('Client With Data'),
          email: context.uniqueEmail('withdata'),
          status: 'active',
        })
        context.track('clients', client.id)

        // Add a source
        const source = await supabaseService.createSource(client.id, {
          name: context.uniqueName('Test Source'),
          platform: 'meta_ads',
          status: 'connected',
        })
        context.track('data_sources', source.id)

        // Fetch client
        const result = await supabaseService.getClient(client.id)

        expect(result).toMatchObject({
          id: client.id,
          name: client.name,
          status: 'active',
        })
        expect(result.sources).toHaveLength(1)
        expect(result.sources[0].name).toContain('Test Source')
      })

      it('returns null for non-existent client', async () => {
        const result = await supabaseService.getClient('c-nonexist')

        expect(result).toBeNull()
      })
    })

    describe('updateClient', () => {
      it('updates client fields', async () => {
        const client = await supabaseService.createClient({
          name: context.uniqueName('Original Name'),
          email: context.uniqueEmail('original'),
          status: 'onboarding',
        })
        context.track('clients', client.id)

        const updated = await supabaseService.updateClient(client.id, {
          name: context.uniqueName('Updated Name'),
          status: 'active',
        })

        expect(updated.name).toContain('Updated Name')
        expect(updated.status).toBe('active')
      })

      it('only updates provided fields', async () => {
        const client = await supabaseService.createClient({
          name: context.uniqueName('Partial Update'),
          email: context.uniqueEmail('partial'),
          status: 'active',
          industry: 'Technology',
        })
        context.track('clients', client.id)

        const updated = await supabaseService.updateClient(client.id, {
          status: 'inactive',
        })

        expect(updated.status).toBe('inactive')
        expect(updated.industry).toBe('Technology') // unchanged
      })
    })

    describe('deleteClient', () => {
      it('deletes client and cascades to ALL related entities', async () => {
        // Create client with ALL child entity types
        const client = await supabaseService.createClient({
          name: context.uniqueName('To Delete'),
          email: context.uniqueEmail('todelete'),
        })

        // Create source
        const source = await supabaseService.createSource(client.id, {
          name: context.uniqueName('Cascade Source'),
          platform: 'meta_ads',
          status: 'connected',
        })

        // Create warehouse
        const warehouse = await supabaseService.createWarehouse(client.id, {
          name: context.uniqueName('Cascade Warehouse'),
          platforms: ['meta_ads'],
          fieldSelections: { meta_ads: { dimensions: ['date'], metrics: ['spend'] } },
        })

        // Create ETL process
        const etl = await supabaseService.createETLProcess(client.id, {
          name: context.uniqueName('Cascade ETL'),
          source: 'meta_ads',
          destination: 'bigquery',
          status: 'active',
        })

        // Create KPI
        const kpi = await supabaseService.createKPI(client.id, {
          name: context.uniqueName('Cascade KPI'),
          metric: 'spend',
          category: 'performance',
        })

        // Create report
        const report = await supabaseService.createReport(client.id, {
          name: context.uniqueName('Cascade Report'),
          warehouseId: warehouse.id,
        })

        // Create upload
        const upload = await supabaseService.createUpload(client.id, {
          platformId: 'meta_ads',
          filename: 'cascade_test.csv',
          status: 'completed',
        })

        // Create lineage connection (destination must be etl, kpi, or report per constraint)
        const lineage = await supabaseService.createLineage({
          clientId: client.id,
          sourceId: source.id,
          destinationType: 'report',
          destinationId: report.id,
        })

        // Delete client - should cascade delete everything
        await supabaseService.deleteClient(client.id)

        // Verify ALL entities are deleted
        expect(await supabaseService.getClient(client.id)).toBeNull()
        expect(await supabaseService.getSource(source.id)).toBeNull()
        expect(await supabaseService.getWarehouseById(warehouse.id)).toBeNull()
        expect(await supabaseService.getETLProcess(etl.id)).toBeNull()
        expect(await supabaseService.getKPI(kpi.id)).toBeNull()
        expect(await supabaseService.getReport(report.id)).toBeNull()
        expect(await supabaseService.getUpload(upload.id)).toBeNull()

        // Verify lineage is deleted via direct query (no getLineage method)
        const { data: lineageCheck } = await context.client
          .from('data_lineage')
          .select('id')
          .eq('id', lineage.id)
          .maybeSingle()
        expect(lineageCheck).toBeNull()
      })
    })

    describe('getClients', () => {
      it('returns all clients with counts', async () => {
        // Create test clients
        const client1 = await supabaseService.createClient({
          name: context.uniqueName('List Client 1'),
          email: context.uniqueEmail('list1'),
        })
        context.track('clients', client1.id)

        const client2 = await supabaseService.createClient({
          name: context.uniqueName('List Client 2'),
          email: context.uniqueEmail('list2'),
        })
        context.track('clients', client2.id)

        // Add sources to client1
        const source = await supabaseService.createSource(client1.id, {
          name: context.uniqueName('Count Source'),
          platform: 'meta_ads',
          status: 'connected',
        })
        context.track('data_sources', source.id)

        const clients = await supabaseService.getClients()

        // Find our test clients - verify they exist and have correct structure
        const testClient1 = clients.find((c: any) => c.id === client1.id)
        const testClient2 = clients.find((c: any) => c.id === client2.id)

        expect(testClient1).not.toBeNull()
        expect(testClient1).toMatchObject({
          id: client1.id,
          name: expect.stringContaining('List Client 1'),
          sourceCount: 1,
        })
        expect(testClient2).not.toBeNull()
        expect(testClient2).toMatchObject({
          id: client2.id,
          name: expect.stringContaining('List Client 2'),
          sourceCount: 0,
        })
      })
    })
  })

  // ============================================================
  // Source CRUD Operations
  // ============================================================
  describe('Source Operations', () => {
    let testClientId: string

    beforeEach(async () => {
      const client = await supabaseService.createClient({
        name: context.uniqueName('Source Test Client'),
        email: context.uniqueEmail('source'),
      })
      context.track('clients', client.id)
      testClientId = client.id
    })

    describe('createSource', () => {
      it('creates a source with all fields', async () => {
        const sourceData = createConnectedSource('meta_ads', {
          name: context.uniqueName('Full Source'),
        })

        const result = await supabaseService.createSource(testClientId, sourceData)
        context.track('data_sources', result.id)

        expect(result).toMatchObject({
          name: sourceData.name,
          platform: 'meta_ads',
          status: 'connected',
        })
        expect(result.id).toMatch(/^s-[a-z0-9]{8}$/)
      })

      it('creates sources for different platforms', async () => {
        const platforms = ['meta_ads', 'google_ads', 'ga4'] as const

        for (const platform of platforms) {
          const source = await supabaseService.createSource(testClientId, {
            name: context.uniqueName(`${platform} Source`),
            platform,
            status: 'connected',
          })
          context.track('data_sources', source.id)

          expect(source.platform).toBe(platform)
        }

        const sources = await supabaseService.getClientSources(testClientId)
        expect(sources).toHaveLength(3)
      })
    })

    describe('getSource', () => {
      it('returns source by ID', async () => {
        const source = await supabaseService.createSource(testClientId, {
          name: context.uniqueName('Get Source'),
          platform: 'google_ads',
          status: 'pending',
        })
        context.track('data_sources', source.id)

        const result = await supabaseService.getSource(source.id)

        expect(result).toMatchObject({
          id: source.id,
          name: source.name,
          platform: 'google_ads',
          status: 'pending',
        })
      })

      it('returns null for non-existent source', async () => {
        const result = await supabaseService.getSource('s-nonexist')
        expect(result).toBeNull()
      })
    })

    describe('updateSource', () => {
      it('updates source status', async () => {
        const source = await supabaseService.createSource(testClientId, {
          name: context.uniqueName('Update Status'),
          platform: 'meta_ads',
          status: 'pending',
        })
        context.track('data_sources', source.id)

        const updated = await supabaseService.updateSource(source.id, {
          status: 'connected',
        })

        expect(updated.status).toBe('connected')
      })
    })

    describe('deleteSource', () => {
      it('deletes source', async () => {
        const source = await supabaseService.createSource(testClientId, {
          name: context.uniqueName('To Delete'),
          platform: 'meta_ads',
          status: 'connected',
        })

        await supabaseService.deleteSource(source.id)

        const result = await supabaseService.getSource(source.id)
        expect(result).toBeNull()
      })
    })

    describe('getClientSources', () => {
      it('returns only sources for specific client', async () => {
        // Create source for test client
        const source1 = await supabaseService.createSource(testClientId, {
          name: context.uniqueName('Client Source'),
          platform: 'meta_ads',
          status: 'connected',
        })
        context.track('data_sources', source1.id)

        // Create another client with source
        const otherClient = await supabaseService.createClient({
          name: context.uniqueName('Other Client'),
          email: context.uniqueEmail('other'),
        })
        context.track('clients', otherClient.id)

        const source2 = await supabaseService.createSource(otherClient.id, {
          name: context.uniqueName('Other Source'),
          platform: 'google_ads',
          status: 'connected',
        })
        context.track('data_sources', source2.id)

        // Get sources for test client only
        const sources = await supabaseService.getClientSources(testClientId)

        expect(sources).toHaveLength(1)
        expect(sources[0].id).toBe(source1.id)
      })
    })
  })

  // ============================================================
  // Warehouse Operations
  // ============================================================
  describe('Warehouse Operations', () => {
    let testClientId: string

    beforeEach(async () => {
      const client = await supabaseService.createClient({
        name: context.uniqueName('Warehouse Test Client'),
        email: context.uniqueEmail('warehouse'),
      })
      context.track('clients', client.id)
      testClientId = client.id
    })

    describe('createWarehouse', () => {
      it('creates a warehouse with field selections', async () => {
        const warehouseData = {
          name: context.uniqueName('Test Warehouse'),
          platforms: ['meta_ads'],
          fieldSelections: {
            meta_ads: {
              dimensions: ['date', 'campaign_name'],
              metrics: ['impressions', 'clicks', 'spend'],
            },
          },
          includeBlendedTable: true,
        }

        const result = await supabaseService.createWarehouse(testClientId, warehouseData)
        context.track('data_warehouses', result.id)

        expect(result).toMatchObject({
          name: warehouseData.name,
          platforms: ['meta_ads'],
          includeBlendedTable: true,
        })
        expect(result.id).toMatch(/^wh-[a-z0-9]{8}$/)
      })

      it('creates blended warehouse with multiple platforms', async () => {
        const warehouseData = {
          name: context.uniqueName('Blended Warehouse'),
          platforms: ['meta_ads', 'google_ads'],
          fieldSelections: {
            meta_ads: {
              dimensions: ['date'],
              metrics: ['impressions'],
            },
            google_ads: {
              dimensions: ['date'],
              metrics: ['clicks'],
            },
          },
          includeBlendedTable: true,
        }

        const result = await supabaseService.createWarehouse(testClientId, warehouseData)
        context.track('data_warehouses', result.id)

        expect(result.platforms).toEqual(['meta_ads', 'google_ads'])
      })
    })

    describe('getWarehouseById', () => {
      it('returns warehouse with all data', async () => {
        const warehouse = await supabaseService.createWarehouse(testClientId, {
          name: context.uniqueName('Get Warehouse'),
          platforms: ['meta_ads'],
          fieldSelections: {
            meta_ads: {
              dimensions: ['date'],
              metrics: ['spend'],
            },
          },
        })
        context.track('data_warehouses', warehouse.id)

        const result = await supabaseService.getWarehouseById(warehouse.id)

        expect(result).toMatchObject({
          id: warehouse.id,
          name: warehouse.name,
          platforms: ['meta_ads'],
        })
        expect(result.fieldSelections).toEqual({
          meta_ads: {
            dimensions: ['date'],
            metrics: ['spend'],
          },
        })
      })
    })

    describe('updateWarehouse', () => {
      it('updates warehouse name', async () => {
        const warehouse = await supabaseService.createWarehouse(testClientId, {
          name: context.uniqueName('Original Warehouse'),
          platforms: ['meta_ads'],
          fieldSelections: {
            meta_ads: {
              dimensions: ['date'],
              metrics: ['spend'],
            },
          },
        })
        context.track('data_warehouses', warehouse.id)

        const updated = await supabaseService.updateWarehouse(warehouse.id, {
          name: context.uniqueName('Updated Warehouse'),
        })

        expect(updated.name).toContain('Updated Warehouse')
      })
    })

    describe('getClientWarehouses', () => {
      it('returns warehouses for specific client', async () => {
        const warehouse1 = await supabaseService.createWarehouse(testClientId, {
          name: context.uniqueName('Warehouse 1'),
          platforms: ['meta_ads'],
          fieldSelections: {
            meta_ads: {
              dimensions: ['date'],
              metrics: ['spend'],
            },
          },
        })
        context.track('data_warehouses', warehouse1.id)

        const warehouse2 = await supabaseService.createWarehouse(testClientId, {
          name: context.uniqueName('Warehouse 2'),
          platforms: ['google_ads'],
          fieldSelections: {
            google_ads: {
              dimensions: ['date'],
              metrics: ['clicks'],
            },
          },
        })
        context.track('data_warehouses', warehouse2.id)

        const warehouses = await supabaseService.getClientWarehouses(testClientId)

        expect(warehouses).toHaveLength(2)
        expect(warehouses.map((w) => w.id)).toContain(warehouse1.id)
        expect(warehouses.map((w) => w.id)).toContain(warehouse2.id)
      })
    })
  })

  // ============================================================
  // KPI Operations
  // ============================================================
  describe('KPI Operations', () => {
    let testClientId: string

    beforeEach(async () => {
      const client = await supabaseService.createClient({
        name: context.uniqueName('KPI Test Client'),
        email: context.uniqueEmail('kpi'),
      })
      context.track('clients', client.id)
      testClientId = client.id
    })

    describe('createKPI', () => {
      it('creates a KPI with all fields', async () => {
        const kpiData = {
          name: context.uniqueName('Test KPI'),
          metric: 'spend',
          targetValue: 10000,
          currentValue: 8500,
          format: 'currency',
        }

        const result = await supabaseService.createKPI(testClientId, kpiData)
        context.track('kpis', result.id)

        expect(result).toMatchObject({
          name: kpiData.name,
          metric: 'spend',
          targetValue: 10000,
          currentValue: 8500,
          format: 'currency',
        })
      })
    })

    describe('getKPI', () => {
      it('returns KPI by ID', async () => {
        const kpi = await supabaseService.createKPI(testClientId, {
          name: context.uniqueName('Get KPI'),
          metric: 'roas',
          targetValue: 4.0,
        })
        context.track('kpis', kpi.id)

        const result = await supabaseService.getKPI(kpi.id)

        expect(result.id).toBe(kpi.id)
        expect(result.metric).toBe('roas')
      })
    })

    describe('updateKPI', () => {
      it('updates KPI current value', async () => {
        const kpi = await supabaseService.createKPI(testClientId, {
          name: context.uniqueName('Update KPI'),
          metric: 'conversions',
          targetValue: 100,
          currentValue: 50,
        })
        context.track('kpis', kpi.id)

        const updated = await supabaseService.updateKPI(kpi.id, {
          currentValue: 75,
        })

        expect(updated.currentValue).toBe(75)
      })
    })

    describe('deleteKPI', () => {
      it('deletes KPI', async () => {
        const kpi = await supabaseService.createKPI(testClientId, {
          name: context.uniqueName('Delete KPI'),
          metric: 'ctr',
        })

        await supabaseService.deleteKPI(kpi.id)

        const result = await supabaseService.getKPI(kpi.id)
        expect(result).toBeNull()
      })
    })
  })

  // ============================================================
  // Report Operations
  // ============================================================
  describe('Report Operations', () => {
    let testClientId: string
    let testWarehouseId: string

    beforeEach(async () => {
      const client = await supabaseService.createClient({
        name: context.uniqueName('Report Test Client'),
        email: context.uniqueEmail('report'),
      })
      context.track('clients', client.id)
      testClientId = client.id

      const warehouse = await supabaseService.createWarehouse(testClientId, {
        name: context.uniqueName('Report Warehouse'),
        platforms: ['meta_ads'],
        fieldSelections: {
          meta_ads: {
            dimensions: ['date'],
            metrics: ['spend'],
          },
        },
      })
      context.track('data_warehouses', warehouse.id)
      testWarehouseId = warehouse.id
    })

    describe('createReport', () => {
      it('creates a report with visualization config', async () => {
        const reportData = {
          name: context.uniqueName('Test Report'),
          warehouseId: testWarehouseId,
          visualizationConfig: {
            kpis: [
              {
                id: 'kpi-1',
                metric: 'spend',
                label: 'Total Spend',
                format: 'currency',
              },
            ],
            charts: [],
          },
        }

        const result = await supabaseService.createReport(testClientId, reportData)
        context.track('reports', result.id)

        expect(result).toMatchObject({
          name: reportData.name,
          warehouseId: testWarehouseId,
        })
        expect(result.visualizationConfig).toEqual({
          kpis: [
            {
              id: 'kpi-1',
              metric: 'spend',
              label: 'Total Spend',
              format: 'currency',
            },
          ],
          charts: [],
        })
      })

      it('creates a scheduled report', async () => {
        const reportData = {
          name: context.uniqueName('Scheduled Report'),
          warehouseId: testWarehouseId,
          isScheduled: true,
          scheduleConfig: {
            frequency: 'weekly',
            dayOfWeek: 'monday',
            time: '09:00',
            timezone: 'America/New_York',
          },
          recipients: ['test@example.com'],
        }

        const result = await supabaseService.createReport(testClientId, reportData)
        context.track('reports', result.id)

        expect(result.isScheduled).toBe(true)
        expect(result.scheduleConfig).toMatchObject({
          frequency: 'weekly',
          dayOfWeek: 'monday',
        })
      })
    })

    describe('getReport', () => {
      it('returns report with all config', async () => {
        const report = await supabaseService.createReport(testClientId, {
          name: context.uniqueName('Get Report'),
          warehouseId: testWarehouseId,
        })
        context.track('reports', report.id)

        const result = await supabaseService.getReport(report.id)

        expect(result.id).toBe(report.id)
        expect(result.name).toBe(report.name)
      })
    })

    describe('updateReport', () => {
      it('updates report schedule', async () => {
        const report = await supabaseService.createReport(testClientId, {
          name: context.uniqueName('Update Schedule'),
          warehouseId: testWarehouseId,
          isScheduled: false,
        })
        context.track('reports', report.id)

        const updated = await supabaseService.updateReport(report.id, {
          isScheduled: true,
          scheduleConfig: {
            frequency: 'daily',
            time: '08:00',
          },
        })

        expect(updated.isScheduled).toBe(true)
        expect(updated.scheduleConfig.frequency).toBe('daily')
      })
    })

    describe('deleteReport', () => {
      it('deletes report', async () => {
        const report = await supabaseService.createReport(testClientId, {
          name: context.uniqueName('Delete Report'),
          warehouseId: testWarehouseId,
        })

        await supabaseService.deleteReport(report.id)

        const result = await supabaseService.getReport(report.id)
        expect(result).toBeNull()
      })
    })
  })

  // ============================================================
  // ETL Process Operations
  // ============================================================
  describe('ETL Process Operations', () => {
    let testClientId: string

    beforeEach(async () => {
      const client = await supabaseService.createClient({
        name: context.uniqueName('ETL Test Client'),
        email: context.uniqueEmail('etl'),
      })
      context.track('clients', client.id)
      testClientId = client.id
    })

    describe('createETLProcess', () => {
      it('creates an ETL process', async () => {
        const etlData = {
          name: context.uniqueName('Test ETL'),
          schedule: 'daily',
          status: 'active',
          description: 'Test ETL process',
        }

        const result = await supabaseService.createETLProcess(testClientId, etlData)
        context.track('etl_processes', result.id)

        expect(result).toMatchObject({
          name: etlData.name,
          schedule: 'daily',
          status: 'active',
        })
      })
    })

    describe('getETLProcess', () => {
      it('returns ETL process by ID', async () => {
        const etl = await supabaseService.createETLProcess(testClientId, {
          name: context.uniqueName('Get ETL'),
          status: 'active',
        })
        context.track('etl_processes', etl.id)

        const result = await supabaseService.getETLProcess(etl.id)

        expect(result.id).toBe(etl.id)
        expect(result.status).toBe('active')
      })
    })

    describe('updateETLProcess', () => {
      it('updates ETL status', async () => {
        const etl = await supabaseService.createETLProcess(testClientId, {
          name: context.uniqueName('Update ETL'),
          status: 'active',
        })
        context.track('etl_processes', etl.id)

        const updated = await supabaseService.updateETLProcess(etl.id, {
          status: 'paused',
        })

        expect(updated.status).toBe('paused')
      })
    })

    describe('deleteETLProcess', () => {
      it('deletes ETL process', async () => {
        const etl = await supabaseService.createETLProcess(testClientId, {
          name: context.uniqueName('Delete ETL'),
        })

        await supabaseService.deleteETLProcess(etl.id)

        const result = await supabaseService.getETLProcess(etl.id)
        expect(result).toBeNull()
      })
    })
  })

  // ============================================================
  // Lineage Operations
  // ============================================================
  describe('Lineage Operations', () => {
    let testClientId: string
    let testSourceId: string

    beforeEach(async () => {
      const client = await supabaseService.createClient({
        name: context.uniqueName('Lineage Test Client'),
        email: context.uniqueEmail('lineage'),
      })
      context.track('clients', client.id)
      testClientId = client.id

      const source = await supabaseService.createSource(testClientId, {
        name: context.uniqueName('Lineage Source'),
        platform: 'meta_ads',
        status: 'connected',
      })
      context.track('data_sources', source.id)
      testSourceId = source.id
    })

    describe('createLineage', () => {
      it('creates a lineage connection', async () => {
        const kpi = await supabaseService.createKPI(testClientId, {
          name: context.uniqueName('Lineage KPI'),
          metric: 'spend',
        })
        context.track('kpis', kpi.id)

        const lineageData = {
          clientId: testClientId,
          sourceId: testSourceId,
          destinationType: 'kpi',
          destinationId: kpi.id,
        }

        const result = await supabaseService.createLineage(lineageData)
        context.track('data_lineage', result.id)

        expect(result.sourceId).toBe(testSourceId)
        expect(result.destinationId).toBe(kpi.id)
      })
    })

    describe('getClientLineage', () => {
      it('returns all lineage for client', async () => {
        const kpi = await supabaseService.createKPI(testClientId, {
          name: context.uniqueName('Lineage KPI 2'),
          metric: 'clicks',
        })
        context.track('kpis', kpi.id)

        const lineage = await supabaseService.createLineage({
          clientId: testClientId,
          sourceId: testSourceId,
          destinationType: 'kpi',
          destinationId: kpi.id,
        })
        context.track('data_lineage', lineage.id)

        const result = await supabaseService.getClientLineage(testClientId)

        expect(result).toHaveLength(1)
        expect(result[0].id).toBe(lineage.id)
        expect(result[0].sourceId).toBe(testSourceId)
        expect(result[0].destinationId).toBe(kpi.id)
      })
    })
  })
})
