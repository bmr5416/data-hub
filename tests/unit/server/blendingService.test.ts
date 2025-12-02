/**
 * BlendingService Unit Tests
 *
 * Comprehensive tests for server/services/blendingService.js
 * Covers data harmonization, metric calculations, and data transformation.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import blendingService, { BlendingService, BLENDED_COLUMNS } from '../../../server/services/blendingService.js'

describe('BlendingService', () => {
  // Fresh instance for isolation in tests that need it
  let freshService: InstanceType<typeof BlendingService>

  beforeEach(() => {
    freshService = new BlendingService()
  })

  // ============================================================
  // round()
  // ============================================================
  describe('round', () => {
    it.each([
      { value: 1.234567, decimals: 2, expected: 1.23 },
      { value: 1.235, decimals: 2, expected: 1.24 }, // rounds up
      { value: 1.2, decimals: 2, expected: 1.2 },
      { value: 100, decimals: 2, expected: 100 },
      { value: 0, decimals: 2, expected: 0 },
      { value: -1.234567, decimals: 2, expected: -1.23 },
      { value: 1.23456789, decimals: 4, expected: 1.2346 },
      { value: 1.5, decimals: 0, expected: 2 },
      { value: 1.4, decimals: 0, expected: 1 },
    ])('returns $expected for round($value, $decimals)', ({ value, decimals, expected }) => {
      // Access private method via type assertion
      const result = (blendingService as any).round(value, decimals)
      expect(result).toBe(expected)
    })

    it('defaults to 2 decimal places', () => {
      const result = (blendingService as any).round(1.23456)
      expect(result).toBe(1.23)
    })

    it('handles floating point precision issues', () => {
      // 0.1 + 0.2 = 0.30000000000000004 in JS
      const result = (blendingService as any).round(0.1 + 0.2, 2)
      expect(result).toBe(0.3)
    })
  })

  // ============================================================
  // parseNumeric()
  // ============================================================
  describe('parseNumeric', () => {
    describe('valid numeric inputs', () => {
      it.each([
        { input: 100, expected: 100 },
        { input: 0, expected: 0 },
        { input: -50, expected: -50 },
        { input: 1.5, expected: 1.5 },
        { input: '100', expected: 100 },
        { input: '1.5', expected: 1.5 },
        { input: '-50', expected: -50 },
      ])('parses $input to $expected', ({ input, expected }) => {
        const result = (blendingService as any).parseNumeric(input)
        expect(result).toBe(expected)
      })
    })

    describe('currency symbol handling', () => {
      it.each([
        { input: '$100', expected: 100 },
        { input: '$1,234.56', expected: 1234.56 },
        { input: '€100', expected: 100 },
        { input: '£1,000', expected: 1000 },
        { input: '¥50000', expected: 50000 },
      ])('strips currency symbol from $input', ({ input, expected }) => {
        const result = (blendingService as any).parseNumeric(input)
        expect(result).toBe(expected)
      })
    })

    describe('comma handling', () => {
      it.each([
        { input: '1,000', expected: 1000 },
        { input: '1,000,000', expected: 1000000 },
        { input: '1,234.56', expected: 1234.56 },
      ])('removes commas from $input', ({ input, expected }) => {
        const result = (blendingService as any).parseNumeric(input)
        expect(result).toBe(expected)
      })
    })

    describe('null/undefined/empty handling', () => {
      it.each([
        { input: null, expected: 0 },
        { input: undefined, expected: 0 },
        { input: '', expected: 0 },
      ])('returns 0 for $input', ({ input, expected }) => {
        const result = (blendingService as any).parseNumeric(input)
        expect(result).toBe(expected)
      })
    })

    describe('invalid input handling', () => {
      it.each([
        { input: 'abc', expected: 0 },
        { input: 'N/A', expected: 0 },
        { input: 'NaN', expected: 0 },
        { input: {}, expected: 0 },
        { input: [], expected: 0 },
      ])('returns 0 for invalid input $input', ({ input, expected }) => {
        const result = (blendingService as any).parseNumeric(input)
        expect(result).toBe(expected)
      })
    })

    it('handles whitespace', () => {
      const result = (blendingService as any).parseNumeric('  100  ')
      expect(result).toBe(100)
    })

    it('handles scientific notation', () => {
      const result = (blendingService as any).parseNumeric('1e3')
      expect(result).toBe(1000)
    })
  })

  // ============================================================
  // normalizeDate()
  // ============================================================
  describe('normalizeDate', () => {
    describe('YYYY-MM-DD format (standard)', () => {
      it.each([
        '2024-01-01',
        '2024-12-31',
        '2023-06-15',
      ])('preserves valid YYYY-MM-DD: %s', (date) => {
        const result = (blendingService as any).normalizeDate(date)
        expect(result).toBe(date)
      })
    })

    describe('YYYYMMDD format (GA4)', () => {
      it.each([
        { input: '20240101', expected: '2024-01-01' },
        { input: '20241231', expected: '2024-12-31' },
        { input: '20230615', expected: '2023-06-15' },
      ])('converts GA4 format $input to $expected', ({ input, expected }) => {
        const result = (blendingService as any).normalizeDate(input)
        expect(result).toBe(expected)
      })
    })

    describe('ISO format parsing', () => {
      it('parses ISO timestamp to date only', () => {
        const result = (blendingService as any).normalizeDate('2024-01-15T10:30:00Z')
        expect(result).toBe('2024-01-15')
      })

      it('parses ISO timestamp with timezone', () => {
        const result = (blendingService as any).normalizeDate('2024-01-15T10:30:00+05:00')
        expect(result).toBe('2024-01-15')
      })
    })

    describe('null/undefined handling', () => {
      it.each([
        { input: null, expected: null },
        { input: undefined, expected: null },
        { input: '', expected: null },
      ])('returns null for $input', ({ input, expected }) => {
        const result = (blendingService as any).normalizeDate(input)
        expect(result).toBe(expected)
      })
    })

    describe('unparseable dates', () => {
      it('returns input as string for unparseable dates', () => {
        const result = (blendingService as any).normalizeDate('not-a-date')
        expect(result).toBe('not-a-date')
      })

      it('handles numeric input', () => {
        const result = (blendingService as any).normalizeDate(12345)
        expect(typeof result).toBe('string')
      })
    })
  })

  // ============================================================
  // calculateCTR()
  // ============================================================
  describe('calculateCTR', () => {
    it.each([
      { impressions: 1000, clicks: 50, expected: 5.0 },
      { impressions: 1000, clicks: 1, expected: 0.1 },
      { impressions: 100000, clicks: 2500, expected: 2.5 },
      { impressions: 500, clicks: 500, expected: 100.0 },
    ])('calculates CTR of $expected% for $clicks clicks / $impressions impressions',
      ({ impressions, clicks, expected }) => {
        const result = (blendingService as any).calculateCTR({ impressions, clicks })
        expect(result).toBe(expected)
      }
    )

    describe('zero division protection', () => {
      it('returns 0 when impressions is 0', () => {
        const result = (blendingService as any).calculateCTR({ impressions: 0, clicks: 10 })
        expect(result).toBe(0)
      })

      it('returns 0 when both are 0', () => {
        const result = (blendingService as any).calculateCTR({ impressions: 0, clicks: 0 })
        expect(result).toBe(0)
      })
    })

    describe('null/undefined handling', () => {
      it.each([
        { impressions: null, clicks: 10 },
        { impressions: undefined, clicks: 10 },
        { impressions: 1000, clicks: null },
        { impressions: null, clicks: null },
      ])('returns 0 when impressions=$impressions, clicks=$clicks', ({ impressions, clicks }) => {
        const result = (blendingService as any).calculateCTR({ impressions, clicks })
        expect(result).toBe(0)
      })
    })

    it('handles string numeric values', () => {
      const result = (blendingService as any).calculateCTR({ impressions: '1000', clicks: '50' })
      expect(result).toBe(5.0)
    })

    it('rounds to 2 decimal places', () => {
      const result = (blendingService as any).calculateCTR({ impressions: 3, clicks: 1 })
      expect(result).toBe(33.33)
    })
  })

  // ============================================================
  // calculateCPC()
  // ============================================================
  describe('calculateCPC', () => {
    it.each([
      { spend: 100, clicks: 50, expected: 2.0 },
      { spend: 1000, clicks: 250, expected: 4.0 },
      { spend: 50, clicks: 100, expected: 0.5 },
      { spend: 123.45, clicks: 10, expected: 12.35 }, // rounds to 2 decimals
    ])('calculates CPC of $expected for $spend spend / $clicks clicks',
      ({ spend, clicks, expected }) => {
        const result = (blendingService as any).calculateCPC({ spend, clicks })
        expect(result).toBe(expected)
      }
    )

    describe('zero division protection', () => {
      it('returns 0 when clicks is 0', () => {
        const result = (blendingService as any).calculateCPC({ spend: 100, clicks: 0 })
        expect(result).toBe(0)
      })

      it('returns 0 when both are 0', () => {
        const result = (blendingService as any).calculateCPC({ spend: 0, clicks: 0 })
        expect(result).toBe(0)
      })
    })

    describe('null/undefined handling', () => {
      it.each([
        { spend: null, clicks: 10 },
        { spend: 100, clicks: null },
        { spend: null, clicks: null },
        { spend: undefined, clicks: undefined },
      ])('returns 0 when spend=$spend, clicks=$clicks', ({ spend, clicks }) => {
        const result = (blendingService as any).calculateCPC({ spend, clicks })
        expect(result).toBe(0)
      })
    })

    it('handles currency string values', () => {
      const result = (blendingService as any).calculateCPC({ spend: '$100', clicks: '50' })
      expect(result).toBe(2.0)
    })
  })

  // ============================================================
  // normalizeValue()
  // ============================================================
  describe('normalizeValue', () => {
    it('trims whitespace from string values', () => {
      const result = (blendingService as any).normalizeValue('  hello  ', 'dimension', 'campaign_name')
      expect(result).toBe('hello')
    })

    it('normalizes date fields', () => {
      const result = (blendingService as any).normalizeValue('20240115', 'dimension', 'date')
      expect(result).toBe('2024-01-15')
    })

    it('normalizes fields with "date" in name', () => {
      const result = (blendingService as any).normalizeValue('20240115', 'dimension', 'start_date')
      expect(result).toBe('2024-01-15')
    })

    it('returns null for null/undefined input', () => {
      expect((blendingService as any).normalizeValue(null, 'dimension', 'name')).toBe(null)
      expect((blendingService as any).normalizeValue(undefined, 'dimension', 'name')).toBe(null)
    })

    it('returns non-string values unchanged', () => {
      const result = (blendingService as any).normalizeValue(12345, 'metric', 'impressions')
      expect(result).toBe(12345)
    })
  })

  // ============================================================
  // harmonizeRow()
  // ============================================================
  describe('harmonizeRow', () => {
    describe('Meta Ads platform', () => {
      const metaAdsRow = {
        date_start: '2024-01-15',
        campaign_name: 'Test Campaign',
        campaign_id: 'camp_123',
        adset_name: 'Test Ad Set',
        impressions: 10000,
        link_clicks: 500,
        spend: 250.50,
        conversions: 25,
      }

      it('maps Meta Ads fields to canonical names', () => {
        const result = blendingService.harmonizeRow(metaAdsRow, 'meta_ads')

        expect(result.source_platform).toBe('meta_ads')
        expect(result.date).toBe('2024-01-15')
        expect(result.campaign_name).toBe('Test Campaign')
        expect(result.ad_group_name).toBe('Test Ad Set')
        expect(result.impressions).toBe(10000)
        expect(result.clicks).toBe(500)
        expect(result.spend).toBe(250.50)
      })

      it('calculates derived metrics', () => {
        const result = blendingService.harmonizeRow(metaAdsRow, 'meta_ads')

        expect(result.ctr).toBe(5.0) // 500/10000 * 100
        expect(result.cpc).toBe(0.5) // 250.50/500, rounded to 0.50
      })
    })

    describe('Google Ads platform', () => {
      const googleAdsRow = {
        'segments.date': '2024-01-15',
        'campaign.name': 'Google Campaign',
        'metrics.impressions': 5000,
        'metrics.clicks': 100,
        'metrics.cost_micros': 50000000, // $50 in micros
      }

      it('maps Google Ads fields and applies transformations', () => {
        const result = blendingService.harmonizeRow(googleAdsRow, 'google_ads')

        expect(result.source_platform).toBe('google_ads')
        expect(result.campaign_name).toBe('Google Campaign')
        expect(result.impressions).toBe(5000)
        expect(result.clicks).toBe(100)
        expect(result.spend).toBe(50) // micros converted
      })
    })

    describe('GA4 platform', () => {
      const ga4Row = {
        date: '20240115', // GA4 YYYYMMDD format
        sessionCampaignName: 'GA4 Campaign',
        sessions: 1000,
        activeUsers: 800,
        conversions: 50,
      }

      it('maps GA4 fields and normalizes date', () => {
        const result = blendingService.harmonizeRow(ga4Row, 'ga4')

        expect(result.source_platform).toBe('ga4')
        expect(result.date).toBe('2024-01-15') // normalized
        expect(result.campaign_name).toBe('GA4 Campaign')
      })
    })

    describe('error handling', () => {
      it('throws for unknown platform', () => {
        expect(() => {
          blendingService.harmonizeRow({}, 'unknown_platform')
        }).toThrow('No mapping found for platform: unknown_platform')
      })
    })

    describe('missing/null field handling', () => {
      it('skips undefined fields', () => {
        const result = blendingService.harmonizeRow({ date_start: '2024-01-15' }, 'meta_ads')

        expect(result.date).toBe('2024-01-15')
        expect(result.campaign_name).toBeUndefined()
      })

      it('skips null fields', () => {
        const result = blendingService.harmonizeRow({
          date_start: '2024-01-15',
          campaign_name: null
        }, 'meta_ads')

        expect(result.campaign_name).toBeUndefined()
      })

      it('skips empty string fields', () => {
        const result = blendingService.harmonizeRow({
          date_start: '2024-01-15',
          campaign_name: ''
        }, 'meta_ads')

        expect(result.campaign_name).toBeUndefined()
      })
    })
  })

  // ============================================================
  // harmonizeDataset()
  // ============================================================
  describe('harmonizeDataset', () => {
    it('harmonizes all rows in dataset', () => {
      const dataset = [
        { date_start: '2024-01-15', campaign_name: 'Campaign 1', impressions: 1000 },
        { date_start: '2024-01-16', campaign_name: 'Campaign 2', impressions: 2000 },
      ]

      const result = blendingService.harmonizeDataset(dataset, 'meta_ads')

      expect(result).toHaveLength(2)
      expect(result[0].source_platform).toBe('meta_ads')
      expect(result[1].source_platform).toBe('meta_ads')
    })

    it('returns empty array for empty input', () => {
      const result = blendingService.harmonizeDataset([], 'meta_ads')
      expect(result).toEqual([])
    })
  })

  // ============================================================
  // blendSources()
  // ============================================================
  describe('blendSources', () => {
    const metaSource = {
      platformId: 'meta_ads',
      data: [
        { date_start: '2024-01-15', campaign_name: 'Meta Campaign', impressions: 1000, link_clicks: 50 },
      ],
    }

    const googleSource = {
      platformId: 'google_ads',
      data: [
        { 'segments.date': '2024-01-15', 'campaign.name': 'Google Campaign', 'metrics.impressions': 2000, 'metrics.clicks': 100 },
      ],
    }

    it('blends data from multiple platforms', () => {
      const result = blendingService.blendSources([metaSource, googleSource])

      expect(result).toHaveLength(2)
      expect(result.some(r => r.source_platform === 'meta_ads')).toBe(true)
      expect(result.some(r => r.source_platform === 'google_ads')).toBe(true)
    })

    it('sorts by date, then platform', () => {
      const sources = [
        { platformId: 'meta_ads', data: [{ date_start: '2024-01-16', impressions: 100 }] },
        { platformId: 'google_ads', data: [{ 'segments.date': '2024-01-15', 'metrics.impressions': 200 }] },
        { platformId: 'meta_ads', data: [{ date_start: '2024-01-15', impressions: 300 }] },
      ]

      const result = blendingService.blendSources(sources)

      expect(result[0].date).toBe('2024-01-15')
      expect(result[0].source_platform).toBe('google_ads') // g comes before m
      expect(result[1].date).toBe('2024-01-15')
      expect(result[1].source_platform).toBe('meta_ads')
      expect(result[2].date).toBe('2024-01-16')
    })

    it('skips sources with empty data', () => {
      const sources = [
        metaSource,
        { platformId: 'google_ads', data: [] },
        { platformId: 'tiktok_ads', data: null },
      ]

      const result = blendingService.blendSources(sources)

      expect(result).toHaveLength(1)
      expect(result[0].source_platform).toBe('meta_ads')
    })

    it('returns empty array for no sources', () => {
      expect(blendingService.blendSources([])).toEqual([])
    })

    it('returns empty array when all sources are empty', () => {
      const sources = [
        { platformId: 'meta_ads', data: [] },
        { platformId: 'google_ads', data: null },
      ]

      expect(blendingService.blendSources(sources)).toEqual([])
    })
  })

  // ============================================================
  // aggregateData()
  // ============================================================
  describe('aggregateData', () => {
    const blendedData = [
      { date: '2024-01-15', source_platform: 'meta_ads', impressions: 1000, clicks: 50, spend: 100, conversions: 10, revenue: 500 },
      { date: '2024-01-15', source_platform: 'meta_ads', impressions: 2000, clicks: 100, spend: 200, conversions: 20, revenue: 1000 },
      { date: '2024-01-16', source_platform: 'meta_ads', impressions: 1500, clicks: 75, spend: 150, conversions: 15, revenue: 750 },
      { date: '2024-01-15', source_platform: 'google_ads', impressions: 500, clicks: 25, spend: 50, conversions: 5, revenue: 250 },
    ]

    it('aggregates by default dimensions (date, source_platform)', () => {
      const result = blendingService.aggregateData(blendedData)

      expect(result).toHaveLength(3) // 2 meta dates + 1 google date

      // Find aggregated meta_ads for 2024-01-15
      const meta15 = result.find(r => r.date === '2024-01-15' && r.source_platform === 'meta_ads')
      expect(meta15).toBeDefined()
      expect(meta15?.impressions).toBe(3000) // 1000 + 2000
      expect(meta15?.clicks).toBe(150) // 50 + 100
      expect(meta15?.spend).toBe(300) // 100 + 200
    })

    it('calculates derived metrics after aggregation', () => {
      const result = blendingService.aggregateData(blendedData)

      const meta15 = result.find(r => r.date === '2024-01-15' && r.source_platform === 'meta_ads')
      expect(meta15?.ctr).toBe(5.0) // 150/3000 * 100
      expect(meta15?.cpc).toBe(2.0) // 300/150
    })

    it('rounds metrics appropriately', () => {
      const data = [
        { date: '2024-01-15', source_platform: 'test', impressions: 3, clicks: 1, spend: 10.333, conversions: 0.5, revenue: 1.234 },
      ]

      const result = blendingService.aggregateData(data)

      expect(result[0].impressions).toBe(3) // integer
      expect(result[0].clicks).toBe(1) // integer
      expect(result[0].spend).toBe(10.33) // 2 decimals
      expect(result[0].conversions).toBe(0.5) // 2 decimals
      expect(result[0].revenue).toBe(1.23) // 2 decimals
    })

    it('supports custom groupBy dimensions', () => {
      const result = blendingService.aggregateData(blendedData, ['date'])

      // Should group by date only, ignoring platform
      expect(result).toHaveLength(2) // 2 unique dates

      const jan15 = result.find(r => r.date === '2024-01-15')
      expect(jan15?.impressions).toBe(3500) // 1000 + 2000 + 500
    })

    it('handles missing dimension values with "(none)"', () => {
      const data = [
        { source_platform: 'meta_ads', impressions: 100 },
        { source_platform: 'meta_ads', impressions: 200 },
      ]

      const result = blendingService.aggregateData(data, ['date', 'source_platform'])

      expect(result).toHaveLength(1)
      expect(result[0].date).toBeUndefined()
    })

    it('handles empty input', () => {
      expect(blendingService.aggregateData([])).toEqual([])
    })
  })

  // ============================================================
  // getSummaryStats()
  // ============================================================
  describe('getSummaryStats', () => {
    const blendedData = [
      { date: '2024-01-15', source_platform: 'meta_ads', impressions: 1000, clicks: 50, spend: 100, conversions: 10, revenue: 500 },
      { date: '2024-01-17', source_platform: 'google_ads', impressions: 2000, clicks: 100, spend: 200, conversions: 20, revenue: 1000 },
      { date: '2024-01-16', source_platform: 'meta_ads', impressions: 1500, clicks: 75, spend: 150, conversions: 15, revenue: 750 },
    ]

    it('returns correct total row count', () => {
      const result = blendingService.getSummaryStats(blendedData)
      expect(result.totalRows).toBe(3)
    })

    it('tracks date range correctly', () => {
      const result = blendingService.getSummaryStats(blendedData)
      expect(result.dateRange.start).toBe('2024-01-15')
      expect(result.dateRange.end).toBe('2024-01-17')
    })

    it('identifies all platforms', () => {
      const result = blendingService.getSummaryStats(blendedData)
      expect(result.platforms).toContain('meta_ads')
      expect(result.platforms).toContain('google_ads')
      expect(result.platforms).toHaveLength(2)
    })

    it('calculates metric totals', () => {
      const result = blendingService.getSummaryStats(blendedData)

      expect(result.totals.impressions).toBe(4500) // 1000 + 2000 + 1500
      expect(result.totals.clicks).toBe(225) // 50 + 100 + 75
      expect(result.totals.spend).toBe(450) // 100 + 200 + 150
      expect(result.totals.conversions).toBe(45)
      expect(result.totals.revenue).toBe(2250)
    })

    it('calculates derived totals (CTR, CPC, ROAS)', () => {
      const result = blendingService.getSummaryStats(blendedData)

      expect(result.totals.ctr).toBe(5.0) // 225/4500 * 100
      expect(result.totals.cpc).toBe(2.0) // 450/225
      expect(result.totals.roas).toBe(5.0) // 2250/450
    })

    it('handles zero spend for ROAS', () => {
      const data = [{ impressions: 100, clicks: 10, spend: 0, revenue: 500 }]
      const result = blendingService.getSummaryStats(data)
      expect(result.totals.roas).toBe(0)
    })

    it('handles empty dataset', () => {
      const result = blendingService.getSummaryStats([])

      expect(result.totalRows).toBe(0)
      expect(result.dateRange.start).toBeNull()
      expect(result.dateRange.end).toBeNull()
      expect(result.platforms).toEqual([])
      expect(result.totals.impressions).toBe(0)
    })

    it('handles rows with missing metrics', () => {
      const data = [
        { date: '2024-01-15', source_platform: 'meta_ads', impressions: 1000 },
        { date: '2024-01-16', source_platform: 'meta_ads', clicks: 50, spend: 100 },
      ]

      const result = blendingService.getSummaryStats(data)

      expect(result.totals.impressions).toBe(1000)
      expect(result.totals.clicks).toBe(50)
      expect(result.totals.spend).toBe(100)
    })
  })

  // ============================================================
  // getBlendedSchema()
  // ============================================================
  describe('getBlendedSchema', () => {
    it('returns a copy of BLENDED_COLUMNS', () => {
      const schema = blendingService.getBlendedSchema()

      expect(schema).toEqual(BLENDED_COLUMNS)
      // Ensure it's a copy, not the same reference
      expect(schema).not.toBe(BLENDED_COLUMNS)
    })

    it('includes required dimensions', () => {
      const schema = blendingService.getBlendedSchema()

      expect(schema.date.type).toBe('dimension')
      expect(schema.date.required).toBe(true)
      expect(schema.source_platform.type).toBe('meta')
    })

    it('includes derived metrics', () => {
      const schema = blendingService.getBlendedSchema()

      expect(schema.ctr.derived).toBe(true)
      expect(schema.cpc.derived).toBe(true)
    })
  })

  // ============================================================
  // Integration scenarios
  // ============================================================
  describe('integration scenarios', () => {
    it('full pipeline: blend -> aggregate -> stats', () => {
      const sources = [
        {
          platformId: 'meta_ads',
          data: [
            { date_start: '2024-01-15', campaign_name: 'Campaign A', impressions: 10000, link_clicks: 500, spend: 250 },
            { date_start: '2024-01-15', campaign_name: 'Campaign B', impressions: 5000, link_clicks: 200, spend: 100 },
          ],
        },
        {
          platformId: 'google_ads',
          data: [
            { 'segments.date': '2024-01-15', 'campaign.name': 'Campaign C', 'metrics.impressions': 8000, 'metrics.clicks': 400, 'metrics.cost_micros': 200000000 },
          ],
        },
      ]

      // Step 1: Blend
      const blended = blendingService.blendSources(sources)
      expect(blended).toHaveLength(3)

      // Step 2: Aggregate by date only
      const aggregated = blendingService.aggregateData(blended, ['date'])
      expect(aggregated).toHaveLength(1)
      expect(aggregated[0].impressions).toBe(23000) // 10000 + 5000 + 8000
      expect(aggregated[0].spend).toBe(550) // 250 + 100 + 200

      // Step 3: Get stats
      const stats = blendingService.getSummaryStats(blended)
      expect(stats.totalRows).toBe(3)
      expect(stats.platforms).toContain('meta_ads')
      expect(stats.platforms).toContain('google_ads')
    })

    it('handles real-world currency values', () => {
      const data = [
        { impressions: '$1,234', clicks: '567', spend: '$89.99' },
      ]

      // parseNumeric is called during aggregation
      const result = blendingService.aggregateData([
        { date: '2024-01-15', source_platform: 'test', ...data[0] }
      ])

      expect(result[0].impressions).toBe(1234)
      expect(result[0].clicks).toBe(567)
      expect(result[0].spend).toBe(89.99)
    })
  })
})
