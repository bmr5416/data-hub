/**
 * ReportService Unit Tests
 *
 * Comprehensive tests for server/services/reportService.js
 * Covers metric calculations, scheduling, filtering, and export generation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DateTime, Settings } from 'luxon'

// Mock supabaseService before importing reportService
vi.mock('../../../server/services/supabase.js', () => ({
  supabaseService: {
    getEnhancedReport: vi.fn(),
    getClient: vi.fn(),
    getWarehouseById: vi.fn(),
    getPlatformData: vi.fn(),
    getPlatformDataByDateRange: vi.fn(),
    createReportDeliveryHistory: vi.fn(),
    updateReportDeliveryHistory: vi.fn(),
    updateEnhancedReport: vi.fn(),
    getScheduledJobByEntity: vi.fn(),
    createScheduledJob: vi.fn(),
    updateScheduledJob: vi.fn(),
    deleteScheduledJobByEntity: vi.fn(),
  },
}))

vi.mock('../../../server/services/pdfService.js', () => ({
  pdfService: {
    generateReportPDF: vi.fn(),
  },
}))

vi.mock('../../../server/services/emailService.js', () => ({
  emailService: {
    sendReportEmail: vi.fn(),
  },
}))

vi.mock('../../../server/utils/logger.js', () => ({
  default: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}))

import { reportService } from '../../../server/services/reportService.js'

describe('ReportService', () => {
  // Store original DateTime.now for restoration
  let originalNow: typeof DateTime.now

  beforeEach(() => {
    vi.clearAllMocks()
    // Store original now function
    originalNow = DateTime.now
  })

  afterEach(() => {
    vi.resetAllMocks()
    // Restore original now function
    DateTime.now = originalNow
    Settings.defaultZone = 'system'
  })

  // Helper to mock current time
  const mockNow = (isoDate: string) => {
    const fixedNow = DateTime.fromISO(isoDate)
    DateTime.now = () => fixedNow
  }

  // ============================================================
  // calculateMetricValue()
  // ============================================================
  describe('calculateMetricValue', () => {
    it('sums numeric values across platforms', () => {
      const platformData = {
        meta_ads: [
          { rowData: { spend: 100 } },
          { rowData: { spend: 200 } },
        ],
        google_ads: [
          { rowData: { spend: 150 } },
        ],
      }

      const result = (reportService as any).calculateMetricValue('spend', platformData)
      expect(result).toBe(450)
    })

    it('parses string numeric values', () => {
      const platformData = {
        meta_ads: [
          { rowData: { spend: '$100.50' } },
          { rowData: { spend: '200' } },
        ],
      }

      const result = (reportService as any).calculateMetricValue('spend', platformData)
      expect(result).toBe(300.5)
    })

    it('returns 0 for missing metric', () => {
      const platformData = {
        meta_ads: [
          { rowData: { impressions: 1000 } },
        ],
      }

      const result = (reportService as any).calculateMetricValue('spend', platformData)
      expect(result).toBe(0)
    })

    it('returns 0 for null metric', () => {
      const result = (reportService as any).calculateMetricValue(null, {})
      expect(result).toBe(0)
    })

    it('returns average for rate metrics (roas, ctr, cpc, cpm)', () => {
      const platformData = {
        meta_ads: [
          { rowData: { roas: 4.0 } },
          { rowData: { roas: 6.0 } },
        ],
      }

      const result = (reportService as any).calculateMetricValue('roas', platformData)
      expect(result).toBe(5.0) // average, not sum
    })

    it.each(['roas', 'ctr', 'cpc', 'cpm', 'conversion_rate'])(
      'averages %s instead of summing',
      (metric) => {
        const platformData = {
          meta_ads: [
            { rowData: { [metric]: 10 } },
            { rowData: { [metric]: 20 } },
          ],
        }

        const result = (reportService as any).calculateMetricValue(metric, platformData)
        expect(result).toBe(15) // average
      }
    )

    it('handles empty platform data', () => {
      const result = (reportService as any).calculateMetricValue('spend', {})
      expect(result).toBe(0)
    })

    it('handles empty arrays', () => {
      const platformData = {
        meta_ads: [],
      }

      const result = (reportService as any).calculateMetricValue('spend', platformData)
      expect(result).toBe(0)
    })
  })

  // ============================================================
  // calculateTrend()
  // ============================================================
  describe('calculateTrend', () => {
    it.each([
      { current: 150, previous: 100, expected: 50 }, // 50% increase
      { current: 50, previous: 100, expected: -50 }, // 50% decrease
      { current: 100, previous: 100, expected: 0 }, // no change
      { current: 200, previous: 50, expected: 300 }, // 300% increase
      { current: 10, previous: 100, expected: -90 }, // 90% decrease
    ])('returns $expected% for current=$current, previous=$previous',
      ({ current, previous, expected }) => {
        const result = (reportService as any).calculateTrend(current, previous)
        expect(result).toBe(expected)
      }
    )

    it('returns null when previous is 0', () => {
      const result = (reportService as any).calculateTrend(100, 0)
      expect(result).toBeNull()
    })

    it('returns null when previous is null', () => {
      const result = (reportService as any).calculateTrend(100, null)
      expect(result).toBeNull()
    })

    it('returns null when previous is undefined', () => {
      const result = (reportService as any).calculateTrend(100, undefined)
      expect(result).toBeNull()
    })

    it('handles decimal values', () => {
      const result = (reportService as any).calculateTrend(1.5, 1.0)
      expect(result).toBe(50)
    })
  })

  // ============================================================
  // formatValue()
  // ============================================================
  describe('formatValue', () => {
    describe('currency format', () => {
      it('formats as USD currency', () => {
        const result = (reportService as any).formatValue(1234.56, 'currency')
        expect(result).toBe('$1,235') // rounded, no decimals
      })

      it('handles zero', () => {
        const result = (reportService as any).formatValue(0, 'currency')
        expect(result).toBe('$0')
      })

      it('handles large numbers', () => {
        const result = (reportService as any).formatValue(1234567, 'currency')
        expect(result).toBe('$1,234,567')
      })
    })

    describe('percentage format', () => {
      it('converts to percentage', () => {
        const result = (reportService as any).formatValue(0.5, 'percentage')
        expect(result).toBe('50.0%')
      })

      it('handles small decimals', () => {
        const result = (reportService as any).formatValue(0.0325, 'percentage')
        expect(result).toBe('3.3%')
      })
    })

    describe('decimal format', () => {
      it('formats with 2 decimal places', () => {
        const result = (reportService as any).formatValue(1234.5678, 'decimal')
        expect(result).toBe('1,234.57')
      })
    })

    describe('compact format', () => {
      it('compacts large numbers', () => {
        const result = (reportService as any).formatValue(1500000, 'compact')
        expect(result).toBe('1.5M')
      })

      it('compacts thousands', () => {
        const result = (reportService as any).formatValue(5500, 'compact')
        expect(result).toBe('5.5K')
      })
    })

    describe('number format (default)', () => {
      it('formats with thousands separator', () => {
        const result = (reportService as any).formatValue(1234567, 'number')
        expect(result).toBe('1,234,567')
      })

      it('uses number format by default', () => {
        const result = (reportService as any).formatValue(1234567)
        expect(result).toBe('1,234,567')
      })
    })

    describe('null/undefined handling', () => {
      it('returns dash for null', () => {
        const result = (reportService as any).formatValue(null, 'currency')
        expect(result).toBe('-')
      })

      it('returns dash for undefined', () => {
        const result = (reportService as any).formatValue(undefined, 'number')
        expect(result).toBe('-')
      })
    })
  })

  // ============================================================
  // calculatePreviousPeriodDates()
  // ============================================================
  describe('calculatePreviousPeriodDates', () => {
    beforeEach(() => {
      // Fix time to 2024-01-20 12:00:00
      mockNow('2024-01-20T12:00:00')
    })

    describe('week over week (wow)', () => {
      it('returns previous week date range', () => {
        const result = (reportService as any).calculatePreviousPeriodDates('wow')

        expect(result.startDate).toBe('2024-01-07')
        expect(result.endDate).toBe('2024-01-13')
      })
    })

    describe('month over month (mom)', () => {
      it('returns previous month date range', () => {
        const result = (reportService as any).calculatePreviousPeriodDates('mom')

        expect(result.startDate).toBe('2023-12-01')
        expect(result.endDate).toBe('2023-12-31')
      })
    })

    describe('year over year (yoy)', () => {
      it('returns same period last year', () => {
        const result = (reportService as any).calculatePreviousPeriodDates('yoy')

        // YOY logic: endDate = now - 1 year, startDate = endDate - 6 days
        // now = 2024-01-20, so endDate = 2023-01-20, startDate = 2023-01-14
        expect(result.startDate).toBe('2023-01-14')
        expect(result.endDate).toBe('2023-01-20')
      })
    })

    describe('default behavior', () => {
      it('defaults to wow for unknown period', () => {
        const result = (reportService as any).calculatePreviousPeriodDates('unknown')

        expect(result.startDate).toBe('2024-01-07')
        expect(result.endDate).toBe('2024-01-13')
      })
    })
  })

  // ============================================================
  // calculateDateRange()
  // ============================================================
  describe('calculateDateRange', () => {
    beforeEach(() => {
      // Fix time to 2024-01-20 12:00:00
      mockNow('2024-01-20T12:00:00')
    })

    describe('custom range', () => {
      it('uses provided custom dates', () => {
        const result = (reportService as any).calculateDateRange(
          'custom',
          '2024-01-01',
          '2024-01-15'
        )

        expect(result.startDate).toBe('2024-01-01')
        expect(result.endDate).toBe('2024-01-15')
      })
    })

    describe('preset ranges', () => {
      it.each([
        { range: 'last_7_days', expectedStart: '2024-01-13', expectedEnd: '2024-01-20' },
        { range: 'last_14_days', expectedStart: '2024-01-06', expectedEnd: '2024-01-20' },
        { range: 'last_30_days', expectedStart: '2023-12-21', expectedEnd: '2024-01-20' },
        { range: 'last_90_days', expectedStart: '2023-10-22', expectedEnd: '2024-01-20' },
      ])('$range returns correct dates', ({ range, expectedStart, expectedEnd }) => {
        const result = (reportService as any).calculateDateRange(range)

        expect(result.startDate).toBe(expectedStart)
        expect(result.endDate).toBe(expectedEnd)
      })

      it('this_month returns current month', () => {
        const result = (reportService as any).calculateDateRange('this_month')

        expect(result.startDate).toBe('2024-01-01')
        expect(result.endDate).toBe('2024-01-20')
      })

      it('last_month returns previous month', () => {
        const result = (reportService as any).calculateDateRange('last_month')

        expect(result.startDate).toBe('2023-12-01')
        expect(result.endDate).toBe('2023-12-31')
      })

      it('this_quarter returns current quarter', () => {
        const result = (reportService as any).calculateDateRange('this_quarter')

        expect(result.startDate).toBe('2024-01-01')
        expect(result.endDate).toBe('2024-01-20')
      })

      it('last_quarter returns previous quarter', () => {
        const result = (reportService as any).calculateDateRange('last_quarter')

        expect(result.startDate).toBe('2023-10-01')
        expect(result.endDate).toBe('2023-12-31')
      })

      it('this_year returns current year', () => {
        const result = (reportService as any).calculateDateRange('this_year')

        expect(result.startDate).toBe('2024-01-01')
        expect(result.endDate).toBe('2024-01-20')
      })
    })

    describe('default behavior', () => {
      it('defaults to last_30_days for unknown range', () => {
        const result = (reportService as any).calculateDateRange('unknown_range')

        expect(result.startDate).toBe('2023-12-21')
        expect(result.endDate).toBe('2024-01-20')
      })
    })
  })

  // ============================================================
  // getDayOfWeekNumber()
  // ============================================================
  describe('getDayOfWeekNumber', () => {
    it.each([
      { day: 'monday', expected: 1 },
      { day: 'tuesday', expected: 2 },
      { day: 'wednesday', expected: 3 },
      { day: 'thursday', expected: 4 },
      { day: 'friday', expected: 5 },
      { day: 'saturday', expected: 6 },
      { day: 'sunday', expected: 7 },
    ])('returns $expected for $day', ({ day, expected }) => {
      const result = (reportService as any).getDayOfWeekNumber(day)
      expect(result).toBe(expected)
    })

    it('handles uppercase', () => {
      const result = (reportService as any).getDayOfWeekNumber('MONDAY')
      expect(result).toBe(1)
    })

    it('handles mixed case', () => {
      const result = (reportService as any).getDayOfWeekNumber('Wednesday')
      expect(result).toBe(3)
    })

    it('defaults to 1 (Monday) for unknown day', () => {
      const result = (reportService as any).getDayOfWeekNumber('notaday')
      expect(result).toBe(1)
    })

    it('defaults to 1 for null/undefined', () => {
      expect((reportService as any).getDayOfWeekNumber(null)).toBe(1)
      expect((reportService as any).getDayOfWeekNumber(undefined)).toBe(1)
    })
  })

  // ============================================================
  // getDayOfWeekCron()
  // ============================================================
  describe('getDayOfWeekCron', () => {
    it.each([
      { day: 'sunday', expected: 0 },
      { day: 'monday', expected: 1 },
      { day: 'tuesday', expected: 2 },
      { day: 'wednesday', expected: 3 },
      { day: 'thursday', expected: 4 },
      { day: 'friday', expected: 5 },
      { day: 'saturday', expected: 6 },
    ])('returns $expected for $day', ({ day, expected }) => {
      const result = (reportService as any).getDayOfWeekCron(day)
      expect(result).toBe(expected)
    })

    it('handles uppercase', () => {
      const result = (reportService as any).getDayOfWeekCron('FRIDAY')
      expect(result).toBe(5)
    })

    it('defaults to 1 (Monday) for unknown day', () => {
      const result = (reportService as any).getDayOfWeekCron('notaday')
      expect(result).toBe(1)
    })
  })

  // ============================================================
  // applyFilters()
  // ============================================================
  describe('applyFilters', () => {
    const platformData = {
      meta_ads: [
        { rowData: { campaign_name: 'Brand Campaign', spend: 100 } },
        { rowData: { campaign_name: 'Performance Campaign', spend: 200 } },
        { rowData: { campaign_name: 'Remarketing Campaign', spend: 150 } },
      ],
    }

    it('returns unfiltered data when no filters', () => {
      const result = (reportService as any).applyFilters(platformData, [])
      expect(result.meta_ads).toHaveLength(3)
    })

    it('returns unfiltered data when filters is null', () => {
      const result = (reportService as any).applyFilters(platformData, null)
      expect(result.meta_ads).toHaveLength(3)
    })

    describe('equals operator', () => {
      it('filters by exact match (case insensitive)', () => {
        const filters = [{ field: 'campaign_name', operator: 'equals', value: 'brand campaign' }]
        const result = (reportService as any).applyFilters(platformData, filters)

        expect(result.meta_ads).toHaveLength(1)
        expect(result.meta_ads[0].rowData.campaign_name).toBe('Brand Campaign')
      })
    })

    describe('not_equals operator', () => {
      it('excludes exact matches', () => {
        const filters = [{ field: 'campaign_name', operator: 'not_equals', value: 'Brand Campaign' }]
        const result = (reportService as any).applyFilters(platformData, filters)

        expect(result.meta_ads).toHaveLength(2)
      })
    })

    describe('contains operator', () => {
      it('filters by substring match', () => {
        const filters = [{ field: 'campaign_name', operator: 'contains', value: 'Campaign' }]
        const result = (reportService as any).applyFilters(platformData, filters)

        expect(result.meta_ads).toHaveLength(3) // all contain 'Campaign'
      })

      it('is case insensitive', () => {
        const filters = [{ field: 'campaign_name', operator: 'contains', value: 'brand' }]
        const result = (reportService as any).applyFilters(platformData, filters)

        expect(result.meta_ads).toHaveLength(1)
      })
    })

    describe('starts_with operator', () => {
      it('filters by prefix match', () => {
        const filters = [{ field: 'campaign_name', operator: 'starts_with', value: 'per' }]
        const result = (reportService as any).applyFilters(platformData, filters)

        expect(result.meta_ads).toHaveLength(1)
        expect(result.meta_ads[0].rowData.campaign_name).toBe('Performance Campaign')
      })
    })

    describe('multiple filters (AND logic)', () => {
      it('applies all filters', () => {
        const filters = [
          { field: 'campaign_name', operator: 'contains', value: 'Campaign' },
          { field: 'campaign_name', operator: 'starts_with', value: 'Brand' },
        ]
        const result = (reportService as any).applyFilters(platformData, filters)

        expect(result.meta_ads).toHaveLength(1)
        expect(result.meta_ads[0].rowData.campaign_name).toBe('Brand Campaign')
      })
    })

    describe('missing field handling', () => {
      it('excludes rows with missing filter field', () => {
        const data = {
          meta_ads: [
            { rowData: { campaign_name: 'Test' } },
            { rowData: { other_field: 'Value' } }, // no campaign_name
          ],
        }
        const filters = [{ field: 'campaign_name', operator: 'contains', value: 'Test' }]
        const result = (reportService as any).applyFilters(data, filters)

        expect(result.meta_ads).toHaveLength(1)
      })
    })

    describe('unknown operator', () => {
      it('passes through with unknown operator', () => {
        const filters = [{ field: 'campaign_name', operator: 'unknown_op', value: 'Test' }]
        const result = (reportService as any).applyFilters(platformData, filters)

        expect(result.meta_ads).toHaveLength(3) // all pass through
      })
    })
  })

  // ============================================================
  // scheduleToCron()
  // ============================================================
  describe('scheduleToCron', () => {
    describe('daily schedule', () => {
      it('generates daily cron expression', () => {
        const config = { frequency: 'daily', time: '09:30' }
        const result = (reportService as any).scheduleToCron(config)

        expect(result).toBe('30 9 * * *')
      })

      it('defaults time to 09:00', () => {
        const config = { frequency: 'daily' }
        const result = (reportService as any).scheduleToCron(config)

        expect(result).toBe('0 9 * * *')
      })
    })

    describe('weekly schedule', () => {
      it.each([
        { day: 'monday', expectedCron: '0 9 * * 1' },
        { day: 'wednesday', expectedCron: '0 9 * * 3' },
        { day: 'friday', expectedCron: '0 9 * * 5' },
        { day: 'sunday', expectedCron: '0 9 * * 0' },
      ])('generates cron for $day', ({ day, expectedCron }) => {
        const config = { frequency: 'weekly', dayOfWeek: day, time: '09:00' }
        const result = (reportService as any).scheduleToCron(config)

        expect(result).toBe(expectedCron)
      })

      it('handles custom time', () => {
        const config = { frequency: 'weekly', dayOfWeek: 'tuesday', time: '14:30' }
        const result = (reportService as any).scheduleToCron(config)

        expect(result).toBe('30 14 * * 2')
      })
    })

    describe('monthly schedule', () => {
      it.each([
        { day: 1, expectedCron: '0 9 1 * *' },
        { day: 15, expectedCron: '0 9 15 * *' },
        { day: 28, expectedCron: '0 9 28 * *' },
      ])('generates cron for day $day', ({ day, expectedCron }) => {
        const config = { frequency: 'monthly', dayOfMonth: day, time: '09:00' }
        const result = (reportService as any).scheduleToCron(config)

        expect(result).toBe(expectedCron)
      })

      it('defaults to day 1', () => {
        const config = { frequency: 'monthly', time: '09:00' }
        const result = (reportService as any).scheduleToCron(config)

        expect(result).toBe('0 9 1 * *')
      })
    })

    describe('null handling', () => {
      it('returns null for null config', () => {
        const result = (reportService as any).scheduleToCron(null)
        expect(result).toBeNull()
      })

      it('returns null for unknown frequency', () => {
        const config = { frequency: 'unknown', time: '09:00' }
        const result = (reportService as any).scheduleToCron(config)

        expect(result).toBeNull()
      })
    })
  })

  // ============================================================
  // calculateNextRunTime()
  // ============================================================
  describe('calculateNextRunTime', () => {
    beforeEach(() => {
      // Fix time to Saturday 2024-01-20 10:00:00 America/New_York
      mockNow('2024-01-20T10:00:00-05:00')
      Settings.defaultZone = 'America/New_York'
    })

    describe('daily schedule', () => {
      it('returns today if time has not passed', () => {
        const config = { frequency: 'daily', time: '14:00', timezone: 'America/New_York' }
        const result = (reportService as any).calculateNextRunTime(config)

        expect(result).toContain('2024-01-20')
        expect(result).toContain('14:00')
      })

      it('returns tomorrow if time has passed', () => {
        const config = { frequency: 'daily', time: '08:00', timezone: 'America/New_York' }
        const result = (reportService as any).calculateNextRunTime(config)

        expect(result).toContain('2024-01-21')
      })
    })

    describe('weekly schedule', () => {
      // Current day is Saturday (2024-01-20)
      it('returns next occurrence of target day', () => {
        const config = { frequency: 'weekly', dayOfWeek: 'monday', time: '09:00', timezone: 'America/New_York' }
        const result = (reportService as any).calculateNextRunTime(config)

        expect(result).toContain('2024-01-22') // next Monday
      })

      it('returns next week when on same day (weekly always advances)', () => {
        const config = { frequency: 'weekly', dayOfWeek: 'saturday', time: '14:00', timezone: 'America/New_York' }
        const result = (reportService as any).calculateNextRunTime(config)

        // Weekly logic: daysUntil = targetDay - currentDay = 0, then += 7
        // So it always goes to next occurrence of that day
        expect(result).toContain('2024-01-27')
      })
    })

    describe('monthly schedule', () => {
      it('returns this month if day has not passed', () => {
        const config = { frequency: 'monthly', dayOfMonth: 25, time: '09:00', timezone: 'America/New_York' }
        const result = (reportService as any).calculateNextRunTime(config)

        expect(result).toContain('2024-01-25')
      })

      it('returns next month if day has passed', () => {
        const config = { frequency: 'monthly', dayOfMonth: 15, time: '09:00', timezone: 'America/New_York' }
        const result = (reportService as any).calculateNextRunTime(config)

        expect(result).toContain('2024-02-15')
      })
    })

    describe('null handling', () => {
      it('returns null for null config', () => {
        const result = (reportService as any).calculateNextRunTime(null)
        expect(result).toBeNull()
      })

      it('returns null for unknown frequency', () => {
        const config = { frequency: 'unknown' }
        const result = (reportService as any).calculateNextRunTime(config)

        expect(result).toBeNull()
      })
    })

    describe('default timezone', () => {
      it('uses America/New_York by default', () => {
        const config = { frequency: 'daily', time: '09:00' }
        const result = (reportService as any).calculateNextRunTime(config)

        expect(result).toContain('-05:00') // EST offset
      })
    })
  })

  // ============================================================
  // aggregateChartData()
  // ============================================================
  describe('aggregateChartData', () => {
    const platformData = {
      meta_ads: [
        { rowData: { campaign_name: 'Campaign A', spend: 100, impressions: 1000 } },
        { rowData: { campaign_name: 'Campaign A', spend: 50, impressions: 500 } },
        { rowData: { campaign_name: 'Campaign B', spend: 200, impressions: 2000 } },
      ],
      google_ads: [
        { rowData: { campaign_name: 'Campaign C', spend: 150, impressions: 1500 } },
      ],
    }

    it('aggregates by x-axis dimension', () => {
      const viz = { config: { xAxis: 'campaign_name', yAxis: 'spend' } }
      const result = (reportService as any).aggregateChartData(viz, platformData)

      expect(result).toHaveLength(3)

      const campaignA = result.find((d: any) => d.campaign_name === 'Campaign A')
      expect(campaignA.spend).toBe(150) // 100 + 50
    })

    it('handles multiple y-axis metrics', () => {
      const viz = { config: { xAxis: 'campaign_name', yAxis: ['spend', 'impressions'] } }
      const result = (reportService as any).aggregateChartData(viz, platformData)

      const campaignA = result.find((d: any) => d.campaign_name === 'Campaign A')
      expect(campaignA.spend).toBe(150)
      expect(campaignA.impressions).toBe(1500) // 1000 + 500
    })

    it('uses platformId when x-axis field is missing', () => {
      const data = {
        meta_ads: [{ rowData: { spend: 100 } }],
        google_ads: [{ rowData: { spend: 200 } }],
      }
      const viz = { config: { xAxis: 'campaign_name', yAxis: 'spend' } }
      const result = (reportService as any).aggregateChartData(viz, data)

      expect(result).toHaveLength(2)
      expect(result.some((d: any) => d.campaign_name === 'meta_ads')).toBe(true)
    })

    it('returns empty array for missing config', () => {
      const viz = { config: {} }
      const result = (reportService as any).aggregateChartData(viz, platformData)

      expect(result).toEqual([])
    })
  })

  // ============================================================
  // generateCSV()
  // ============================================================
  describe('generateCSV', () => {
    it('includes report header', () => {
      const previewData = {
        report: { name: 'Test Report' },
        client: { name: 'Test Client' },
        generatedAt: '2024-01-20T12:00:00Z',
        visualizations: [],
      }

      const result = (reportService as any).generateCSV(previewData)

      expect(result).toContain('Report: Test Report')
      expect(result).toContain('Client: Test Client')
      expect(result).toContain('Generated:')
    })

    it('includes KPI summary section', () => {
      const previewData = {
        report: { name: 'Test Report' },
        client: { name: 'Test Client' },
        generatedAt: '2024-01-20T12:00:00Z',
        visualizations: [
          { type: 'kpi', title: 'Total Spend', formattedValue: '$1,000', trend: 15.5 },
          { type: 'kpi', title: 'ROAS', formattedValue: '4.5x', trend: -5.2 },
        ],
      }

      const result = (reportService as any).generateCSV(previewData)

      expect(result).toContain('Key Metrics')
      expect(result).toContain('Metric,Value,Trend')
      expect(result).toContain('"Total Spend","$1,000","+15.5%"')
      expect(result).toContain('"ROAS","4.5x","-5.2%"')
    })

    it('includes chart data sections', () => {
      const previewData = {
        report: { name: 'Test Report' },
        client: { name: 'Test Client' },
        generatedAt: '2024-01-20T12:00:00Z',
        visualizations: [
          {
            type: 'bar',
            title: 'Spend by Campaign',
            data: [
              { campaign: 'A', spend: 100 },
              { campaign: 'B', spend: 200 },
            ],
          },
        ],
      }

      const result = (reportService as any).generateCSV(previewData)

      expect(result).toContain('Spend by Campaign')
      expect(result).toContain('campaign,spend')
      expect(result).toContain('"A","100"')
      expect(result).toContain('"B","200"')
    })

    it('handles visualizations without trend', () => {
      const previewData = {
        report: { name: 'Test' },
        client: { name: 'Client' },
        generatedAt: '2024-01-20',
        visualizations: [
          { type: 'kpi', title: 'Spend', formattedValue: '$100', trend: null },
        ],
      }

      const result = (reportService as any).generateCSV(previewData)

      expect(result).toContain('"Spend","$100",""')
    })
  })

  // ============================================================
  // extractDataForPDF()
  // ============================================================
  describe('extractDataForPDF', () => {
    it('extracts KPI values from visualizations', () => {
      const previewData = {
        visualizations: [
          { type: 'kpi', config: { metric: 'spend' }, value: 1000 },
          { type: 'kpi', config: { metric: 'roas' }, value: 4.5 },
          { type: 'bar', config: { metric: 'impressions' }, value: 50000 }, // not a KPI
        ],
      }

      const result = (reportService as any).extractDataForPDF(previewData)

      expect(result.spend).toBe(1000)
      expect(result.roas).toBe(4.5)
      expect(result.impressions).toBeUndefined() // bar chart not included
    })

    it('returns empty object for no KPIs', () => {
      const previewData = {
        visualizations: [
          { type: 'bar', config: { metric: 'spend' }, value: 1000 },
        ],
      }

      const result = (reportService as any).extractDataForPDF(previewData)

      expect(result).toEqual({})
    })

    it('handles KPIs without metric config', () => {
      const previewData = {
        visualizations: [
          { type: 'kpi', config: {}, value: 1000 },
        ],
      }

      const result = (reportService as any).extractDataForPDF(previewData)

      expect(result).toEqual({})
    })
  })

  // ============================================================
  // simulatePreviousValue()
  // ============================================================
  describe('simulatePreviousValue', () => {
    it('returns value within 90-110% range', () => {
      const currentValue = 100

      // Run multiple times to check range (deterministic is hard due to randomness)
      for (let i = 0; i < 20; i++) {
        const result = (reportService as any).simulatePreviousValue(currentValue)
        expect(result).toBeGreaterThanOrEqual(90)
        expect(result).toBeLessThanOrEqual(110)
      }
    })

    it('handles zero current value', () => {
      const result = (reportService as any).simulatePreviousValue(0)
      expect(result).toBe(0)
    })

    it('handles negative current value', () => {
      const currentValue = -100
      const result = (reportService as any).simulatePreviousValue(currentValue)

      // -100 * (0.9 to 1.1) = -110 to -90
      expect(result).toBeLessThanOrEqual(-90)
      expect(result).toBeGreaterThanOrEqual(-110)
    })
  })
})
