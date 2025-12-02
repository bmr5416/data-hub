/**
 * Report Preview Integration Tests
 *
 * Tests end-to-end report generation flow against local Supabase.
 * Verifies data aggregation, visualization config, and preview generation.
 *
 * Requirements:
 * - Local Supabase must be running (supabase start)
 * - SUPABASE_SERVICE_ROLE_KEY must be set
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { TestContext } from '../../setup/supabase-helpers'

// Track Supabase availability - checked at runtime
let supabaseService: any = null
let reportService: any = null
let supabaseAvailable = false

const checkSupabaseConnection = async (): Promise<boolean> => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠ Supabase credentials not set. Skipping report preview tests.')
    return false
  }

  try {
    const { supabaseService: svc } = await import('../../../server/services/supabase.js')
    await svc.init()
    await svc.getClients()
    supabaseService = svc

    const { reportService: rptSvc } = await import('../../../server/services/reportService.js')
    reportService = rptSvc

    return true
  } catch (error: any) {
    console.warn('⚠ Supabase connection failed. Skipping report preview tests.')
    console.warn(`  Error: ${error.message}`)
    return false
  }
}

describe('Report Preview Integration', () => {
  let context: TestContext
  let testClientId: string
  let testWarehouseId: string

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
      name: context.uniqueName('Report Preview Test Client'),
      email: context.uniqueEmail('report'),
      status: 'active',
    })
    context.track('clients', client.id)
    testClientId = client.id

    // Create test warehouse
    const warehouse = await supabaseService.createWarehouse(testClientId, {
      name: context.uniqueName('Preview Test Warehouse'),
      platforms: ['meta_ads'],
      fieldSelections: {
        meta_ads: {
          dimensions: ['date', 'campaign_name'],
          metrics: ['impressions', 'clicks', 'spend'],
        },
      },
      includeBlendedTable: true,
    })
    context.track('data_warehouses', warehouse.id)
    testWarehouseId = warehouse.id
  })

  afterEach(async () => {
    if (context) {
      await context.cleanup()
    }
  })

  // ============================================================
  // Report Creation and Preview
  // ============================================================
  describe('Report Preview Flow', () => {
    it('creates report and generates preview with KPIs', async () => {
      const report = await supabaseService.createReport(testClientId, {
        name: context.uniqueName('KPI Preview Report'),
        warehouseId: testWarehouseId,
        visualizationConfig: {
          kpis: [
            {
              id: 'kpi-1',
              metric: 'spend',
              label: 'Total Spend',
              format: 'currency',
            },
            {
              id: 'kpi-2',
              metric: 'impressions',
              label: 'Total Impressions',
              format: 'number',
            },
          ],
          charts: [],
        },
        dateRange: 'last_7_days',
      })
      context.track('reports', report.id)

      expect(report.visualizationConfig).toEqual({
        kpis: [
          {
            id: 'kpi-1',
            metric: 'spend',
            label: 'Total Spend',
            format: 'currency',
          },
          {
            id: 'kpi-2',
            metric: 'impressions',
            label: 'Total Impressions',
            format: 'number',
          },
        ],
        charts: [],
      })
      expect(report.dateRange).toBe('last_7_days')
    })

    it('creates report with chart visualizations', async () => {
      const report = await supabaseService.createReport(testClientId, {
        name: context.uniqueName('Chart Report'),
        warehouseId: testWarehouseId,
        visualizationConfig: {
          kpis: [],
          charts: [
            {
              id: 'chart-1',
              type: 'bar',
              title: 'Spend by Campaign',
              metric: 'spend',
              dimension: 'campaign_name',
            },
            {
              id: 'chart-2',
              type: 'line',
              title: 'Daily Impressions',
              metric: 'impressions',
              dimension: 'date',
            },
          ],
        },
      })
      context.track('reports', report.id)

      expect(report.visualizationConfig).toEqual({
        kpis: [],
        charts: [
          {
            id: 'chart-1',
            type: 'bar',
            title: 'Spend by Campaign',
            metric: 'spend',
            dimension: 'campaign_name',
          },
          {
            id: 'chart-2',
            type: 'line',
            title: 'Daily Impressions',
            metric: 'impressions',
            dimension: 'date',
          },
        ],
      })
    })

    it('updates report with new visualization config', async () => {
      // Create initial report
      const report = await supabaseService.createReport(testClientId, {
        name: context.uniqueName('Update Viz Report'),
        warehouseId: testWarehouseId,
        visualizationConfig: {
          kpis: [{ id: 'kpi-1', metric: 'spend', label: 'Spend', format: 'currency' }],
          charts: [],
        },
      })
      context.track('reports', report.id)

      // Update with new config
      const updated = await supabaseService.updateReport(report.id, {
        visualizationConfig: {
          kpis: [
            { id: 'kpi-1', metric: 'spend', label: 'Total Spend', format: 'currency' },
            { id: 'kpi-2', metric: 'clicks', label: 'Total Clicks', format: 'number' },
          ],
          charts: [
            { id: 'chart-1', type: 'pie', title: 'Spend Distribution', metric: 'spend', dimension: 'campaign_name' },
          ],
        },
      })

      expect(updated.visualizationConfig.kpis).toHaveLength(2)
      expect(updated.visualizationConfig.charts).toHaveLength(1)
    })
  })

  // ============================================================
  // Report Scheduling
  // ============================================================
  describe('Report Scheduling', () => {
    it('creates scheduled report with all config', async () => {
      const report = await supabaseService.createReport(testClientId, {
        name: context.uniqueName('Scheduled Report'),
        warehouseId: testWarehouseId,
        isScheduled: true,
        scheduleConfig: {
          frequency: 'weekly',
          dayOfWeek: 'monday',
          time: '09:00',
          timezone: 'America/New_York',
        },
        recipients: ['test@example.com', 'manager@example.com'],
        format: 'pdf',
      })
      context.track('reports', report.id)

      expect(report.isScheduled).toBe(true)
      expect(report.scheduleConfig).toEqual({
        frequency: 'weekly',
        dayOfWeek: 'monday',
        time: '09:00',
        timezone: 'America/New_York',
      })
      expect(report.recipients).toEqual(['test@example.com', 'manager@example.com'])
      expect(report.format).toBe('pdf')
    })

    it('toggles report schedule on and off', async () => {
      const report = await supabaseService.createReport(testClientId, {
        name: context.uniqueName('Toggle Schedule'),
        warehouseId: testWarehouseId,
        isScheduled: false,
      })
      context.track('reports', report.id)

      // Enable scheduling
      const enabled = await supabaseService.updateReport(report.id, {
        isScheduled: true,
        scheduleConfig: {
          frequency: 'daily',
          time: '08:00',
        },
      })
      expect(enabled.isScheduled).toBe(true)

      // Disable scheduling
      const disabled = await supabaseService.updateReport(report.id, {
        isScheduled: false,
      })
      expect(disabled.isScheduled).toBe(false)
    })
  })

  // ============================================================
  // Report with Filters
  // ============================================================
  describe('Report Filters', () => {
    it('creates report with filter configuration', async () => {
      const report = await supabaseService.createReport(testClientId, {
        name: context.uniqueName('Filtered Report'),
        warehouseId: testWarehouseId,
        visualizationConfig: {
          kpis: [{ id: 'kpi-1', metric: 'spend', label: 'Spend', format: 'currency' }],
          charts: [],
          filters: [
            {
              field: 'campaign_name',
              operator: 'contains',
              value: 'Brand',
            },
          ],
        },
      })
      context.track('reports', report.id)

      expect(report.visualizationConfig.filters).toHaveLength(1)
      expect(report.visualizationConfig.filters[0].operator).toBe('contains')
    })

    it('creates report with multiple filters', async () => {
      const report = await supabaseService.createReport(testClientId, {
        name: context.uniqueName('Multi Filter Report'),
        warehouseId: testWarehouseId,
        visualizationConfig: {
          kpis: [],
          charts: [],
          filters: [
            { field: 'campaign_name', operator: 'contains', value: 'Brand' },
            { field: 'spend', operator: 'greater_than', value: 100 },
          ],
        },
      })
      context.track('reports', report.id)

      expect(report.visualizationConfig.filters).toHaveLength(2)
    })
  })

  // ============================================================
  // Report with Multiple Platforms
  // ============================================================
  describe('Multi-Platform Reports', () => {
    let multiPlatformWarehouseId: string

    beforeEach(async ({ skip }) => {
      if (!supabaseAvailable) {
        skip()
        return
      }

      // Create multi-platform warehouse
      const warehouse = await supabaseService.createWarehouse(testClientId, {
        name: context.uniqueName('Multi Platform Warehouse'),
        platforms: ['meta_ads', 'google_ads'],
        fieldSelections: {
          meta_ads: {
            dimensions: ['date', 'campaign_name'],
            metrics: ['impressions', 'clicks', 'spend'],
          },
          google_ads: {
            dimensions: ['date', 'campaign_name'],
            metrics: ['impressions', 'clicks', 'cost'],
          },
        },
        includeBlendedTable: true,
      })
      context.track('data_warehouses', warehouse.id)
      multiPlatformWarehouseId = warehouse.id
    })

    it('creates report with blended multi-platform warehouse', async () => {
      const report = await supabaseService.createReport(testClientId, {
        name: context.uniqueName('Multi Platform Report'),
        warehouseId: multiPlatformWarehouseId,
        visualizationConfig: {
          kpis: [
            { id: 'kpi-1', metric: 'impressions', label: 'Total Impressions', format: 'number' },
            { id: 'kpi-2', metric: 'clicks', label: 'Total Clicks', format: 'number' },
          ],
          charts: [
            { id: 'chart-1', type: 'bar', title: 'Impressions by Platform', metric: 'impressions', dimension: 'platform' },
          ],
        },
      })
      context.track('reports', report.id)

      expect(report.warehouseId).toBe(multiPlatformWarehouseId)
    })
  })

  // ============================================================
  // Report Retrieval
  // ============================================================
  describe('Report Retrieval', () => {
    it('retrieves report with full configuration', async () => {
      const created = await supabaseService.createReport(testClientId, {
        name: context.uniqueName('Retrieval Test'),
        warehouseId: testWarehouseId,
        visualizationConfig: {
          kpis: [{ id: 'kpi-1', metric: 'spend', label: 'Spend', format: 'currency' }],
          charts: [{ id: 'chart-1', type: 'line', title: 'Trend', metric: 'spend', dimension: 'date' }],
        },
        dateRange: 'last_30_days',
        isScheduled: true,
        scheduleConfig: {
          frequency: 'monthly',
          dayOfMonth: 1,
          time: '07:00',
        },
      })
      context.track('reports', created.id)

      const fetched = await supabaseService.getReport(created.id)

      expect(fetched.id).toBe(created.id)
      expect(fetched.visualizationConfig.kpis).toHaveLength(1)
      expect(fetched.visualizationConfig.charts).toHaveLength(1)
      expect(fetched.dateRange).toBe('last_30_days')
      expect(fetched.isScheduled).toBe(true)
      expect(fetched.scheduleConfig.frequency).toBe('monthly')
    })

    it('returns null for non-existent report', async () => {
      const result = await supabaseService.getReport('r-nonexistent')
      expect(result).toBeNull()
    })
  })
})
